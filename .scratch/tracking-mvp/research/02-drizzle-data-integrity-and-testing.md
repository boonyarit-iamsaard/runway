# Drizzle data integrity and PostgreSQL testing

Researched 1 September 2026 against the current repository, the preserved
Wayfinder decisions, and current first-party documentation. This report
establishes implementation facts; it does not choose the final architecture.

## Repository and legacy baseline

The repository currently requires Node `>=24`, uses pnpm workspaces and Turbo,
and has Next.js 16 in `apps/web`. It does not yet contain `packages/db`, a test
runner, PostgreSQL provisioning, or CI workflow. The accepted ADRs require
PostgreSQL plus Drizzle, reviewed migrations once data is durable, database
infrastructure in `packages/db`, and feature-owned authorization rather than a
Laravel-style global scope.

The legacy obligations to preserve are:

- A Transaction is one row with an always-positive integer minor-unit amount.
  Income has a destination Account and Category; Expense has a source Account
  and Category; Transfer has distinct source and destination Accounts and no
  Category. These are row-local database invariants.
- A Category is Income or Expense, has at most one parent, shares its type and
  owner with its parent, and can be attached only to a Transaction of the same
  type and owner. Live names are case-insensitively unique within their sibling
  scope. Archived names may be reused.
- An Account has an integer minor-unit Opening balance and date-only Opening
  date. Balance is derived from the Ledger, never cached. Transactions before
  an involved Account's Opening date are forbidden, but that rule reads another
  table.
- Arithmetic tests run against PostgreSQL, use small inline fixtures and literal
  expected amounts, cover transfer symmetry, category rollups, date boundaries,
  and cross-owner leakage, and never derive expected values through a second
  implementation of the query under test.

Primary legacy sources: [Transaction shape](../legacy-wayfinder/issues/01-transaction-shape.md),
[Category taxonomy](../legacy-wayfinder/issues/02-category-taxonomy.md),
[Account lifecycle](../legacy-wayfinder/issues/03-account-lifecycle-and-balances.md), and
[Arithmetic testing](../legacy-wayfinder/issues/14-testing-the-period-and-rollup-arithmetic.md).

## Drizzle and PostgreSQL capability matrix

