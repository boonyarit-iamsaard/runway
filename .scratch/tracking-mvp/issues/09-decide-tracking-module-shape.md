# Decide the tracking module shape

Type: grilling
Status: resolved
Blocked by: 04, 05, 06, 07

## Question

Once identity, persistence, interaction, and data contracts are settled, decide how the tracking MVP fits ADR 0002's vertical feature-module architecture.

Settle whether tracking is one deep feature or several collaborating features; name the public operations and result contracts needed by the Transactions, Summary, Account settings, and Category settings surfaces; assign transaction boundaries and authorization ownership; and identify what, if anything, belongs in `packages/db` or `packages/ui` rather than inside the feature. Use `codebase-design` alongside `grilling` and `domain-modeling`. The result must be specific enough for `/to-spec` without turning into implementation tickets.

## Answer

Tracking is one feature module with a deliberately small public interface, two
entry points, and a framework-neutral half that can be extracted whole if a
second deployable ever becomes real. Nothing tracking-shaped moves into a shared
package for this MVP.

Throughout this answer, `Transaction` keeps its
[CONTEXT.md](../../../CONTEXT.md) meaning of one recorded movement of Money. The
database grouping mechanism is called an **atomic write** so the two never share
a word.

### One feature, not several

The MVP has one `tracking` feature under `apps/web/src/features/tracking`, with a
single public interface. Sibling `accounts`, `categories`, `transactions`, and
`summary` features were rejected: Balance derivation needs Accounts and the
Ledger together, a Transfer is one row touching two Accounts, the zero-Balance
archive guard makes Account lifecycle depend on the Ledger, and the Summary reads
all three tables in one payload. Splitting them would turn each of those into a
cross-feature call and would distribute one feature across shallow modules before
their interfaces are known, which
[ADR 0002](../../../docs/adr/0002-organize-code-as-vertical-feature-modules.md)
explicitly refuses. Accounts, Categories, Transactions, Summary, and provisioning
remain internal seams that the feature's own tests may exercise, not public
features.

### Module structure

```text
apps/web/src/
  app/transactions/page.tsx      route file: reads searchParams, renders the page component
  features/tracking/
    index.ts   operations, input schemas, result and domain types, toUserId
    ui.ts      page components for the route tree; never re-exports index.ts
    domain/       Money, CalendarDate, Period, UserId, TrackingResult, input schemas
    operations/   framework-neutral use cases; Drizzle called directly
    server/       Server Actions, session translation, DTO mapping
    ui/           MUI components
```

The route tree holds routing only. Placing Server Actions and presentation under
`app/` would put the feature's own seam outside the directory that names it.

There are two entry points rather than one. `index.ts` is the framework-neutral
interface a second adapter would consume and the primary contract-test surface;
`ui.ts` carries presentation. A single barrel exporting both would pull
`packages/db` into the client module graph. This is a deliberate exception to the
repository's TypeScript house style, which bans barrel files inside app code:
ADR 0002 requires the feature root interface, and an accepted ADR outranks the
house style.

`server/` is the only place that touches Next.js types and the only place that
maps domain values into the serializable DTOs settled by
[the money and calendar contract](07-decide-money-and-calendar-contract.md).
`operations/` stays importable by tests without Next.js.

### Public interface

Reads are surface-shaped, one per surface. Entity-level reads composed by the
adapter were rejected because the adapter would then own Period arithmetic, the
`asAtDate = min(periodEnd, today)` rule, the reserved `Other` breakdown, and
liveness selection — all of which
[the persistence decision](05-decide-ledger-persistence-boundary.md) and the
money and calendar contract place on the server side of the seam.

```text
getTransactionsPage({ identity, period, today, categoryFilter? })
getSummary({ identity, period, today })
getAccountSettings({ identity, includeArchived })
getCategorySettings({ identity, includeArchived })

createTransaction   updateTransaction   deleteTransaction

createAccount   updateAccount   moveAccount
archiveAccount  unarchiveAccount  deleteAccount

createCategory   updateCategory
archiveCategory  unarchiveCategory  deleteCategory

ensureTrackingReady({ identity })   provisionDefaultSet({ userId })
```

Three deliberate calls inside that list:

