# Decide the Bangkok clock operational commitments

Type: grilling
Status: resolved
Blocked by: 08, 10

## Question

Decide the operational commitments that keep the Bangkok Calendar date contract
true in development, CI, and Railway, given that
[Research Bangkok calendar operations](10-research-bangkok-calendar-operations.md)
established that no platform setting is required.

Settle four things the research narrowed but did not close: whether the deliberate
uniform-UTC process zone is recorded as a deployment note, a configuration comment,
or an ADR consequence; whether a read-only `Intl`/`Asia/Bangkok` startup assertion
earns an `instrumentation.ts` before one exists for another reason; which second
`TZ` value the test matrix uses and whether it applies to the whole Vitest project
or only pure date resolution; and whether operational Instant columns are specified
as `timestamptz` in the persistence decision or restated as a standalone rule.

Also decide which of the report's six residual bypasses — raw `pool.query()` in
test helpers, `date({ mode: "date" })`, `timestamp` without time zone,
`CURRENT_DATE`, a non-ISO cluster `DateStyle`, and Cache Components without a
deferred clock — become explicit obligations on the
[test architecture](08-decide-test-architecture.md) versus review-time conventions.
Do not reopen the settled contract or introduce a platform timezone setting.

## Answer

Adopt six cheap operational commitments. None changes the resolved
[money and calendar contract](07-decide-money-and-calendar-contract.md), adds a
platform timezone setting, or introduces new tooling. Their shared purpose is to
convert "the process time zone is never consulted" from a property that happens
to be true into one that is written down, asserted, and tested.

### The uniform-UTC process zone is an ADR 0006 consequence

Recorded as a consequence and a rejected alternative on
[Deploy to Railway with a custom Dockerfile](../../../docs/adr/0006-deploy-to-railway-with-a-custom-dockerfile.md),
amended by this decision, not as a deployment note or a bare comment. The
Dockerfile is where `TZ=Asia/Bangkok` would plausibly be added by a future
reader, and ADR 0006 already owns the Dockerfile; a deployment note reaches
nobody, and a comment reaches only someone already editing that file.

The specification carries one obligation from this: the Dockerfile includes a
one-line comment stating that the process zone is deliberately UTC and pointing
at ADR 0006. A new standalone ADR was rejected — the setting is trivially
reversible, so it fails the hard-to-reverse test; what is worth recording is the
rejected alternative, which now lives in the ADR that owns it.

### The startup assertion earns an `instrumentation.ts`

Create `instrumentation.ts` for this assertion alone, before any other reason
exists for the file. Its `register` asserts that `Intl` exists and that
`new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).resolvedOptions().timeZone`
is `"Asia/Bangkok"`, and does nothing else.

It is justified because the failure it catches — an ICU-less or misbuilt image —
is invisible to every test, since tests never run the production image, and its
symptom is silently wrong Calendar dates for every user rather than a crash.
Boot-time failure means Railway's health check fails before one wrong date is
served; asserting lazily inside the Bangkok clock resolver instead would fail
only at the first Summary read.

The file's charter is read-only assertions only. It performs no DDL, no
migration, and no database work of any kind, so
[ADR 0003](../../../docs/adr/0003-use-postgresql-and-drizzle.md)'s rule against
running migrations from every application process at startup is preserved.

### The `TZ` test matrix is `UTC` plus `Pacific/Honolulu`, applied narrowly

The default process zone for the whole suite stays `UTC`, matching production.
A dedicated Vitest project runs the pure Money, Calendar, Period, and Bangkok
date-resolution tests a second time under `Pacific/Honolulu`, set through
Vitest's `env` configuration option, asserting identical results.

`Pacific/Honolulu` is chosen over the researched `Pacific/Kiritimati` because
Bangkok is `+07:00` and Kiritimati is `+14:00`: at the boundary instants that
matter most, the two agree on the calendar day, so a host-local implementation
could pass. A zone behind UTC disagrees with Bangkok across a far wider band.
Honolulu has been a fixed `-10:00` with no daylight saving since 1947, so the
matrix stays deterministic; any zone with DST is disqualified for that reason.

