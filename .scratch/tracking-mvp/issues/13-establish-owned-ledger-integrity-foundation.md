# 13: Establish the owned Ledger integrity foundation

**What to build:** Establish a migration-backed PostgreSQL Ledger whose row and
reference constraints make invalid Transaction shapes and cross-User financial
relationships difficult to represent, together with a safe verification harness
for every later behavior slice.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] The database infrastructure owns the process-level PostgreSQL pool,
      Drizzle client, transaction primitive, authoritative schema, migration
      tooling, and reviewed migration-from-empty path as required by ADR 0003.
- [ ] Better Auth data, Accounts, Categories, Transactions, and Default-set
      receipts use UUIDv7-compatible identifiers and non-null User ownership with
      deletion cleanup scoped to the owning User.
- [ ] Composite references enforce ownership and Category type compatibility;
      row constraints enforce positive Transaction Money, valid direction slots,
      distinct Transfer Accounts, and Categories that cannot use the Transfer
      type.
- [ ] PostgreSQL enforces case-insensitive uniqueness among live Account names
      and live Category siblings, hierarchy references, foreign-key existence,
      and restrictive deletion of referenced Accounts and Categories.
- [ ] Money is stored as `bigint` Satang, Ledger dates are string-mode PostgreSQL
      `date`, and every operational or audit Instant is `timestamp with time zone`.
- [ ] Vitest and root task orchestration support pure and uncached integration
      suites against a dedicated serialized PostgreSQL test database.
- [ ] Test setup fails closed when the test URL is missing, uses unsafe credentials,
      or does not name a validated test-only database; it never falls back to the
      development database or creates tables outside committed migrations.
- [ ] Migration, named-constraint, schema-inspection, and non-UTC driver round-trip
      tests verify the database contract without exposing Drizzle row types as a
      tracking interface or introducing a generic repository.
