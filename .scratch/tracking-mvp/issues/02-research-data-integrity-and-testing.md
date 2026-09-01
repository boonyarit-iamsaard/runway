# Research Drizzle data integrity and PostgreSQL testing

Type: research
Status: resolved

## Question

Using current official Drizzle, PostgreSQL, Node.js, and candidate test-runner documentation/source, establish the facts needed to preserve the legacy ledger invariants in this pnpm/Turborepo architecture:

- Drizzle schema and migration support for CHECK constraints, composite foreign keys, partial unique indexes, enums, big integer money, date-only values, and transactional writes.
- Where raw SQL migrations are necessary and how reviewed migrations remain authoritative.
- Viable integration-test isolation against real PostgreSQL under local and CI runs, including migrations, parallelism, and protection from the development ledger.
- A focused TypeScript test-runner choice compatible with Node 24, Next.js 16, workspace packages, and Turbo, without assuming client component tests are required.

Preserve the behavioral obligations from [transaction shape](../legacy-wayfinder/issues/01-transaction-shape.md), [category taxonomy](../legacy-wayfinder/issues/02-category-taxonomy.md), [account lifecycle](../legacy-wayfinder/issues/03-account-lifecycle-and-balances.md), and [arithmetic testing](../legacy-wayfinder/issues/14-testing-the-period-and-rollup-arithmetic.md). Save a cited report under `.scratch/tracking-mvp/research/`; do not choose the final architecture for the user.

## Answer

[Drizzle data integrity and PostgreSQL testing](../research/02-drizzle-data-integrity-and-testing.md)
establishes that current Drizzle directly supports the preserved row checks,
composite foreign keys, partial unique indexes, PostgreSQL enums, `bigint`,
date-only values, and transactions. Raw SQL is needed only for unsupported DDL,
data migrations, or a deliberately chosen trigger. It documents safe real-
PostgreSQL isolation options and narrows the runner choice to Vitest versus
Node 24's built-in runner without selecting the final architecture.
