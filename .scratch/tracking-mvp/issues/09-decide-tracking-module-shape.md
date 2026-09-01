# Decide the tracking module shape

Type: grilling
Status: resolved
Blocked by: 04, 05, 06, 07

## Question

Once identity, persistence, interaction, and data contracts are settled, decide how the tracking MVP fits ADR 0002's vertical feature-module architecture.

Settle whether tracking is one deep feature or several collaborating features; name the public operations and result contracts needed by the Transactions, Summary, Account settings, and Category settings surfaces; assign transaction boundaries and authorization ownership; and identify what, if anything, belongs in `packages/db` or `packages/ui` rather than inside the feature. Use `codebase-design` alongside `grilling` and `domain-modeling`. The result must be specific enough for `/to-spec` without turning into implementation tickets.

## Answer

Tracking is one feature module with a deliberately small public interface, one
server-only entry point, and a framework-neutral half organized around behavior
that can be extracted whole if a second deployable ever becomes real. Nothing
tracking-shaped moves into a shared package for this MVP.

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
explicitly refuses. Transaction recording, Ledger reading, Account lifecycle,
Category lifecycle, and Default-set provisioning remain internal modules, not
public features.

### Module structure

```text
apps/web/src/
  app/transactions/page.tsx      route file: reads searchParams, renders the page component
  features/tracking/
    index.ts                server-only public interface
    domain/                 shared Money, Calendar, identity, and result modules
    transaction-recording/  Transactions page read and Transaction writes
    ledger-reading/         Summary and Balance reads
    account-lifecycle/      Account settings, ordering, and lifecycle
    category-lifecycle/     Category settings, hierarchy, and lifecycle
    provisioning/           Default set delivery and readiness
    server/                 protected invocation, Server Actions, DTO mapping
    ui/                     MUI presentation
```

The route tree holds routing only. Placing Server Actions and presentation under
`app/` would put the feature's own seam outside the directory that names it.

There is one public entry point. `index.ts` imports `server-only` and is the
interface used by the Server Module route tree, server-side callers, and public
contract tests. It exports the server-rendered page modules alongside the
framework-neutral operations, input schemas, result and domain types. The
operation interfaces themselves remain free of Next.js, React, MUI, and Better
Auth types.

Interactive Client Modules remain internal to `ui/` and never import or
back-import through `index.ts`; they receive serializable values and dedicated
Server Actions from their Server Module parents. A Server Module importing a
Client Module through the root does not put the root's other exports into the
client module graph: the graph begins at the file marked `"use client"` and
follows that file's imports. The `server-only` marker turns any accidental
runtime import of the mixed root from a Client Module into a build failure.

A separate public `ui.ts` was considered and rejected. It would contradict
[ADR 0002](../../../docs/adr/0002-organize-code-as-vertical-feature-modules.md)'s
root-`index.ts` rule and the repository's existing Biome restriction without a
current Client Module caller that needs a presentation-only public seam. If such
a caller becomes real, that is the point to revisit the interface and its import
rule rather than keeping a second entry point hypothetical.

`server/` is the only place that touches Next.js types and the only place that
maps domain values into the serializable DTOs settled by
[the money and calendar contract](07-decide-money-and-calendar-contract.md).
The five behavior modules and `domain/` stay importable by tests without Next.js.

The behavior modules own framework-neutral workflows and call Drizzle directly.
Their private dependency graph is deliberately acyclic:

```text
transaction-recording
  ├─> account-lifecycle     Account eligibility and locking
  └─> category-lifecycle    Category eligibility

account-lifecycle
  └─> ledger-reading        Balance and Ledger-date calculations

ledger-reading              surface-shaped reads across tracking tables
category-lifecycle          hierarchy and liveness
provisioning                receipt and Default set atomic write
```

These are behavior-shaped internal seams, not separate public interfaces.
Ledger reading may query all tracking tables for a surface-shaped projection
without routing through shallow pass-through modules.

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
runtime dependency. Each behavior module owns its input schemas beside the
inputs they produce, plus its outputs and private failures. An adapter invokes a
schema; it does not own one. `domain/` keeps only genuinely shared values and
contracts: Money, Calendar, identity, and `TrackingResult`. This keeps one source
of truth for validation without turning `domain/` into a miscellaneous technical
module.

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

Account lifecycle owns that Account eligibility and locking implementation
behind a private internal seam used by Transaction recording. Category lifecycle
likewise owns Category eligibility. Ledger reading owns Balance and Ledger-date
calculation used by Account lifecycle. No standalone persistence-shaped module
is added for any of these collaborations.

`getSummary` is one statement built from common table expressions, so the hero
figures, the category breakdown, and the as-of Balances come from one snapshot; a
visible internal disagreement on that surface would read as a defect.
`getTransactionsPage` issues independent queries, because nothing in its payload
has to agree with anything else in it. No read uses `REPEATABLE READ`.

### Authorization and the provisioning gate

Authorization stays inside tracking on every read and mutation, as already
decided. The Default-set gate is a separate operation rather than a case folded
into all twenty: folding it in would duplicate the retry-once rule everywhere.

