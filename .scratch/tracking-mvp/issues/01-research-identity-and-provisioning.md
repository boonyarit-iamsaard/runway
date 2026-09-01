# Research Better Auth identity and provisioning boundaries

Type: research
Status: resolved

## Question

Using current official Better Auth, Drizzle adapter, and Next.js documentation/source, establish the facts needed to replace the legacy Fortify `CreateNewUser` and Eloquent-global-scope assumptions:

- Where user creation can be extended, and whether default per-user Category creation can share the authoritative user-creation database transaction.
- Failure and retry semantics when provisioning extra domain data fails.
- How authenticated identity should cross the Next.js adapter into framework-neutral feature operations without Better Auth types leaking through their interfaces.
- Which enforcement points exist for per-user reads, writes, and identifier-based lookups.

Distinguish documented guarantees from inference. Research versions compatible with the repository's Next.js 16 / React 19 / Node 24 baseline; nothing is installed yet. Save the cited report under `.scratch/tracking-mvp/research/` and link the archived [ownership decision](../legacy-wayfinder/issues/05-data-ownership-with-open-registration.md) and [first-run decision](../legacy-wayfinder/issues/10-default-categories-and-first-run.md) as requirements, not current implementation guidance.

## Answer

See [Better Auth identity and tracking provisioning](../research/01-better-auth-identity-and-provisioning.md).

Better Auth 1.7.2 fits Next 16 and React 19, although its package metadata does not explicitly guarantee Node 24. Configure the Drizzle adapter's opt-in `transaction: true` for atomic Better Auth sign-up writes. The public user hooks cannot add the Default set to that transaction: `before` runs before the user exists and `after` is queued post-commit. A failed after hook can therefore leave a committed user while rejecting the request. Strict user-plus-Default-set atomicity remains a design decision; the safe relaxed alternative is idempotent, feature-owned provisioning with a durable delivery receipt and deliberate retry path.

Next.js adapters should validate the Better Auth session, translate `session.user.id` immediately into an application-owned identity value, and pass it to framework-neutral feature operations. Those operations enforce ownership with explicit owner predicates on every read and mutation, `(id, userId)` identifier lookups, server-derived ownership on insert, and composite database constraints for cross-row references. Page, Proxy, and UI gates are not authoritative authorization.