- **No Undo operation.** Undo is create-only, so it is `deleteTransaction`
  invoked by a second Server Action with the same revalidation, as
  [the interaction contract](06-decide-next-interaction-contract.md) already
  specifies.
- **Archive and unarchive stay separate operations**, not one boolean-parameter
  operation. The asymmetry is real: archiving an Account carries the zero-Balance
  guard, archiving a Parent category cascades to Child categories, and
  unarchiving does neither.
- **`moveAccount({ accountId, direction })`** carries the neighbour swap rather
  than exposing display order as a coordinate system.

`getAccountSettings` returns each Account's current Balance even though the
settings list shows no balances, because a refused archive must be able to
explain itself before the User attempts it.

`getTransactionsPage` carries the live Accounts and live Categories the entry
sheet needs, and the current Calendar date it uses as the default, so the browser
never derives a date of its own.

### Result contracts

Expected failures are values, not thrown errors. One hand-rolled Result type
serves the whole feature; a Result library is not adopted.

```ts
type TrackingResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: TrackingError };

type TrackingError =
  | { kind: "notFound" }
  | { kind: "invalidInput"; fields: readonly FieldError[] }
  | { kind: "notPermitted"; reason: NotPermittedReason }
  | { kind: "setupRequired"; retryable: boolean };
```

`invalidInput` renders beside its fields and `notPermitted` renders above Save,
matching the accepted validation presentation. `notFound` is returned identically
for an absent identifier and another User's identifier. Database constraint
violations continue to throw: they remain the final write guard, not the ordinary
user-facing path.

Transport input is parsed with zod, which this decision introduces as a new
runtime dependency. The schemas live in `domain/` beside the input types they
produce, not in `server/`. An adapter invokes a schema; it does not own one. This
keeps one source of truth for validation and makes a second adapter cheap.

### Atomic writes and locks

PostgreSQL enforces every rule expressible as a row or reference constraint.
These operations additionally need a feature-owned atomic write, because they
read other rows before writing and must not be interleaved:

| Operation                                | Rule protected                                                                       | Lock target             |
| ---------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------- |
| `createTransaction`, `updateTransaction` | date not before the Opening date of each involved Account                            | the Account rows        |
| `updateAccount`                          | a new Opening date can invalidate existing Transactions                              | the Account row         |
| `archiveAccount`                         | Balance must be zero                                                                 | the Account row         |
| `createCategory`, `updateCategory`       | a Parent category must not itself have a parent                                      | the parent Category row |
| `archiveCategory`                        | Child categories are archived in the same write                                      | the parent Category row |
| `unarchiveCategory`                      | the Parent category must be live                                                     | the parent Category row |
| `moveAccount`                            | two Accounts change order together                                                   | both Account rows       |
| `provisionDefaultSet`                    | settled by [the identity decision](04-decide-identity-ownership-and-default-data.md) | the receipt row         |

`deleteTransaction`, `createAccount`, `unarchiveAccount`, `deleteAccount`, and
`deleteCategory` are single statements; PostgreSQL is their whole guard.

The Account row is deliberately the shared lock target. `createTransaction`
taking a share lock and `archiveAccount` taking an exclusive one is what makes
"archive a zero-Balance Account" and "record an Expense against it" serialize
rather than interleave into an Archived account holding money.

`getSummary` is one statement built from common table expressions, so the hero
figures, the category breakdown, and the as-of Balances come from one snapshot; a
visible internal disagreement on that surface would read as a defect.
`getTransactionsPage` issues independent queries, because nothing in its payload
has to agree with anything else in it. No read uses `REPEATABLE READ`.

### Authorization and the provisioning gate

Authorization stays inside tracking on every read and mutation, as already
decided. The Default-set gate is a separate operation rather than a case folded
into all twenty: folding it in would duplicate the retry-once rule everywhere.

One `server/` helper composes session validation, `ensureTrackingReady`, and the
surface call, and is used by all four page entry points and every Server Action.
`setupRequired` nonetheless remains in the error union, so a mutation that
somehow bypasses the helper fails closed instead of writing.

Better Auth session validation stays an `apps/web` server module, because it also
serves Profile, Security, and Appearance. It imports `toUserId` from tracking and
calls it; tracking never imports the authentication module. No global `auth`
package is created.

### Persistence seam