One deep protected-invocation module in `server/` composes session validation,
identity translation, `ensureTrackingReady`, retry-once behavior, the surface
call, result mapping, and route freshness. It is used by all four page entry
points and every Server Action; individual adapters retain only transport
parsing and presentation-specific mapping. `setupRequired` nonetheless remains
in the error union, so a mutation that somehow bypasses the module fails closed
instead of writing.

Better Auth session validation stays an `apps/web` server module, because it also
serves Profile, Security, and Appearance. It imports `toUserId` from tracking and
calls it; tracking never imports the authentication module. No global `auth`
package is created.

### Persistence seam

Framework-neutral behavior modules call Drizzle directly. No repository or
persistence-shaped module sits between them and the database: the owner-qualified
predicate belongs in the behavior module where a reviewer can see it, rather
than behind a method that might omit one. Private collaboration between behavior
modules concentrates domain rules; it is not a persistence adapter. The
transaction primitive is imported from `packages/db` rather than passed as a
parameter, because the tests run against real PostgreSQL and there is no second
adapter to substitute.

### Shared packages and extraction readiness

Nothing tracking-shaped leaves the feature. `packages/ui` receives the MUI theme
and genuinely domain-free primitives only; the keypad, Category picker, category
bars, Summary panels, and Transaction row each have one consumer and stay inside
the feature. Money and Calendar are deep shared domain modules: Money owns exact
Satang construction, parsing, normalization, and formatting policy; Calendar
owns Calendar date and Period arithmetic, Bangkok date resolution, and as-of
Balance-date policy. Runtime and persistence adapters remain narrow checks at
their seams.

`packages/db` keeps exactly what
[ADR 0003](../../../docs/adr/0003-use-postgresql-and-drizzle.md) and
[the test architecture](08-decide-test-architecture.md) give it, and is the only
workspace dependency of `domain/` and the five behavior modules.

If a second deployable ever becomes real, `domain/` plus all five behavior
modules move whole to **`packages/tracking`** — not `packages/core` or
`packages/domain`, whose names ADR 0002 rejected. What moves is one feature's
framework-neutral half, so it keeps the feature's name and the vertical module
survives the extraction. `server/` and `ui/` never move.

Five conditions keep that a move rather than a rewrite, and are obligations of
this decision rather than intentions:

1. Runtime dependencies run one way: `ui/` to `server/` to the behavior modules
   to `domain/`, never upward. `domain/` and all five behavior modules import no
   `next/*`, `react`, `@mui/*`, or `better-auth/*`.
2. `UserId` and `TrackingIdentity` live in `domain/`, with `toUserId` exported
   from `index.ts`.
3. Each input schema lives in its owning behavior module, so every adapter parses
   with the same schema.
4. Behavior-module collaboration follows the explicit acyclic graph above.
5. `packages/db` is the framework-neutral half's only workspace dependency.

Condition 1 is enforced by Biome's `noRestrictedImports` in an `overrides` block
scoped to `features/tracking/domain/**` and all five behavior-module paths. A
machine-enforced rule is required here because extractability is invisible until
the day it is needed, by which time one stray framework import has removed it.
The repository-wide feature import rule continues to require outside callers to
use `@/features/tracking`; `index.ts`'s `server-only` marker independently guards
the Next.js module graph.

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
- a production build failing if a Client Module imports the server-only feature
  root, with Client Modules importing only their internal dependencies; and
- `domain/` and all five behavior modules importing no framework module,
  enforced by lint rather than by review.

Real-PostgreSQL behavior tests are grouped beside the five behavior modules but
invoke the public tracking interface. Pure Money and Calendar tests exercise
those deep domain interfaces directly. Focused internal tests are reserved for
meaningful private seams such as Account locking; thin Next.js adapter tests stay
beside `server/`, and the accepted Playwright coverage remains unchanged. Tests
follow interfaces rather than mirroring every internal file.

### ADR conflicts

None. The decision follows ADRs 0001, 0002, 0003, and 0004, and adds no
architecture the accepted ADRs exclude. An earlier draft's separate public
`ui.ts` contradicted ADR 0002 and the repository's existing Biome restriction;
the single server-only root resolves that conflict without reopening the ADR.
The one deliberate deviation is from the TypeScript house style rather than an
ADR: the feature root barrel is required by ADR 0002, which outranks it. zod is a
new runtime dependency and the framework-import restriction is a new lint rule;
both are consequences of this decision, recorded here for `/to-spec`.

## Comments

### Architecture review follow-up — 2026-09-01

The persisted architecture review exposed a contradiction between this answer's
former public `ui.ts`, ADR 0002's root-`index.ts` rule, and Biome's matching import
restriction. Follow-up grilling confirmed that Next.js begins the client module
graph at `"use client"` files rather than at their Server Module importers. The
accepted resolution is therefore one server-only root imported by route files,
with interactive Client Modules kept internal and forbidden from back-importing
the root. No domain term changed and ADR 0002 did not need reopening.

### Architecture deepening follow-up — 2026-09-01

The same review found that the former `domain/` to `operations/` pipeline would
distribute one behavior across shallow technical modules. Follow-up grilling
replaced `operations/` with five framework-neutral behavior modules while
retaining `server/` and `ui/` as real runtime seams. It also settled private
collaboration, contract locality, test surfaces, and extraction enforcement.
Money and Calendar remain shared deep domain modules. No domain vocabulary or
accepted ADR changed.
