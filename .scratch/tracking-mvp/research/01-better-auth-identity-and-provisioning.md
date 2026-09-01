# Better Auth identity and tracking provisioning

Research snapshot: 2026-09-01.

This report treats the archived [ownership decision](../legacy-wayfinder/issues/05-data-ownership-with-open-registration.md) and [first-run decision](../legacy-wayfinder/issues/10-default-categories-and-first-run.md) as product requirements. Their Laravel mechanisms (`CreateNewUser`, Eloquent global scopes, route-model binding, and policies) are not implementation guidance for this repository.

## Executive answer

- Better Auth 1.7.2 exposes `databaseHooks.user.create.before` and `databaseHooks.user.create.after`. The before hook runs before the user exists. In the 1.7.2 source, the after hook is deliberately queued until the surrounding transaction has committed. Therefore no documented public user hook can create the Default set after the user exists **inside Better Auth's authoritative sign-up transaction**.
- The Drizzle adapter has transaction support, but it is disabled by default. With the default, Better Auth's `runWithTransaction` falls back to sequential calls and cannot roll back partially written authentication rows. Configure `transaction: true` when PostgreSQL is used.
- With transactions enabled, a throwing `user.create.after` hook cannot roll back the committed user. In the current source its error can still reject the sign-up request after commit. A blind client retry can then encounter an existing user. Provisioning through this hook must therefore be treated as post-commit, idempotent work with an explicit repair path, not as an atomic registration extension.
- At the Next.js boundary, obtain the validated Better Auth session from request headers, reject unauthenticated requests, and immediately translate `session.user.id` into an application-owned identity value. Framework-neutral feature operations accept that value, never Better Auth session/user types, cookies, headers, or Next.js request objects.
- Drizzle's application queries are explicitly filtered per statement; there is no documented Eloquent-style global ownership scope. Enforce ownership at every feature read and mutation, include both resource id and owner id in identifier lookups, derive ownership on insert from authenticated identity, and use schema constraints to make cross-owner references invalid. Page or Proxy gating is only an outer usability layer, not authoritative authorization.

## Version fit

The current Better Auth documentation identifies 1.7.2 as its latest version. The tagged `better-auth@1.7.2` package declares peers for Next.js `^14 || ^15 || ^16`, React/React DOM `^18 || ^19`, Drizzle ORM `^0.45.2 || >=1.0.0-rc.1 <2`, and `pg@^8`; the package is developed against Next 16 and React 19. This fits the repository's Next 16.3.2 and React 19 baseline. The package metadata declares no Node engine range, so Node 24 compatibility is not an explicit package guarantee and should be verified by the eventual install/build/test rather than assumed. Sources: [Better Auth Next.js integration](https://www.better-auth.com/docs/integrations/next), [Better Auth 1.7.2 package metadata](https://github.com/better-auth/better-auth/blob/v1.7.2/packages/better-auth/package.json), and [Drizzle adapter 1.7.2 package metadata](https://github.com/better-auth/better-auth/blob/v1.7.2/packages/drizzle-adapter/package.json).

For reproducible implementation, pin `better-auth` and `@better-auth/drizzle-adapter` to the same reviewed release. Recheck the source-derived transaction findings before upgrading either package because these semantics have changed across recent Better Auth releases.

## User creation and transaction boundary

### Documented extension points

Better Auth documents database hooks for the `user`, `session`, and `account` models. A create-before hook may abort or replace the payload; a create-after hook performs work after the entity was successfully created. The documented context is Better Auth's endpoint/hook context, not an application Drizzle transaction handle. See [Better Auth database hooks](https://www.better-auth.com/docs/concepts/database#database-hooks).

The 1.7.2 source makes the timing more precise:

