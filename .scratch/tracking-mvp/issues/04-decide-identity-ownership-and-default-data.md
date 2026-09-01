# Decide identity, ownership, and Default set provisioning

Type: grilling
Status: resolved
Blocked by: 01

## Question

Given the accepted product policy and the Better Auth research, decide the current architecture for authenticated identity, authoritative per-user authorization, and one-time Default set provisioning.

The answer must comply with ADR 0002's feature boundaries and ADR 0004's feature-owned authorization; keep open registration harmless; make cross-user access fail safely on reads and writes; define user-deletion cleanup; and decide what happens when Category provisioning fails during registration. Preserve the product decisions in [data ownership with open registration](../legacy-wayfinder/issues/05-data-ownership-with-open-registration.md) and [Default categories and first run](../legacy-wayfinder/issues/10-default-categories-and-first-run.md) without porting Eloquent global scopes or Fortify hooks.

[Better Auth identity and tracking provisioning](../research/01-better-auth-identity-and-provisioning.md) establishes that public hooks cannot keep user creation and the Default set in one transaction: the after hook runs post-commit and may leave a committed user while the request fails. Decide whether strict atomicity still justifies a lower-level extension, or whether the product accepts idempotent post-commit provisioning with a durable delivery receipt and explicit repair trigger. Name the user-visible failure and retry behavior either way.

## Answer

Authentication stops at the application adapter; authorization and ownership remain inside tracking. Default set delivery becomes an explicitly post-commit, idempotent tracking workflow. This preserves the product decisions in [Data ownership with open registration](../legacy-wayfinder/issues/05-data-ownership-with-open-registration.md) and [Default categories and first run](../legacy-wayfinder/issues/10-default-categories-and-first-run.md) without recreating their Laravel mechanisms. The post-commit trade-off is recorded in [Provision the Default set after user creation](../../../docs/adr/0007-provision-default-set-after-user-creation.md).

### Authenticated identity crosses one narrow seam

Every protected Next.js Server Action, Route Handler, and server-rendered entry point validates the Better Auth session. Cookie-only Proxy checks and hidden controls may improve navigation, but never authorize an operation.

The adapter parses `session.user.id` into the application-owned branded `UserId` and constructs the tracking module's public identity contract:

```ts
interface TrackingIdentity {
  readonly userId: UserId;
}
```

Framework-neutral tracking operations receive that value, not Better Auth users or sessions, Next.js requests, headers, cookies, or form objects. The contract deliberately carries no roles or sharing data because a User owns exactly one Ledger and shared Ledgers are outside the destination. Default set provisioning is a trusted system-triggered operation receiving the newly created `UserId`; it does not manufacture a `TrackingIdentity` or pretend an authenticated User initiated it.

### Tracking owns authoritative authorization

Accounts, Categories, and Transactions carry a non-null `userId` foreign key to the Better Auth User. Their ownership is fixed on creation and never accepted from client input.

Every public tracking operation enforces ownership server-side:

- Collection reads include `userId = identity.userId`.
- Identifier reads, updates, archives, and deletes use one database predicate containing both the supplied identifier and `identity.userId`; they never fetch by bare identifier and authorize afterward.
- Inserts derive `userId` from `TrackingIdentity`.
- Account, Category, Parent category, and Transaction references are resolved with owner-qualified predicates.
- Composite PostgreSQL constraints make cross-user Account and Category references, including cross-user Parent category relationships, unrepresentable even if an operation is implemented incorrectly.

The current stack has no Eloquent-style global scope and gains no imitation of one. Authorization remains local to the feature operations as required by ADR 0004, behind the tracking module interface required by ADR 0002.

An absent identifier and another User's identifier produce the same typed `notFound` result for reads, updates, archives, and deletes. A missing, archived, wrong-type, or foreign Account or Category reference produces the same typed validation failure. The Next.js adapter maps these outcomes without revealing whether another User's row exists. Constraint violations remain the final write guard, not the normal user-facing validation path.

Open registration is therefore harmless to existing data: a new User can reach only their own Ledger, and a User whose provisioning is incomplete cannot reach ordinary tracking surfaces at all.

### User deletion is database-owned cleanup

Deleting the Better Auth User cascades through that User's Accounts, Categories, Transactions, and Default set delivery receipt. It removes the whole Ledger and provisioning state while leaving every other User untouched. Profile and Delete User controls remain reachable even when tracking is gated by failed provisioning; soft deletion and orphaned financial data remain refused.

### The Default set is delivered post-commit

Configure the Better Auth Drizzle adapter with transaction support enabled so Better Auth's own sign-up writes remain atomic. After that transaction commits, the public user-created after hook calls one tracking operation, conceptually `provisionDefaultSet(userId)`. A lower-level Better Auth extension was rejected: strict User-plus-Default-set atomicity does not justify coupling the application to undocumented authentication internals.

`provisionDefaultSet` is the only interface to the workflow. Its implementation owns the static thirty-Category definition, Drizzle transaction, concurrency handling, and durable receipt:

1. Start one feature-owned transaction.
2. Claim a unique, unversioned delivery receipt keyed by `userId`.
3. If another committed call already owns the receipt, return success without writing Categories.
4. Otherwise insert the complete Default set and commit the Categories and receipt together.

A Category failure rolls back the receipt and every Category inserted by that attempt. Concurrent calls serialize on the unique receipt: one delivers, and the others become successful no-ops. Repeated calls after delivery are successful no-ops. The receipt is not a Category marker, onboarding flag, or set version. Delivered Categories are ordinary user-owned rows immediately; deleting or renaming them does not alter the receipt. Existing Users are never re-seeded or upgraded, and changes to the static definition affect only future registrations.

The after hook catches and reports provisioning faults so a committed User is never shown a false “registration failed” response. Registration succeeds and the session remains valid even if Default set delivery did not.

### Missing delivery gates tracking and has an explicit repair path

Every authenticated entry into a tracking surface checks for the delivery receipt before invoking ordinary tracking behavior. If it is missing, the adapter invokes `provisionDefaultSet` once automatically. Success continues to the requested surface. A second failure renders a blocking setup state with the message:

> Your account was created, but we couldn't finish setting up your categories.

That state offers a Retry action calling the same operation. Later authenticated entries may retry once again. It never asks the User to register again, does not invalidate the session, and does not reinterpret the missing Categories as ordinary First run. Authentication and profile surfaces remain available throughout.

If Categories exist without a receipt, provisioning reports an invariant failure. It never infers delivery from row counts, merges defaults into existing Categories, or creates a receipt around ambiguous data. Automatic reconciliation could overwrite the distinction between undelivered defaults and a User's later edits. Repairing such manually altered or corrupt data is explicit operational maintenance outside this MVP; Delete User remains the in-product reset.

### Verification obligations

The downstream test architecture must prove the public interface and its adapters rather than internal helper structure:

- protected Next.js entry points reject absent or invalid sessions;
- collection and identifier operations isolate two Users on every read and mutation path;
- foreign and absent identifiers have indistinguishable observable results;
- spoofed ownership is ignored, and composite constraints reject cross-user references;
- deleting one User removes only that User's Ledger and receipt;
- Better Auth's enabled transaction rolls back its own partial sign-up writes;
- successful, failed, repeated, and concurrent provisioning preserve the all-Categories-plus-receipt invariant;
- a missing receipt gates tracking, Retry repairs a transient failure, and existing Categories without a receipt fail rather than merge.

No accepted ADR is contradicted. No new ticket or fog is created: [Decide the tracking test architecture](08-decide-test-architecture.md) and [Decide the tracking module shape](09-decide-tracking-module-shape.md) already own the downstream test and module decisions.
