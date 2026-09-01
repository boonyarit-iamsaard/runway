# Research Bangkok calendar operations

Type: research
Status: resolved
Blocked by: 07

## Question

Determine whether the resolved Bangkok-local Calendar date contract requires any additional Railway, PostgreSQL, or runtime operational decision beyond application-level clock resolution and bound date parameters.

Use current official Railway, PostgreSQL, Node.js, and Next.js documentation where relevant. Establish whether the MVP needs an explicit PostgreSQL session timezone, Railway environment/service setting, runtime guard, migration/configuration check, or production/test verification to keep `Asia/Bangkok` application dates aligned. Separate facts from recommendations, identify any conflict with accepted ADRs, and save a cited report under `.scratch/tracking-mvp/research/` without changing the application architecture.

## Answer

No. The resolved [money and calendar contract](07-decide-money-and-calendar-contract.md)
is time-zone-independent by construction, and the MVP needs no PostgreSQL session
timezone, no Railway `TZ` service variable, and no timezone-related migration or
configuration change. The cited report is
[Bangkok calendar operations](../research/10-bangkok-calendar-operations.md)
(captured on the throwaway branch `research/bangkok-calendar-operations`,
commit `4ce5a63`).

### Why no setting is needed

Four mechanisms can shift a calendar day; the contract uses exactly one of them.
`Intl.DateTimeFormat` with an explicit `timeZone` ignores the host zone per
ECMA-402, so the Bangkok clock resolver is correct under any process `TZ`.
PostgreSQL `date` carries no zone, and the cluster `TimeZone` becomes load-bearing
only for `date`-to-`timestamptz` comparison, `date_trunc`/casts on `timestamptz`,
and `CURRENT_DATE` — all three already excluded by the contract. The cluster zone
is fixed at `initdb` time and is not a Railway-exposed setting, so adding `TZ` to
a Railway PostgreSQL service would change nothing.

### Facts that make the safety non-obvious

- The `pg` driver's own `date` parser forces `YYYY-MM-DD` to local midnight.
  Drizzle's `node-postgres` session overrides it per query to return the raw
  string, so `date()` string mode never builds a JavaScript `Date`. That override
  lives on Drizzle's query config: a raw `pool.query()` outside Drizzle restores
  the local-midnight behavior.
- `DateStyle`, not `TimeZone`, is the one server setting that could break
  `CalendarDate`, because it controls date output format and its `initdb` default
  follows `lc_time`. ISO input is unambiguous in every mode.
- Drizzle's `timestamp` without time zone reconstructs instants by string
  concatenation with `+0000`; `timestamptz` preserves the absolute instant under
  any process zone. Operational Instant columns therefore want `timestamptz`.
- `Asia/Bangkok` has had a single unconditional `+07:00` rule with no DST since
  1920, so tzdata drift is not a risk for this contract.
- Railway interprets no timezone variable, and build-time variables need an
  explicit Dockerfile `ARG`, so a `TZ` service variable would not reach
  `next build`.

### Residual risks, all bypasses rather than missing settings

Raw `pool.query()` in `packages/db` bootstrap, reset, or fixture helpers;
a future `date({ mode: "date" })`; a `timestamp` without time zone for an Instant;
`CURRENT_DATE` creeping into a query; a non-ISO cluster `DateStyle`; and enabling
Cache Components without deferring the clock.

### Recommendations carried forward, not accepted here

The report recommends four cheap non-architectural commitments: a deliberate
uniform-UTC process zone with a written rationale rather than `TZ=Asia/Bangkok`,
a one-off `SHOW TimeZone; SHOW DateStyle;` check of the Railway cluster, a
read-only `Intl`/`Asia/Bangkok` assertion at startup, and a multi-`TZ` test
obligation. Their exact form is a decision, not a fact, and is owned by
[Decide the Bangkok clock operational commitments](11-decide-bangkok-clock-commitments.md).

### ADR conflicts

None. ADR 0003 is reinforced — keeping Drizzle the sole query path is what removes
the local-midnight conversion, and the recommended assertion is read-only, so no
startup DDL. ADR 0006's acceptance of Railway's unmanaged PostgreSQL is made safe
by the finding that no server-side timezone configuration is required. ADR 0002 is
unaffected: the clock resolver stays a framework-neutral server-side function.
