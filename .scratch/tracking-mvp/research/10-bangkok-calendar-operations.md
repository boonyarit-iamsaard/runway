# Bangkok calendar operations

Researched 1 September 2026 against current first-party documentation, the
published source of the drivers named by the accepted architecture, and the
repository's installed Node 24.16.0. This report establishes operational facts
about where a Bangkok Calendar date can still be corrupted; it does not change
the resolved contract.

## Result

The resolved contract in
[money and calendar](../issues/07-decide-money-and-calendar-contract.md) is
already time-zone-independent by construction, and **no additional Railway,
PostgreSQL, or runtime setting is required to make it correct**. Every
mechanism that could shift a Bangkok day — the PostgreSQL `TimeZone` parameter,
the container `TZ` variable, the ICU time-zone database — is out of the path
that the contract actually uses, provided three conditions the contract already
states hold: dates are persisted as PostgreSQL `date`, read through Drizzle in
string mode, and `today` is resolved with an explicit `Asia/Bangkok` time zone
rather than the host's.

What the research does change is the _reason_ to say so. The contract is safe
not because Bangkok is configured anywhere, but because the process time zone is
never consulted. That safety is load-bearing and non-obvious at three seams —
the Drizzle type-parser override, the PostgreSQL `DateStyle` output format, and
Drizzle's `timestamp`-without-time-zone mapping — so this report recommends a
small number of cheap, non-architectural guards and verifications rather than
any configuration change.

The one recommendation that is a genuine decision rather than a check: **do not
set `TZ=Asia/Bangkok` on the Railway service, and do not set a PostgreSQL
session time zone.** Both would appear to help and would in fact make the
production process the only environment in which host-local code happens to
produce the right answer, converting a class of bug that CI catches into one
that only production hides.

## What actually decides a Bangkok day

Four independent mechanisms can produce or shift a calendar day. The contract
uses exactly one of them.

| Mechanism                                         | Depends on                          | Used by the contract                             |
| ------------------------------------------------- | ----------------------------------- | ------------------------------------------------ |
| `Intl.DateTimeFormat` with an explicit `timeZone` | Nothing but ICU's tz data           | Yes — this is the Bangkok clock resolver         |
| Host process time zone (`TZ`)                     | Container environment               | No                                               |
| PostgreSQL session `TimeZone`                     | `postgresql.conf` / `SET TIME ZONE` | No                                               |
| Driver-side `date` → JavaScript `Date` conversion | Host process time zone              | No, but only because of a Drizzle detail (below) |

## Facts: PostgreSQL