1. Email/password sign-up wraps its user, credential account, optional session, and related work in `runWithTransaction`. See [`sign-up.ts`](https://github.com/better-auth/better-auth/blob/v1.7.2/packages/better-auth/src/api/routes/sign-up.ts#L180-L181) and the user creation later in the same callback ([`sign-up.ts`](https://github.com/better-auth/better-auth/blob/v1.7.2/packages/better-auth/src/api/routes/sign-up.ts#L332-L344)).
2. `createWithHooks` runs `user.create.before`, writes the user through the current adapter, then sends `user.create.after` to `queueAfterTransactionHook`. See [`with-hooks.ts`](https://github.com/better-auth/better-auth/blob/v1.7.2/packages/better-auth/src/db/with-hooks.ts#L26-L94).
3. `queueAfterTransactionHook` stores the callback while a transaction is active; `runWithTransaction` commits first and only then executes queued hooks. See [`transaction.ts`](https://github.com/better-auth/better-auth/blob/v1.7.2/packages/core/src/context/transaction.ts#L93-L156).

These are source-observed semantics, not a promise stated by the public hook documentation.

### Drizzle adapter transactions are opt-in

The current adapter's `transaction` option defaults to `false`. When enabled, it passes a transaction-bound adapter backed by `db.transaction`; when disabled, the adapter factory executes the callback against the ordinary adapter with no database transaction. See [`drizzle-adapter.ts`](https://github.com/better-auth/better-auth/blob/v1.7.2/packages/drizzle-adapter/src/drizzle-adapter.ts#L1143-L1156) and the fallback in [`factory.ts`](https://github.com/better-auth/better-auth/blob/v1.7.2/packages/core/src/db/adapter/factory.ts#L793-L806). Drizzle itself guarantees that statements executed through its transaction callback commit as one logical unit or roll back together; see [Drizzle transactions](https://orm.drizzle.team/docs/transactions).

**Implication:** `drizzleAdapter(db, { provider: "pg", schema, transaction: true })` is required if Better Auth's own multi-write sign-up is expected to be atomic. Calling a function named `runWithTransaction` does not provide that guarantee under the adapter default.

### Can Category creation join that transaction?

Not through the documented hooks:

- `user.create.before` is too early for foreign-keyed Categories because the user row does not exist yet.
- `user.create.after` is intentionally post-commit in 1.7.2.
- The documented hook API does not provide the transaction-bound Drizzle client to application code.

Therefore the archived requirement “user and thirty Categories roll back together” is **not portable as written through Better Auth's public hook surface**. Keeping strict atomicity requires a different extension below or around that surface; choosing such a mechanism is a remaining design decision, not a fact established by these sources.

## Failure and retry semantics

With real adapter transactions enabled, an exception during Better Auth's main sign-up callback rolls back the authentication writes. Drizzle documents rollback of a transaction when its callback fails. However, a `user.create.after` hook runs only after that commit. In Better Auth 1.7.2, an unhandled queued-hook error is rethrown by default, but the source explicitly notes that reporting cannot roll back committed work. See [`transaction.ts`](https://github.com/better-auth/better-auth/blob/v1.7.2/packages/core/src/context/transaction.ts#L115-L145).

The observable failure can consequently be:

1. User, credential account, and possibly session commit.
2. Default-set provisioning fails.
3. The sign-up request rejects because the after hook threw.
4. Retrying sign-up is no longer a retry of the same transaction; it encounters an existing identity.

That sequence is inferred directly from the 1.7.2 control flow and must be pinned with an integration test if adopted. It is not a documented compatibility guarantee.

If post-commit provisioning is accepted, the safe shape is an application-owned, idempotent operation:

- Run all thirty Category inserts and a separate durable “Default set delivered” receipt in one **feature-owned Drizzle transaction**.
- Give the receipt a unique key per user. A retry that sees the receipt is a no-op; a failure rolls back both Categories and the receipt. Drizzle supports transactions, multi-row inserts, unique constraints, and conflict handling ([transactions](https://orm.drizzle.team/docs/transactions), [inserts and conflicts](https://orm.drizzle.team/docs/insert), [constraints](https://orm.drizzle.team/docs/indexes-constraints)).
- Do not use “the user currently has zero Categories” as the retry predicate. That state also means the user deliberately deleted all ordinary Categories, and the archived requirement says never to re-seed them.
- Do not let an after-hook exception masquerade as a rolled-back registration. Catch/report the provisioning failure and arrange a deliberate retry trigger, such as a subsequent authenticated sign-in or an explicit provisioning workflow. The trigger remains a product/operational decision.

The durable receipt is an inferred design that preserves the archived “one shot, never upgraded, ordinary rows” behavior while permitting reliable retries. It is not a Better Auth feature.

## Identity crossing the Next.js boundary

Better Auth's official Next.js integration retrieves an authenticated session on the server with:

```ts
const session = await auth.api.getSession({ headers: await headers() });
```

It documents this for Server Components and Server Actions and says Better Auth is compatible with Next.js 16. A cookie-only Proxy check is explicitly optimistic and not secure; protected pages/routes must validate the session server-side. See [Better Auth's Next.js integration](https://www.better-auth.com/docs/integrations/next#rsc-and-server-actions) and [auth protection](https://www.better-auth.com/docs/integrations/next#auth-protection).

Next.js independently recommends a server-only data-access boundary that performs authorization and returns minimal DTOs. It also says exported Server Actions are reachable by direct POST, a page-level check does not secure actions beneath it, and authorization must include ownership of the specific resource. See [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication) and [Next.js data security](https://nextjs.org/docs/app/guides/data-security).

Combined with [ADR 0002](../../../docs/adr/0002-organize-code-as-vertical-feature-modules.md) and [ADR 0004](../../../docs/adr/0004-use-better-auth-with-feature-owned-authorization.md), the adapter seam should be:

```ts
// Next.js / Better Auth adapter
const session = await auth.api.getSession({ headers: await headers() });
if (!session) return unauthenticated();

const identity = { userId: session.user.id } satisfies TrackingIdentity;
return createTransaction(identity, parsedInput);
```

`TrackingIdentity` is application-owned and contains only what the feature needs. It must not alias or derive its public shape from `typeof auth.$Infer.Session`, and feature operations must not accept `Headers`, cookies, `NextRequest`, Server Action form objects, or Better Auth `User`/`Session` types. The exact type name is still a design choice; the boundary and minimal `{ userId }` shape follow the accepted ADRs.

## Ownership enforcement points

The current stack provides complementary enforcement points, not an automatic global scope:

1. **Next.js adapter authentication.** Validate the Better Auth session for every protected Server Action, Route Handler, and protected page. Proxy/UI checks may redirect or hide unavailable controls but are not authoritative.
2. **Feature-operation authorization.** The framework-neutral operation receives application identity and owns the decision. This keeps authorization effective for every future adapter, not only Next.js.
3. **Persistence predicates.** Drizzle's documented query API applies explicit `.where(...)` filters. Collection reads filter on `userId`. Identifier reads, updates, archives, and deletes match both `id` and `userId` in the database statement. See [Drizzle select filters](https://orm.drizzle.team/docs/select#filters), [updates/deletes](https://orm.drizzle.team/docs/data-querying), and [delete filters](https://orm.drizzle.team/docs/delete).
4. **Insert ownership.** Ignore any client-supplied owner id. Set `userId` from the authenticated identity inside the operation/persistence seam.
5. **Schema constraints.** Make ownership non-null and foreign-keyed to the Better Auth user. Preserve the archived composite-key strategy so account/category references must have the same owner as the Transaction. Drizzle supports composite unique and foreign-key constraints; see [indexes and constraints](https://orm.drizzle.team/docs/indexes-constraints). Constraints prevent invalid cross-owner references but do not prevent an over-broad read, so they cannot replace query authorization.
6. **Tests.** Exercise every resource as user A against user B's identifiers for read, update, archive/delete, and cross-reference writes. Test the public feature interface plus each Next.js entry adapter. An integration test should also prove that `transaction: true` rolls back Better Auth's own sign-up writes and document the chosen post-commit provisioning behavior.

For an identifier such as a Transaction id, the safe persistence query has the conceptual predicate `transaction.id = suppliedId AND transaction.userId = identity.userId`. A missing row and another user's row are then indistinguishable to the operation. Fetching by bare id and relying on page routing, hidden controls, or a prior list query recreates the insecure-direct-object-reference class Next.js warns about.

## Decisions this research leaves to Wayfinder

1. Is atomic user-plus-Default-set creation still mandatory? Better Auth's public hooks cannot provide it. Either select a lower-level extension and keep the invariant, or explicitly replace it with post-commit, idempotent provisioning.
2. If post-commit provisioning is chosen, what durable receipt and retry trigger are acceptable? The receipt is necessary to distinguish “never provisioned” from “user later deleted every Category.”
3. What application-owned name represents authenticated identity at feature interfaces? The minimum current payload is `{ userId: string }`; no role or sharing data is required by the tracking MVP.

No current ADR is contradicted by these findings. They do contradict the archived Laravel implementation assumption that a registration action can freely share the auth framework's user-creation transaction, and they replace Eloquent global-scope enforcement with the feature-owned authorization required by ADR 0004.
