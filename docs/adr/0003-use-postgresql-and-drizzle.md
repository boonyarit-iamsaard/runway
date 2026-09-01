---
status: accepted
---

# Use PostgreSQL and Drizzle

Use PostgreSQL for durable relational storage and Drizzle for explicit, type-safe, SQL-like schema and database access. `packages/db` owns the authoritative Drizzle schema, process-level connection pool and client, migration tooling, and transaction primitives; feature modules own their queries and decide which business operations must be atomic.

## Consequences

- Better Auth tables are represented in the Drizzle schema; no competing schema-change mechanism may mutate production independently.
- Drizzle tables and query builders are infrastructure details and are not transport contracts.
- Database imports remain inside framework-neutral feature operations and persistence. Next.js adapters, hooks, and presentation modules do not import `packages/db`.
- Features define the result types exposed by their public interfaces and map persistence results internally; Drizzle-derived row types do not cross the feature interface.
- Size each process pool with the total number of application replicas and PostgreSQL connection limits in mind.
- `db push` is acceptable only for disposable databases.
- The first environment containing data that must survive schema changes requires reviewed migrations, even during rapid schema churn.
- The exact production migration workflow is deferred until durable data exists; migrations must not run independently from every application process at startup.

## Considered options

A heavier repository framework that hides SQL was rejected because transparency and direct control are more valuable here. PostgreSQL and Drizzle also keep transaction behavior explicit without coupling public feature interfaces to persistence representations.