**`date` carries no zone.** The `date` type is four bytes with one-day
resolution and is described as "date (no time of day)". The docs state
plainly that "Although the `date` type cannot have an associated time zone, the
`time` type can."
[Date/Time Types](https://www.postgresql.org/docs/current/datatype-datetime.html)

**Where `TimeZone` does enter.** The same section states: "PostgreSQL assumes
your local time zone for any type containing only date or time. All
timezone-aware dates and times are stored internally in UTC. They are converted
to local time in the zone specified by the `TimeZone` configuration parameter
before being displayed to the client." The date/time function reference is more
specific: "Similarly, a `date` value is assumed to represent midnight in the
`TimeZone` zone when comparing it to a timestamp", and `date_trunc` on a
`timestamptz` truncates "with respect to the current `TimeZone` setting" unless
given an explicit third argument.
[Date/Time Functions](https://www.postgresql.org/docs/current/functions-datetime.html)

So `TimeZone` becomes load-bearing in exactly three situations, all of which the
contract forbids or avoids:

1. comparing a `date` column against a `timestamptz` expression;
2. casting or truncating a `timestamptz` to a day; and
3. `CURRENT_DATE` / `LOCALTIMESTAMP`, which return "values based on the start
   time of the current transaction" rendered in the session zone.
   [Date/Time Functions](https://www.postgresql.org/docs/current/functions-datetime.html)

The contract already bans `CURRENT_DATE` and binds `asAtDate` explicitly, and
Ledger dates are compared to bound `date` parameters, never to instants.

**`date` parameter binding is zone-free but not style-free.** `TimeZone` plays
no part in parsing a `YYYY-MM-DD` literal, and the ISO form is unambiguous under
every `DateStyle` input mode — the docs list `1999-01-08` as "ISO 8601; January
8 in any mode (recommended format)".
[Date/Time Types](https://www.postgresql.org/docs/current/datatype-datetime.html)
The _output_ side is not equally safe: `DateStyle` "Sets the display format for
date and time values", its "built-in default is `ISO, MDY`, but initdb will
initialize the configuration file with a setting that corresponds to the
behavior of the chosen `lc_time` locale".
[Client Connection Defaults](https://www.postgresql.org/docs/current/runtime-config-client.html)
A cluster initialized under a non-ISO `DateStyle` would return `08/01/1999`
where the contract expects `1999-01-08`. This is the only server setting that
can break `CalendarDate` directly, and it is a formatting setting, not a time
zone one.

**How the server default is chosen and where it is fixed.** `TimeZone`'s
"built-in default is `GMT`, but that is typically overridden in
`postgresql.conf`; initdb will install a setting there corresponding to its
system environment".
[Client Connection Defaults](https://www.postgresql.org/docs/current/runtime-config-client.html)
`initdb` reads the `TZ` environment variable, which "Specifies the default time
zone of the created database cluster".
[initdb](https://www.postgresql.org/docs/current/app-initdb.html)
The consequence matters operationally: the cluster zone is written into
`postgresql.conf` **once, at cluster creation**. Adding `TZ` to the Railway
PostgreSQL service afterwards would not change an already-initialized cluster.

**How a session zone could be set, if one were ever wanted.** Three documented
routes: `postgresql.conf`; `SET TIME ZONE` per session; and "The `PGTZ`
environment variable is used by libpq clients to send a `SET TIME ZONE` command
to the server upon connection."
[Date/Time Types §8.5.3](https://www.postgresql.org/docs/current/datatype-datetime.html) ·
[libpq environment variables](https://www.postgresql.org/docs/current/libpq-envars.html)
`PGTZ` is a libpq behavior. `node-postgres` is a pure-JavaScript protocol
implementation and reads `PGOPTIONS` (through its generic `PG<KEY>` lookup for
the `options` connection parameter) but implements no `PGTZ` handling.
[connection-parameters.js](https://github.com/brianc/node-postgres/blob/master/packages/pg/lib/connection-parameters.js)
A session zone would therefore have to travel as `options=-c timezone=...` on
the connection string, or be re-issued on every pooled connection. Under the
process-level pool required by
[ADR 0006](../../../docs/adr/0006-deploy-to-railway-with-a-custom-dockerfile.md),
a per-session `SET` applied anywhere other than the pool's connect handler is
silently unreliable.

## Facts: the driver seam

This is where the contract's safety is least obvious and most worth writing
down.

**`pg` alone would convert `date` to a local-midnight `Date`.** `pg@8.23.0`
pins `pg-types@2.2.0`
([package.json](https://github.com/brianc/node-postgres/blob/master/packages/pg/package.json)),
whose text parsers register OID 1082 (`date`) to `postgres-date`
([textParsers.js](https://github.com/brianc/node-pg-types/blob/v2.2.0/lib/textParsers.js)).
`postgres-date@1.x` contains the comment `// Force YYYY-MM-DD dates to be parsed
as local time` and constructs the value with the multi-argument `Date`
constructor, i.e. local midnight
([index.js](https://github.com/bendrucker/postgres-date/blob/v1.0.7/index.js)).
Verified locally on Node 24.16.0: the local-midnight `Date` for `2026-09-01`
serializes to `2026-09-01T00:00:00.000Z` under `TZ=UTC` but to
`2026-08-31T17:00:00.000Z` under `TZ=Asia/Bangkok` — the day shifts backwards
precisely in the production zone.

**Drizzle removes that conversion.** Drizzle's `node-postgres` session installs
a per-query `getTypeParser` that returns the raw string for `TIMESTAMPTZ`,
`TIMESTAMP`, `DATE`, `INTERVAL` and their array forms before delegating to
`pg-types` for everything else
([session.ts](https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/node-postgres/session.ts)).
Combined with `date()`'s default string mode — `PgDateString.mapFromDriverValue`
returns the string unchanged — a `date` column reaches the application as the
canonical `YYYY-MM-DD` text, and no JavaScript `Date` is ever constructed
([date.ts](https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/pg-core/columns/date.ts) ·
[Drizzle column types](https://orm.drizzle.team/docs/column-types/pg)).

Two consequences follow directly:

- The override lives on the query config Drizzle builds. A raw `pool.query()`
  issued outside Drizzle — a bootstrap script, a reset helper, an ad-hoc
  investigation — gets `pg`'s default parser back and the local-midnight
  behavior with it.
- `date({ mode: "date" })` reintroduces the hazard from the other side:
  `mapFromDriverValue` calls `new Date(value)` and `mapToDriverValue` calls
  `value.toISOString()`. The contract's choice of string mode is the thing
  preventing this, not an incidental preference.

**Instants are safe under any zone, if declared with a zone.** Drizzle's
`timestamp` in `date` mode maps `new Date(this.withTimezone ? value : value +
'+0000')`
([timestamp.ts](https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/pg-core/columns/timestamp.ts)).
For `timestamp with time zone`, PostgreSQL renders an explicit offset and the
resulting `Date` is the same absolute instant under every process zone —
verified locally: `2026-09-01 10:00:00+07` parses to `2026-09-01T03:00:00.000Z`
under `TZ=UTC`, `Asia/Bangkok`, and `America/New_York` alike. For `timestamp`
_without_ time zone, Drizzle assumes the stored wall time is UTC by appending
`+0000`, which is correct only as long as nothing ever writes a local wall time
into that column.

## Facts: the Node runtime

**`TZ` is supported and mutable.** "The `TZ` environment variable is used to
specify the timezone configuration. While Node.js does not support all of the
various ways that `TZ` is handled in other environments, it does support basic
timezone IDs (such as `'Etc/UTC'`, `'Europe/Paris'`, or `'America/New_York'`)."
Since v13.0.0, assigning `process.env.TZ` changes the zone at runtime on POSIX
systems.
[Node.js CLI: TZ](https://nodejs.org/docs/latest-v24.x/api/cli.html#tz)

**Full ICU ships by default.** "The full ICU data set is provided by Node.js by
default" (`--with-intl=full-icu`); `small-icu` and `none` are build-time
opt-outs.
[Node.js internationalization](https://nodejs.org/docs/latest-v24.x/api/intl.html)
The repository's Node 24.16.0 reports ICU 78.3 with tz data 2026b.

**An explicit `timeZone` option overrides the host zone, by specification.**
ECMA-402's `InitializeDateTimeFormat` reads `timeZone` from the options bag and
falls back to `SystemTimeZoneIdentifier()` only when it is `undefined`.
[ECMA-402 InitializeDateTimeFormat](https://tc39.es/ecma402/#sec-initializedatetimeformat)
Implementations "must be time zone aware: they must use the IANA Time Zone
Database … to supply available named time zone identifiers and data used in
ECMAScript calculations and formatting."
[ECMA-402 §6.5](https://tc39.es/ecma402/#sec-time-zone-names)

Verified locally on Node 24.16.0 across `TZ` values `UTC`, `America/New_York`,
`Asia/Bangkok`, and `Pacific/Kiritimati`: formatting the instant
`2026-09-01T17:30:00Z` with `Intl.DateTimeFormat("en-CA", { timeZone:
"Asia/Bangkok", … })` returns `2026-09-02` in every case, while the host-local
formatter returns `2026-09-01` in two of them. `en-CA` yields the canonical
`YYYY-MM-DD` ordering directly.

**Time-zone data drift is a non-risk for this zone.** ECMA-402 notes the IANA
database is "updated between five and ten times per year" and that a Zone is
occasionally replaced (`Europe/Kiev` → `Europe/Kyiv`).
[ECMA-402 §6.5](https://tc39.es/ecma402/#sec-time-zone-names)
The IANA `asia` file gives `Asia/Bangkok` a single unconditional `7:00` rule
with no daylight-saving entries since April 1920.
[IANA tz database, `asia`](https://github.com/eggert/tz/blob/main/asia)
Node's tz data is baked into the binary, so it advances only with a Node
upgrade — which for a fixed-offset, never-renamed zone changes nothing.

**Temporal is not available.** `globalThis.Temporal` is `undefined` on Node
24.16.0 (V8 13.6). The proposal remains a TC39 proposal rather than part of the
language the runtime ships.
[proposal-temporal](https://github.com/tc39/proposal-temporal)
The contract's opaque `CalendarDate` plus `Intl` is the correct current answer;
Temporal is a future simplification, not an MVP option.

## Facts: Railway

**PostgreSQL is the stock image.** A Railway PostgreSQL service is "deployed
from Railway's SSL-enabled Postgres image, which uses the official Postgres
image from Docker Hub as its base".
[Railway PostgreSQL](https://docs.railway.com/databases/postgresql)
That image's Dockerfile is `FROM postgres:${POSTGRES_VERSION}` and sets no `TZ`
or timezone configuration of any kind.
[railwayapp-templates/postgres-ssl](https://github.com/railwayapp-templates/postgres-ssl/blob/main/Dockerfile.18)
Combined with `initdb`'s documented behavior, the cluster's `TimeZone` is
whatever the Debian-based container's environment implied at first
initialization — expected to be UTC, but this is an inference from the image
contents rather than a documented Railway guarantee, and is therefore listed
below as something to verify once rather than something to assume.

**Railway has no time-zone setting.** The variables reference enumerates every
Railway-provided variable and every "user-provided configuration variable" the
platform interprets (`RAILWAY_DOCKERFILE_PATH`, `RAILWAY_RUN_UID`,
`RAILWAY_DEPLOYMENT_DRAINING_SECONDS`, and so on). `TZ` is not among them.
[Railway variables reference](https://docs.railway.com/variables/reference)
`TZ` on a Railway service would be an ordinary service environment variable
with no platform semantics, interpreted only by Node.
[Using variables](https://docs.railway.com/variables)

**Build and runtime environments differ by default.** Variables Railway injects
are available to a Dockerfile build only when explicitly declared: "If you need
to use the environment variables that Railway injects at build time … you must
specify them in the Dockerfile using the `ARG` command."
[Railway Dockerfiles](https://docs.railway.com/builds/dockerfiles)
So a `TZ` service variable would apply at runtime but not during `next build`
unless separately `ARG`-declared — a divergence that only matters for code that
reads the host zone, which is precisely the code the contract forbids.

## Facts: Next.js

**A startup hook exists for a guard.** `instrumentation.ts` exports a `register`
function "called once when a new Next.js server instance is initiated, and must
complete before the server is ready to handle requests".
[instrumentation.js](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation)
This is the documented place for a fail-fast assertion, and it satisfies
[ADR 0003](../../../docs/adr/0003-use-postgresql-and-drizzle.md)'s rule that
migrations must not run from every application process at startup, because a
read-only assertion performs no DDL.

**Environment reads are only reliable at request time.** "You safely read
environment variables on the server during dynamic rendering", with
`connection()` shown as the way to defer evaluation to runtime.
[Self-hosting](https://nextjs.org/docs/app/guides/self-hosting)

**Timestamps are explicitly a prerender concern.** "Operations like
`Math.random()`, `Date.now()`, or `crypto.randomUUID()` produce different values
each time they execute. Cache Components requires you to explicitly handle
these … To generate unique values per request, defer to request time by calling
`connection()` before these operations."
[Partial prerendering](https://nextjs.org/docs/app/getting-started/partial-prerendering)
`next.config.ts` is empty in this repository, so Cache Components is off and
Summary reads are dynamic today — as
[the Next.js interaction research](03-next-interaction-cache-history.md) already
established. Enabling Cache Components later would make the Bangkok clock a
value that must be explicitly deferred, not merely a function that returns a
string.

## Where the contract is already correct

| Contract element                   | Why no operational setting is needed                                                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `today` from the Bangkok clock     | `Intl.DateTimeFormat` with an explicit `timeZone` ignores `SystemTimeZoneIdentifier()` per ECMA-402; verified identical across four host zones |
| Transaction date, Opening date     | PostgreSQL `date` has no zone; Drizzle string mode returns the raw `YYYY-MM-DD`                                                                |
| `asAtDate = min(periodEnd, today)` | Computed in application code on `CalendarDate` values and bound as a parameter; no `CURRENT_DATE`, no `timestamptz` comparison                 |
| Period key, bounds, labels         | Derived server-side from `YYYY-MM` text; no `date_trunc` on an instant                                                                         |
| `Instant` values                   | `timestamptz` renders an explicit offset; the parsed `Date` is the same absolute instant under every process zone                              |
| Client                             | Receives ready-made ISO strings and server-produced labels; never constructs a `Date` from them                                                |

## Residual risks

These are the ways the contract could still be violated in practice. None is a
missing platform setting; each is a way the resolved rules could be
accidentally bypassed.

1. **Raw `pool.query()` outside Drizzle** restores `pg`'s local-midnight `date`
   parser. Most likely in `packages/db` bootstrap, reset, and fixture helpers —
   exactly the code that
   [the test architecture decision](../issues/08-decide-test-architecture.md)
   places outside production exports and least likely to be reviewed for date
   semantics.
2. **A future `date({ mode: "date" })`** silently reintroduces JavaScript `Date`
   at the persistence seam.
3. **A future `timestamp` without time zone** for an operational Instant makes
   Drizzle assume UTC wall time by string concatenation.
4. **`CURRENT_DATE` creeping into a query** for convenience makes correctness
   depend on the cluster's `TimeZone`, which nobody in this project controls
   under Railway's unmanaged model.
5. **A non-ISO cluster `DateStyle`** would return dates in a format
   `CalendarDate` does not accept. Unlikely from the stock image, cheap to rule
   out.
6. **Enabling Cache Components** without deferring the clock would freeze
   "today" into a prerendered Summary.

## Recommendations

These are recommendations, not facts, and none of them changes the application
architecture.

**Decide `TZ` deliberately, and decide it as UTC.** Leave the application
container at UTC and state in the deployment notes that the process time zone is
intentionally not Bangkok. Setting `TZ=Asia/Bangkok` looks like a safety net and
is the opposite: as the local verification above shows, host-local date
formatting coincidentally agrees with Bangkok only when the host is Bangkok, so
the setting would make production the single environment where a contract
violation produces the right answer. Keeping the process zone uniformly UTC
across development, CI, and Railway keeps any host-local dependency wrong
everywhere, which is where a test can see it.

**Do not set a PostgreSQL session time zone.** It is unnecessary for every query
the contract permits, it is unreliable across a process-level pool unless
attached to the pool's connect handler, and adopting it would create a silent
correctness dependency on a server setting the project does not own. If a future
requirement genuinely needs a server-side Bangkok day, the documented route is
`options=-c timezone=Asia/Bangkok` on the connection string — record it as the
rejected alternative rather than as latent configuration.

**Verify the cluster once, not continuously.** A single `SHOW TimeZone; SHOW
DateStyle;` against the Railway PostgreSQL service records what the stock image
actually produced. `DateStyle` must be `ISO, …`; `TimeZone` is informational
under this contract and its value should be captured precisely so a later
`CURRENT_DATE` regression is recognizable. This is a one-off operational note,
not a migration and not a startup check.

**Add one read-only startup assertion.** In `instrumentation.ts`'s `register`,
assert that `Intl` exists and that
`new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).resolvedOptions().timeZone`
is `"Asia/Bangkok"`. This fails fast on an ICU-less or misbuilt image and costs
nothing. Do not put database or migration work in this hook.

**Make time-zone independence an explicit test obligation.** The pure Bangkok
date-resolution unit tests named in the test architecture should run under at
least two contrasting `TZ` values — `UTC` and something far from both UTC and
Bangkok, such as `Pacific/Kiritimati` — asserting identical results. Vitest's
`env` configuration option can set the process environment for a project without
touching application code
([Vitest configuration](https://vitest.dev/config/#env)). This converts "we
never read the host zone" from a convention into a checked property, and it is
the single verification step that would catch every residual risk above except
`DateStyle`.

**Add a targeted integration assertion for the driver seam.** One real-PostgreSQL
test that inserts a boundary date, reads it back through the public feature
interface, and asserts the exact string — run under a non-UTC `TZ` — proves the
Drizzle type-parser override is in effect and would fail loudly if a future
Drizzle version, driver swap, or `mode: "date"` change removed it. This belongs
with the `packages/db` tests already planned, and needs no new tooling.

**Prefer `timestamp with time zone` for every Instant column,** and say so when
the schema is specified. This is the only recommendation with a persistence
consequence, and it is a column-type choice inside the already-accepted
persistence boundary rather than a new decision.

## Conflicts with accepted ADRs

None.

[ADR 0003](../../../docs/adr/0003-use-postgresql-and-drizzle.md) is reinforced
rather than strained: keeping Drizzle as the sole query path is what removes the
`pg` local-midnight conversion, and the recommendation to avoid startup DDL is
already the ADR's own rule.

[ADR 0006](../../../docs/adr/0006-deploy-to-railway-with-a-custom-dockerfile.md)
accepts "Railway PostgreSQL's unmanaged operational model … for the personal
MVP". The finding that no server-side timezone configuration is required is what
makes that acceptance safe for calendar correctness; a contract that depended on
`postgresql.conf` would have quietly contradicted it, because the cluster's zone
is fixed at `initdb` time and is not a Railway-exposed setting.

[ADR 0002](../../../docs/adr/0002-organize-code-as-vertical-feature-modules.md)
is unaffected: the Bangkok clock resolver stays a framework-neutral server-side
function, and the recommended startup assertion touches no feature module.

## Answer to the ticket question

No additional Railway, PostgreSQL, or runtime _setting_ is required. The MVP
needs no explicit PostgreSQL session timezone, no Railway `TZ` service variable,
and no timezone-related migration or configuration change. It does warrant four
cheap operational commitments, all outside the application architecture: a
deliberate uniform UTC process zone with a written rationale, a one-off
`SHOW TimeZone; SHOW DateStyle;` verification of the Railway cluster, a
read-only `Intl`/`Asia/Bangkok` assertion in `instrumentation.ts`, and a
multi-`TZ` test obligation covering both the pure date resolver and one
real-PostgreSQL round trip.

## Decisions still open

The sources narrow but do not settle these:

- Whether the uniform-UTC process zone is stated as a deployment note, a
  `next.config`-adjacent comment, or an ADR consequence.
- Whether the `Intl` startup assertion is worth an `instrumentation.ts` file at
  all before one exists for observability reasons.
- Which second `TZ` value the test matrix uses, and whether it applies to the
  whole Vitest project or only the pure date-resolution project.
- Whether operational Instant columns are specified as `timestamptz` in the
  schema decision or restated here as a persistence rule.