The whole Vitest project does not run twice. Integration tests are serialized
against a single PostgreSQL database, so a second pass would double CI time for
no additional coverage. The obligation includes choosing fixture Instants at
which `UTC`, `Asia/Bangkok`, and `Pacific/Honolulu` actually disagree on the
calendar day; a matrix whose fixtures agree everywhere proves nothing.

### `timestamptz` for Instants is a standalone rule stated here

Every operational or audit Instant column is `timestamp with time zone`. Ledger
dates — Transaction dates and Opening dates — remain PostgreSQL `date` read
through Drizzle in string mode.

The rule is stated in this ticket rather than restated into the closed
[ledger persistence and feature boundary](05-decide-ledger-persistence-boundary.md).
The map is an index in which each decision lives in exactly one place, and
reaching back into a resolved answer would make the record ambiguous about when
the rule was decided. It binds the schema specification through this ticket's
entry on the map.

Drizzle's `timestamp` without time zone reconstructs an Instant by concatenating
`+0000` onto the stored wall time, which is correct only while nothing ever
writes a local wall time into that column. `timestamptz` renders an explicit
offset and yields the same absolute instant under every process zone.

### Three of the six residual bypasses become test obligations

On the [test architecture](08-decide-test-architecture.md):

1. **The multi-`TZ` pure resolver matrix** above.
2. **One driver-seam round-trip integration test**: insert a boundary Calendar
   date, read it back through the public tracking interface, and assert the
   exact `YYYY-MM-DD` string, running under a non-UTC `TZ`. This proves
   Drizzle's per-query type-parser override is in effect and fails loudly if a
   future Drizzle version, a driver swap, or a change to `date({ mode: "date" })`
   removes it. It covers residual risks 1 and 2 in the read path and needs no
   new tooling.
3. **One `packages/db` schema test** over `information_schema`, asserting that
   every Instant column is `timestamptz` and every Ledger date column is `date`.
   It covers residual risk 3, costs a single query, and guards a rule that
   otherwise erodes one column at a time.

### Three stay review-time conventions or one-off checks

- **No raw `pool.query()` against date columns** in bootstrap, reset, or fixture
  helpers; these go through Drizzle. Outside Drizzle, `pg`'s default parser
  restores local-midnight `Date` construction.
- **No `date({ mode: "date" })`** at the persistence seam.
- **No `CURRENT_DATE`** in any query. All reads already take an explicit
  `today: CalendarDate`, so this is structurally unlikely as well as grep-able.

`DateStyle` is not a test obligation: CI runs our own PostgreSQL image, so a CI
test proves nothing about the Railway cluster. It is covered by the deployment
verification below.

Cache Components is not an MVP test either. It is recorded as a precondition on
the [Next.js interaction contract](06-decide-next-interaction-contract.md):
enabling Cache Components requires deferring the Bangkok clock behind
`connection()` first, otherwise "today" freezes into a prerendered Summary.

### The cluster check is a deployment-time verification, not a ticket

Run `SHOW TimeZone; SHOW DateStyle;` once against the Railway PostgreSQL service
when it is first provisioned. Pass criterion: `DateStyle` begins `ISO`.
`TimeZone` is informational under this contract and its value is captured
verbatim, so that a later `CURRENT_DATE` regression is recognizable.

This is a named obligation carried into the specification rather than a `task`
ticket on this map. Provisioning Railway is implementation, and this map's
destination stops at `/to-spec`; a ticket blocked on provisioning would prevent
the map from clearing without adding any decision.

### ADR and glossary effects

[ADR 0006](../../../docs/adr/0006-deploy-to-railway-with-a-custom-dockerfile.md)
is amended by this decision with the UTC consequence and the `TZ=Asia/Bangkok`
and PostgreSQL-session-timezone rejections. No accepted ADR is contradicted:
ADR 0003 is reinforced by keeping Drizzle the sole query path, ADR 0002 is
unaffected because the clock resolver stays framework-neutral, and ADR 0006's
acceptance of Railway's unmanaged PostgreSQL is made safe by requiring no
server-side configuration.

`CONTEXT.md` is unchanged. Calendar date, Instant, and Period are already
canonical and sufficient; "Bangkok clock" is an implementation name for the
server-side resolver and stays out of the glossary.
