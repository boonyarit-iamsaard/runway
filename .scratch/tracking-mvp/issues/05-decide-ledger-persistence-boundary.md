# Decide the ledger persistence and feature boundary

Type: grilling
Status: resolved
Blocked by: 02

## Question

Given the Drizzle/PostgreSQL research, decide how the current architecture represents and protects Accounts, Categories, and Transactions while preserving the accepted product invariants.

Settle which rules remain database constraints versus feature-operation validation; the current equivalents of positive minor-unit amounts, structural direction, typed Category consistency, two-level hierarchy, per-user reference integrity, archive/delete guards, Opening date, and derived Balance queries; and the smallest public feature interface that keeps Drizzle rows and Next.js types internal under ADRs 0002 and 0003. Use `codebase-design` alongside `grilling` and `domain-modeling` when resolving this ticket.

[Drizzle data integrity and PostgreSQL testing](../research/02-drizzle-data-integrity-and-testing.md) removes the schema-API uncertainty: every preserved row-local constraint, composite foreign key, and partial unique index is directly expressible. The remaining boundary choice is deliberate—especially whether cross-row Opening-date enforcement stays in authorized feature operations or earns a database trigger.

## Answer

The current stack keeps one owned tracking Ledger represented by three feature-owned
relational tables: `accounts`, `categories`, and `transactions`. `packages/db` owns
the shared PostgreSQL/Drizzle infrastructure, schema declarations, migration tooling,
and transaction primitives; tracking owns the queries, validation, and persistence
workflows. Better Auth tables and the Default-set delivery receipt remain part of the
identity/provisioning decision, not the tracking row model.

### Persistence shape

The `transactions` table keeps the settled single-row shape:

- `type` is `Income`, `Expense`, or `Transfer`.
- `amount` is a positive integer minor-unit magnitude.
- `from_account_id` is populated for Expense and Transfer.
- `to_account_id` is populated for Income and Transfer.
- `category_id` is populated for Income and Expense and is null for Transfer.
- `date` and optional `note` retain their domain meanings.
- Every financial row carries its owning `user_id`; ownership is fixed on creation.

`accounts` hold mutable identity and opening state: name, opening balance, opening
date, display order, and archive state. Opening balance is Account state, not a
synthetic Transaction. `categories` are typed Income or Expense rows with an
optional one-level parent and archive state. The shared PostgreSQL transaction-type
enum is narrowed for Categories by a database check that excludes Transfer.

No Account kind, currency column, cached Balance, separate transfer table, or
double-entry legs is introduced. Exact TypeScript and wire representations for money,
date-only values, and Periods remain with
[Decide the TypeScript money and calendar contract](07-decide-money-and-calendar-contract.md).

### Integrity gates

PostgreSQL is the final integrity authority wherever the rule is expressible as a
row constraint or relational constraint. Tracking operations mirror those checks
before writing so the initiating control can receive useful field-level errors; the
application mirror never replaces the database gate.

PostgreSQL therefore owns:

- positive amounts and the complete type-dependent Transaction slot shape;
- distinct source and destination Accounts for a Transfer;
- non-null ownership and foreign-key existence;
- composite ownership/type references for Accounts, Categories, parents, and
  Transactions;
- case-insensitive uniqueness of live Account names and live Category sibling names;
- restrictive hard deletion of referenced Accounts or Categories.

Tracking operations own the rules that ordinary PostgreSQL checks cannot express:

- a Category parent cannot itself have a parent;
- a Transaction date cannot precede the `opened_on` date of either involved Account;
- an Account may be archived only when its current Balance is zero;
- archive/unarchive behavior and parent-Category child cascades;
- archived-row selection and the currently selected archived value during editing.

These validations execute inside feature-owned transactions. Operations that can race
on the same Account or Category re-lock and re-check the affected rows before commit.
No PostgreSQL trigger is added for the two cross-row rules in this MVP. This accepts
that a future raw-SQL writer, import path, or second adapter would require revisiting
the choice; such a writer does not exist in the current destination. A trigger would
become a candidate only alongside that new write path or a demonstrated need for
database-enforced cross-row protection.

### Lifecycle and Balance

Referenced Accounts and Categories are archived rather than deleted. Hard deletion
is available only when no Transaction or child Category references the row, with
PostgreSQL restrictive foreign keys as the final guard. Archiving a parent Category
archives its children atomically; unarchiving does not cascade. Archived Accounts
leave pickers and the Balance list but remain visible on historical Transactions and
as the selected value while editing.

Balance is computed per query from opening balance plus incoming amounts minus outgoing
amounts, with Transfers contributing to both sides through their structural Account
slots. It is calculated as at the requested date, using the selected Period's end
clamped to today, and is never cached or exposed as a database view. The performance
escape hatch is indexed aggregate queries first, followed by a separately decided
consistency strategy only if measurement demonstrates a real need.

### Feature interface and seam

Tracking is the owning module for all supported Account, Category, Transaction, and
Summary behavior. Its root interface exports application-owned use-case inputs,
results, identity values, and typed errors. It does not export Drizzle rows,
database clients, Next.js requests/forms, cookies, or Better Auth session types.

Next.js adapters authenticate and translate identity, then call that interface.
Authorization remains in tracking through explicit owner predicates on every read and
mutation; database composite constraints provide a second write-side ownership
guard. Generic repositories and persistence-shaped interfaces are not public. The
precise operation grouping and whether the feature later has internal collaborating
modules are deferred to
[Decide the tracking module shape](09-decide-tracking-module-shape.md).

This resolution complies with [ADR 0002](../../../docs/adr/0002-organize-code-as-vertical-feature-modules.md),
[ADR 0003](../../../docs/adr/0003-use-postgresql-and-drizzle.md), and
[ADR 0004](../../../docs/adr/0004-use-better-auth-with-feature-owned-authorization.md);
it conflicts with none of the accepted ADRs.
