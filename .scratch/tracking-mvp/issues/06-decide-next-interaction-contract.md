# Decide the Next.js interaction and navigation contract

Type: grilling
Status: resolved
Blocked by: 03

## Question

Given the Next.js mechanics research, decide the current URL, history, mutation, freshness, and pending-state contract for Transactions and Summary.

Preserve the accepted user-visible behavior where the framework supports it: entry and drill-in are meaningful navigation states; Back moves up the visible hierarchy; period changes are shareable; drafts and inline errors remain in place; successful mutations refresh every affected view; first paint favors content or a truthful empty state; and pending feedback belongs to the control that initiated navigation. Explicitly identify any behavior that must change, why, and whether it requires a MUI/Next prototype before it can be accepted.

[Next.js interaction, cache, and history mechanics](../research/03-next-interaction-cache-history.md) establishes that every accepted behavior is reproducible. Decide whether to adopt its proposed composition—native query-history state, navigational Links, controlled Server Actions, explicit Transactions/Summary path invalidation, and skeleton-free prefetched Period navigation—and which production-mode interaction tests make inferred framework behavior safe to depend on.

## Answer

Adopt the proposed current-stack composition. The accepted user-visible behavior is preserved; Inertia's partial-prop, cache-tag, and global restoration mechanisms are replaced by native App Router history state, Links, controlled Server Actions, explicit path revalidation, and production-mode interaction tests.

### URL and history contract

- The sibling surfaces are `/transactions` and `/summary`. The existing human-readable Period query shape, `period=YYYY-MM`, remains the URL contract; the separate money-and-calendar ticket owns the TypeScript and persistence representations.
- New entry uses `/transactions?new=1`. Editing uses `/transactions?edit=<transactionId>`. Opening either sheet adds exactly one native-history entry. Category selection and amount/details steps remain local state and do not add entries.
- The sheet is controlled by the query state. Browser Back closes it and preserves the underlying Transactions list, including its scroll and client state; Forward reopens it. A direct request with `new=1` or `edit=<transactionId>` renders the list and opens the sheet. Close replaces the clean URL when no same-page history entry can safely be assumed.
- Period changes are `Link` navigations that push history, retain the current `tab`, clear `category`, and use `scroll={false}`. Back returns to the prior Period.
- Summary tab changes (`spending`, `income`, `accounts`) use native `replaceState`: a tab is a lens, not a place in the navigation stack. Category drill-in uses native `pushState`: a drill-in is a subject and Back returns to the prior Summary view. The full breakdown tree is already in the Summary payload, so these two changes do not request new server data.
- Category rows navigate to `/transactions?period=YYYY-MM&category=<categoryId>` with a real `Link`. Account rows remain non-navigable. Main Transactions/Summary links push, retain `period`, and discard surface-local parameters.

### Mutation, errors, and freshness

Use one Server Action per tracking mutation behind a thin Next.js adapter. The adapter authenticates the Better Auth session, translates it to the application-owned identity, validates transport input, invokes the feature operation, and returns a serializable discriminated state. Feature operations retain authoritative authorization and do not accept Next.js or Better Auth types.

- `useActionState` owns structured expected failures. Field errors render beside their fields, form-level invariant errors render above Save, the sheet stays mounted, and all typed values remain in controlled state.
- Unexpected or network failures use the existing retryable destructive toast. The draft remains in the sheet. Session expiry/action invalidation remains the one explicitly accepted draft-loss case.
- On committed create, edit, or delete, the action revalidates both `/transactions` and `/summary`, returns the mutation result, then closes the sheet. Create retains the accepted new-row flash and Undo action; Undo is another authorized Server Action with the same invalidation behavior. Do not redirect after a successful sheet mutation in a way that leaves the sheet history entry behind.
- The current configuration begins with uncached owner-scoped Drizzle reads. `router.refresh()` is not a substitute for invalidating every affected route. If persistent server caching is introduced later, use owner-qualified tags and `updateTag` for read-your-own-writes; do not add cache tags before cached reads exist.

### Loading and prefetch contract

Summary aggregates are sent as one blocking payload. There is no Summary `loading.tsx`, aggregate Suspense skeleton, or optimistic display of new Period numbers; first paint is real content or the truthful per-panel empty state.

- Adjacent Period controls are visible `Link prefetch={true}` controls. They retain scroll, and each touched arrow exposes a fixed-size `useLinkStatus` indicator only after a short delay (100–250 ms), so pending feedback belongs to the initiating control without flashing on warm navigation.
- Transactions-to-Summary remains a real accessible `Link`, but starts with prefetch disabled and arms prefetch on hover, keyboard focus, or touch/pointer intent. It does not prefetch merely because it is mounted.

### Verification and boundary decisions

No MUI/Next prototype is required before accepting this contract; the remaining uncertainty is behavioral and is covered by production-mode tests. Those tests must cover:

- direct and in-session entry/edit sheet URLs, Back/Forward, one-entry sheet history, and draft retention after returned validation errors;
- tab replacement, Category drill-in push/Back, Period push retaining the tab and clearing drill-in, and category-to-Transaction navigation;
- mutation freshness for the visible Transactions and Summary surfaces, a prefetched adjacent Period, and a previously visited page restored with browser Back;
- intent-only Summary prefetch from Transactions and arrow-local delayed pending feedback; and
- create flash/Undo plus retryable failure behavior.

Server Actions are the current UI mutation boundary. Route Handlers remain reserved for a genuine future HTTP consumer or webhook; no internal HTTP hop is introduced, consistent with ADR 0001. The decision is also consistent with ADRs 0002, 0003, 0004, 0005, and 0006. No accepted product behavior is changed; only the obsolete Inertia implementation assumptions are retired. A query-state sheet does not gain a separate standalone full-page hard-navigation representation, because that is not a current product requirement.

### Identifier convention

Use UUIDv7 for all new persisted and public identifiers across the current architecture, including the application-owned `UserId` and identifiers represented in tracking URLs. The eventual Better Auth/Drizzle configuration must preserve this convention rather than silently introducing numeric or random identifier formats; any adapter limitation must be surfaced as a new decision before implementation.