Operations call Drizzle directly. No repository or persistence-shaped module sits
between them, publicly or privately: the owner-qualified predicate belongs in the
query where a reviewer can see it, rather than behind a method that might omit
one. The transaction primitive is imported from `packages/db` rather than passed
as a parameter, because the tests run against real PostgreSQL and there is no
second adapter to substitute.

### Shared packages and extraction readiness

Nothing tracking-shaped leaves the feature. `packages/ui` receives the MUI theme
and genuinely domain-free primitives only; the keypad, Category picker, category
bars, Summary panels, and Transaction row each have one consumer and stay inside
the feature. `Money` and `CalendarDate` are domain values and stay in `domain/`.
`packages/db` keeps exactly what
[ADR 0003](../../../docs/adr/0003-use-postgresql-and-drizzle.md) and
[the test architecture](08-decide-test-architecture.md) give it, and is
`operations/`' only workspace dependency.

If a second deployable ever becomes real, `domain/` and `operations/` move whole
to **`packages/tracking`** — not `packages/core` or `packages/domain`, whose
names ADR 0002 rejected. What moves is one feature's framework-neutral half, so
it keeps the feature's name and the vertical module survives the extraction.
`server/` and `ui/` never move.

Four conditions keep that a move rather than a rewrite, and are obligations of
this decision rather than intentions:

1. Dependencies run one way: `ui/` to `server/` to `operations/` to `domain/`,
   never upward. `operations/` and `domain/` import no `next/*`, `react`,
   `@mui/*`, or `better-auth/*`.
2. `UserId` and `TrackingIdentity` live in `domain/`, with `toUserId` exported
   from `index.ts`.
3. Input schemas live in `domain/`, so each adapter parses with the same schema.
4. `packages/db` is `operations/`' only workspace dependency.

Condition 1 is enforced by Biome's `noRestrictedImports` in an `overrides` block
scoped to `features/tracking/domain/**` and `features/tracking/operations/**`. A
machine-enforced rule is required here because extractability is invisible until
the day it is needed, by which time one stray framework import has removed it.

Whether a separate Hono deployable should exist is
[ADR 0001](../../../docs/adr/0001-adopt-a-single-deployable-modular-monolith.md)'s
question and is out of scope for this map. This decision buys the option; it does
not exercise it.

### A new domain rule

Resolving `unarchiveCategory` exposed a case the archived decisions never
covered: unarchiving a Child category whose Parent category is still archived.
Archiving a Parent category cascades downward precisely because a live Child
category under an Archived category is unreachable in any view that groups by
parent, but the reverse path was never ruled on.

This is refused. **Every live Category has a live Parent category.** The User
restores the Parent category first, which is already the flow the settings
surface was designed around: reveal archived rows, restore the parent, then
restore the Child categories wanted under their now-live parent.

Permitting it was rejected because it does not remove the decision, it relocates
it: "live" would stop meaning "usable", and the Category picker, settings list,
Summary breakdown, and Transaction validation would each have to recompute
usability as own-state-and-parent-state. Automatically restoring the Parent
category alongside the child preserves the invariant at one fewer interaction,
but adds a third confirmation case to a surface deliberately limited to two, and
was not adopted.

The invariant is recorded in [CONTEXT.md](../../../CONTEXT.md) as language.

### Verification obligations

The test architecture must cover, beyond what it already carries:

- every public operation returning `TrackingResult` rather than throwing for
  expected failures, with `notFound` identical for absent and foreign
  identifiers;
- concurrent `archiveAccount` and `createTransaction` on one Account serializing
  into either a refused archive or a refused Transaction, never an Archived
  account with a non-zero Balance;
- `unarchiveCategory` refused while the Parent category is archived, and
  permitted once it is live;
- `getSummary` returning internally consistent figures under a concurrent write;
- a Server Action reached without the composition helper still failing closed on
  `setupRequired`;
- `domain/` and `operations/` importing no framework module, enforced by lint
  rather than by review.

### ADR conflicts

None. The decision follows ADRs 0001, 0002, 0003, and 0004, and adds no
architecture the accepted ADRs exclude. The one deliberate deviation is from the
TypeScript house style rather than an ADR: the feature root barrel is required by
ADR 0002, which outranks it. zod is a new runtime dependency and the Biome import
restriction is a new lint rule; both are consequences of this decision, recorded
here for `/to-spec`.