| Requirement                            | Current support                                                                                                                                                                                                                                                                                                                                                                                                                                        | Consequence for the port                                                                                                                                                                                                                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Row-shape and positive-amount `CHECK`s | Drizzle's PostgreSQL schema API exposes named `check` expressions, including table checks that compare multiple columns. PostgreSQL checks may inspect the inserted or updated row, but PostgreSQL explicitly warns that they cannot guarantee rules involving other rows or tables. [Drizzle constraints](https://orm.drizzle.team/docs/indexes-constraints) · [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) | The Transaction shape, `amount > 0`, and distinct Transfer Accounts fit declared `CHECK`s. Category depth and Transaction-date-versus-Account-Opening-date do not; they remain operation validation unless the project deliberately adopts triggers.                                                                                  |
| Composite foreign keys                 | Drizzle exposes `foreignKey({ columns, foreignColumns })` for multi-column keys. PostgreSQL accepts grouped foreign keys targeting a primary key, unique constraint, or eligible non-partial unique index. [Drizzle constraints](https://orm.drizzle.team/docs/indexes-constraints) · [PostgreSQL `CREATE TABLE`](https://www.postgresql.org/docs/current/sql-createtable.html)                                                                        | The ownership and type guarantees can be preserved as composite keys, for example Category `(id, owner_id, type)` and Account `(id, owner_id)` targets referenced from Transactions. The exact identity column/type is still a schema decision.                                                                                       |
| Nullable composite foreign keys        | PostgreSQL's default `MATCH SIMPLE` skips the match when any referencing column is null; `MATCH FULL` instead permits only all-null or all-non-null composites. [PostgreSQL `CREATE TABLE`](https://www.postgresql.org/docs/current/sql-createtable.html)                                                                                                                                                                                              | The legacy use is portable: a Transfer with null `category_id` can bypass `(category_id, owner_id, type)` while Income and Expense must match. This behavior deserves a direct integration test because it is load-bearing and non-obvious.                                                                                           |
| Partial unique indexes                 | Drizzle index builders support a `uniqueIndex` with a SQL `where` expression. PostgreSQL uses a unique partial index, not a `UNIQUE` constraint, when uniqueness applies only to rows matching a predicate. [Drizzle indexes](https://orm.drizzle.team/docs/indexes-constraints) · [PostgreSQL indexes](https://www.postgresql.org/docs/current/sql-createindex.html)                                                                                  | Both live-name rules are expressible without raw migration SQL: one index for live children and one for live top-level Categories, with owner/type columns included where their scope requires them. `lower(name)` is also a supported index expression.                                                                              |
| PostgreSQL enum                        | Drizzle exposes `pgEnum`, generating a PostgreSQL enum type. [Drizzle column types](https://orm.drizzle.team/docs/column-types)                                                                                                                                                                                                                                                                                                                        | A shared Transaction-type enum is supported. Whether to use a database enum or a checked text column remains a migration-evolution trade-off, not a tooling limitation.                                                                                                                                                               |
| Integer money                          | Drizzle maps PostgreSQL `bigint` as either JavaScript `number` or JavaScript `bigint`; its docs restrict the number mode rationale to values below `2^53`. PostgreSQL `bigint` is a signed eight-byte whole number. [Drizzle column types](https://orm.drizzle.team/docs/column-types) · [PostgreSQL numeric types](https://www.postgresql.org/docs/current/datatype-numeric.html)                                                                     | Integer minor units remain directly supported. `mode: "bigint"` retains the database type's exact range; `mode: "number"` needs an explicit product maximum below JavaScript's safe-integer ceiling. This choice also controls public result mapping and test literals.                                                               |
| Money aggregation                      | PostgreSQL promotes `sum(bigint)` to `numeric`, and `sum` of no rows is null. [PostgreSQL aggregate functions](https://www.postgresql.org/docs/current/functions-aggregate.html)                                                                                                                                                                                                                                                                       | Summary queries must deliberately map the aggregate result back to the chosen Money representation and use `coalesce` where zero is the domain result. Do not assume a `bigint` column makes `sum` return the same driver type.                                                                                                       |
| Date-only values                       | Drizzle exposes PostgreSQL `date` with either string or JavaScript `Date` inference modes. PostgreSQL `date` has day resolution and no time of day. [Drizzle column types](https://orm.drizzle.team/docs/column-types) · [PostgreSQL date/time types](https://www.postgresql.org/docs/current/datatype-datetime.html)                                                                                                                                  | Opening dates and Transaction dates fit native `date`. String mode (`YYYY-MM-DD`) avoids introducing an instant/time-zone meaning into a calendar date; choosing it is a representation decision. The application must pass its notion of “today” into queries if tests are to freeze it; SQL `CURRENT_DATE` uses the database clock. |
| Atomic writes                          | Drizzle provides `db.transaction`, nested savepoints, explicit rollback, return values, and PostgreSQL isolation configuration. PostgreSQL defaults to Read Committed. [Drizzle transactions](https://orm.drizzle.team/docs/transactions) · [PostgreSQL isolation](https://www.postgresql.org/docs/current/transaction-iso.html)                                                                                                                       | Multi-write operations such as cascading Category archival and registration plus Default-set creation can be atomic behind feature operations. Isolation stronger than Read Committed should be justified by a concrete concurrent invariant and include retry behavior.                                                              |

No listed legacy invariant requires handwritten SQL solely because Drizzle lacks
schema support. Two preserved rules are outside ordinary row constraints by
nature, not by ORM limitation:

1. a Category cannot become a third level because that requires inspecting its
   proposed parent's row; and
2. a Transaction date cannot precede either involved Account's Opening date
   because that requires inspecting Account rows.

PostgreSQL recommends a foreign key, unique/exclusion constraint, or trigger for
cross-row/table guarantees rather than a cross-table `CHECK`. Keeping these two
rules in feature operations accepts that direct SQL could bypass them. Adding
triggers would be a newly reopened architecture decision, not a mechanical port.

## Migration authority and raw SQL

Drizzle supports a code-first, reviewed-SQL flow: the TypeScript schema is the
declared current schema, `drizzle-kit generate` compares it with prior migration
snapshots and writes SQL, and `drizzle-kit migrate` reads the migration folder,
applies unapplied SQL, and records it in `__drizzle_migrations`.
[Migration fundamentals](https://orm.drizzle.team/docs/migrations) ·
[`generate`](https://orm.drizzle.team/docs/drizzle-kit-generate) ·
[`migrate`](https://orm.drizzle.team/docs/drizzle-kit-migrate)

That supports the existing PostgreSQL ADR if the repository treats both views
of authority explicitly:

- exported Drizzle schema files describe the intended current schema and drive
  future diffs;
- committed, reviewed migration SQL is the authoritative upgrade history that
  every non-disposable database executes; and
- `drizzle-kit push` remains limited to disposable databases, as the ADR already
  states.

Drizzle can generate an empty custom migration for DDL it cannot express or for
data seeding/backfills; that SQL is still applied by the same migrator.
[Custom migrations](https://orm.drizzle.team/docs/kit-custom-migrations)
Raw SQL is therefore appropriate only when the generated schema API cannot
express an operation, for an intentional trigger/function, or for a data
migration. It is not currently necessary for checks, composite foreign keys,
partial indexes, enums, `bigint`, or `date`.

Every generated migration should be inspected before it is accepted. In
particular, review the emitted SQL for:

- named `CHECK`s matching every legal Transaction shape;
- composite key column order matching on both sides;
- `MATCH SIMPLE` behavior remaining the default where null is intentional;
- partial-index predicates including `archived_at IS NULL` and the right owner,
  type, and parent scope;
- enum alterations and data conversions; and
- destructive statements or table rewrites.

The migration test should build a blank PostgreSQL database from the committed
migration directory, not call `push` and not create tables directly from the
TypeScript schema. Otherwise it tests the intended snapshot while bypassing the
reviewed history production will execute.

## Real-PostgreSQL integration-test isolation

Three viable levels exist. They can be adopted incrementally; the final choice
depends on local Docker expectations and desired parallelism.

### Dedicated test database, serialized database project

Provision a database whose name and credential are test-only, apply all
committed migrations before the suite, and clean data between tests using a
known reset strategy. Vitest can put database tests in a separate project with
`fileParallelism: false`; its documentation calls out a shared database as a
reason to disable file parallelism. [Vitest parallelism](https://vitest.dev/guide/parallelism)
Node's runner has the equivalent process-level control through
`--test-concurrency`. [Node test execution](https://nodejs.org/download/release/v24.15.0/docs/api/test.html#test-runner-execution-model)

This is the smallest setup for a personal MVP and a CI PostgreSQL service. Its
cost is serialized integration tests. It must have hard safety rails:

- require a separate `TEST_DATABASE_URL`; never fall back to `DATABASE_URL`;
- parse the URL and refuse migration/reset unless the database name matches a
  test-only convention;
- keep destructive reset code in test infrastructure, not production exports;
- use a database role that has no access to the development or production
  database; and
- fail closed when the test URL is absent.

A suffix check is defense in depth, not the primary boundary; separate
credentials and a separate database are stronger. Transaction rollback per test
can accelerate cleanup only if every operation receives and uses the same
transaction client. It does not isolate code that opens another pooled
connection, and sequences are not rolled back in PostgreSQL. Therefore rollback
must be proven by the feature-operation seam rather than assumed.

### Ephemeral PostgreSQL container per test run

Testcontainers for Node can start a PostgreSQL image with a generated connection
URI and stop it after the run; its PostgreSQL module also supports snapshots.
[Testcontainers PostgreSQL module](https://node.testcontainers.org/modules/postgresql/)
Run migrations once during global setup, then either serialize database files,
reset to a migrated snapshot, or allocate further isolation.

This gives the strongest routine protection from the development Ledger because
the database does not exist before the test run. The costs are a required local
container runtime, image startup/pull time, and CI Docker availability. Vitest
global setup runs once before workers and can provide serializable connection
data to tests. [Vitest global setup](https://vitest.dev/config/globalsetup.html)
Node 24 also has global setup/teardown, but that API is marked early-development
in the Node 24 docs. [Node global setup](https://nodejs.org/download/release/v24.15.0/docs/api/test.html#global-setup-and-teardown)

### Per-worker database or schema

Parallel integration files need a distinct namespace per worker. A database per
worker has the clearest isolation and exercises normal `public`-schema
migrations, but requires `CREATEDB`, pool cleanup, and orchestration outside a
transaction because PostgreSQL forbids `CREATE DATABASE` inside a transaction.
[PostgreSQL `CREATE DATABASE`](https://www.postgresql.org/docs/current/sql-createdatabase.html)
A schema per worker is cheaper but requires proving that every migration,
PostgreSQL enum, search path, and query is schema-safe.

This complexity is not required at the current repository size. Start-time and
suite-duration measurements can justify it later. Whichever model is chosen,
the CI run must create its database from committed migrations and database tests
must not be Turbo-cache hits based only on source files: their result depends on
external PostgreSQL state. Turbo tasks are discovered from package scripts and
can declare dependencies, environment inputs, outputs, or `cache: false`.
[Turbo task configuration](https://turborepo.dev/docs/reference/configuration#tasks)

## Focused TypeScript test-runner facts

The immediate subjects are framework-neutral feature operations, Drizzle
queries, database constraints, Money/Period helpers, and migration correctness.
They require a Node environment, not jsdom or Client Component testing.

### Vitest

- Current Vitest requires Node 20 or newer, so Node 24 is supported. It runs
  TypeScript tests, provides watch and run modes, and can define multiple test
  projects for workspace/package or unit/integration separation.
  [Vitest guide](https://vitest.dev/guide/)
- It exposes a stable one-time global setup, worker controls, and a direct
  `fileParallelism: false` switch for a shared database. These are useful without
  installing React Testing Library or jsdom.
  [Lifecycle](https://vitest.dev/guide/lifecycle.html) ·
  [Parallelism](https://vitest.dev/guide/parallelism)
- Next.js documents Vitest as a supported unit-test setup. Its example adds DOM
  packages because it tests a component, but those packages are not intrinsic
  to server-side database tests. Next also states that async Server Components
  are not supported by Vitest and recommends end-to-end coverage for them.
  [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest)
- In this repo, Vitest could be installed only where tests live and exposed via
  normal package `test` scripts; Turbo can run those scripts across the workspace.

### Node 24 built-in test runner

- `node:test` is stable, discovers `.ts` tests under Node 24's built-in type
  stripping, isolates test files in child processes by default, controls process
  count with `--test-concurrency`, and includes Date mocking.
  [Node test runner](https://nodejs.org/download/release/v24.15.0/docs/api/test.html)
- It adds no runner dependency and is sufficient for database and pure-domain
  assertions using `node:assert`.
- The built-in TypeScript path is deliberately lightweight: Node ignores
  `tsconfig.json`, does not transform `paths`, requires explicit file extensions,
  does not support `.tsx`, and supports only erasable TypeScript unless an
  experimental transform flag or third-party loader is used.
  [Node TypeScript support](https://nodejs.org/download/release/v24.15.0/docs/api/typescript.html)
- Those limitations are material in a pnpm workspace whose packages may use
  TypeScript bundler resolution or aliases. Adding `tsx` restores fuller
  TypeScript behavior but removes part of the zero-dependency advantage. Node
  24's global setup and coverage APIs are also not yet stable, even though the
  core runner is.

### Jest

Jest 30 is compatible with Node 24 and Next.js has an official `next/jest`
integration, but that integration's main value is Next compiler, asset, font,
and jsdom/component handling. [Next.js Jest guide](https://nextjs.org/docs/app/guides/testing/jest) ·
[Jest 30 compatibility](https://jestjs.io/docs/upgrading-to-jest30)
For the current server/database scope it brings more transformation and
configuration machinery than either Vitest or `node:test`. It remains viable if
future synchronous component tests or an existing Jest ecosystem become a
decisive requirement; async Server Components have the same documented unit-test
limitation.

On current evidence, Vitest has the fewest integration unknowns for one focused
TypeScript runner across workspace packages and database tests, while
`node:test` is the leanest option if the repository commits to Node-native module
resolution and accepts its early-stage setup/coverage pieces. This is evidence
for the later decision, not the final selection.

## Test obligations that survive the stack change

The Laravel/Pest mechanics do not survive, but these tests do:

1. Build an empty real PostgreSQL database from committed migrations.
2. Prove each named Transaction-shape check with at least one rejection and
   prove `amount > 0`.
3. Prove the owner/type composite Category foreign key rejects a cross-owner or
   wrong-type reference, and prove a Transfer's null Category passes under
   `MATCH SIMPLE`.
4. Prove partial uniqueness among live sibling Categories and Accounts, plus
   permitted name reuse after archive.
5. Exercise feature operations against a caller identity and plant a second
   owner's Ledger so every aggregate changes if authorization filtering leaks.
   The current ADR requires explicit feature-owned authorization; tests should
   call that public operation seam rather than rely on ORM global scopes.
6. Keep arithmetic fixtures inline and small. Expected Money values are literals,
   including period boundaries, the as-at-date clamp, transfer symmetry, direct
   Parent-category `Other`, archived historical Categories, and zero-spending
   ratios.
7. Inject or pass the application clock/date. Freezing JavaScript `Date` will not
   freeze PostgreSQL `CURRENT_DATE`, which is precisely why summary queries
   should receive their effective “today”.
8. Keep pure Money parsing/formatting and Period calendar cases database-free.
   No Client Component test suite is implied by any of these obligations.

## Decisions still open

The sources narrow but do not settle these choices:

- PostgreSQL enum versus checked text for Transaction type.
- Drizzle `bigint` mapping as JavaScript `bigint` versus a bounded safe integer,
  and the corresponding public Money shape.
- `date({ mode: "string" })` versus JavaScript `Date` at the persistence seam.
- Operation-only enforcement versus PostgreSQL triggers for Category depth and
  Opening-date validation.
- Dedicated serialized test database versus an ephemeral Testcontainers
  database; per-worker isolation is an optimization path, not a present need.
- Vitest versus the Node 24 built-in runner. The evidence currently favors
  evaluating Vitest first, but no dependency or architecture change has been
  made by this research ticket.
