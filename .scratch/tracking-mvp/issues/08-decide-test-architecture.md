# Decide the tracking test architecture

Type: grilling
Status: resolved
Blocked by: 02, 04, 05, 07

## Question

Choose the current TypeScript test architecture that can enforce the accepted tracking obligations against real PostgreSQL without endangering development data.

Settle the runner, package ownership, database lifecycle and isolation, migration setup, clock control, CI/Turbo integration, and the boundary between feature-operation integration tests and thin Next.js adapter tests. Preserve the hand-computed arithmetic expectations, Bangkok/UTC contrasts, transfer invariants, database-constraint failures, and two-user isolation coverage from the archived [testing decision](../legacy-wayfinder/issues/14-testing-the-period-and-rollup-arithmetic.md). Do not add a browser or client-component test stack unless a concrete accepted behavior requires it.

[Drizzle data integrity and PostgreSQL testing](../research/02-drizzle-data-integrity-and-testing.md) narrows the runner decision to Vitest versus Node 24's built-in runner and documents dedicated serialized, Testcontainers, and per-worker PostgreSQL isolation shapes. Choose rather than reopening the factual survey.

## Answer

Adopt one focused server-side test architecture with a small, explicit browser
exception for the accepted Next.js interaction contract. The choices are:

### Runner and ownership

- Use Vitest as the repository's TypeScript test runner, with the `node`
  environment. Do not add jsdom, React Testing Library, or Client Component
  tests to the tracking suite.
- `packages/db` owns migration/bootstrap helpers and PostgreSQL schema and
  constraint tests. `apps/web` owns tracking feature-operation integration
  tests and thin Next.js adapter tests. Do not create a global testing package
  until a second real consumer justifies it.
- Keep reset, fixture, and test-database helpers out of production exports.

### PostgreSQL lifecycle and isolation

Use a dedicated, serialized PostgreSQL test database in local development and
CI. The test harness must require `TEST_DATABASE_URL`, use separate test-only
credentials, validate a test-only database name, and fail closed when the URL
is missing or unsafe. It must never fall back to `DATABASE_URL`.

Apply committed migrations before the suite and reset the isolated database
between tests with test-only cleanup. Do not rely on transaction rollback as a
general isolation mechanism because feature operations may acquire their own
pooled connections. Integration tests must not be Turbo cache hits; the CI
PostgreSQL service supplies the test database for the job.

Testcontainers is not required for this MVP. It is an alternative future
strategy if ephemeral per-run databases become preferable or local PostgreSQL
provisioning becomes a burden. If adopted later, it replaces the dedicated
test-database strategy rather than supplementing it.

Migration tests build the database from the committed, reviewed Drizzle
migration history. They never use `db push` or create tables directly from the
TypeScript schema.

### Clock and test boundaries

Feature Summary and Balance reads receive an explicit `today: CalendarDate`.
Only the server-side Bangkok date resolver depends on an injectable clock; SQL
does not use `CURRENT_DATE`. Unit tests pass fixed Calendar dates and cover the
UTC/Bangkok boundary with a fixed Instant.

Tests own these boundaries:

- Pure unit tests cover Money parsing/formatting, Calendar date and Period
  arithmetic, and Bangkok date resolution.
- Real-PostgreSQL `packages/db` tests cover migration application and named
  database constraints.
- Real-PostgreSQL tracking tests call the public feature interface and cover
  authorization, ownership isolation, Account and Category lifecycle,
  Transaction invariants, transfer symmetry, Summary/Balance arithmetic,
  boundary dates, literal expected Money values, and atomic workflows.
- Next.js adapter tests use mocked authentication and feature operations to
  cover identity translation, transport validation, serializable DTOs, and
  expected-action error mapping. Drizzle rows and Better Auth types do not
  cross the feature interface.

The accepted Next.js interaction contract does require a narrow production-mode
Playwright suite for query-state Back/Forward behavior, controlled draft
retention, Period prefetch/freshness, intent-only prefetch, and mutation
navigation. This is route/history/network coverage, not a component-testing
stack.

Add package-level `test` scripts and root Turbo orchestration; keep the
integration task uncached and include it in CI. No accepted ADR is contradicted:
the decision follows ADRs 0001, 0002, 0003, and 0004, and preserves the product
and domain decisions already recorded on this map.
