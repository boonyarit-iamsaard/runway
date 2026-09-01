# Next.js interaction, cache, and history mechanics

Researched 1 September 2026 against the repository's installed Next.js 16.3.2
and React 19.2.8, their bundled first-party documentation, the current
repository configuration, and the preserved Wayfinder decisions. This report
establishes which mechanics can carry the product decisions; it does not design
the final route tree or component API.

## Result

All accepted user-visible behavior can be preserved. The clean Next.js
composition is:

- URL-only UI state (`new`, Summary tab, and category drill-in) uses the native
  History API, which Next.js integrates with `useSearchParams`. Entry and
  category drill-in push; the Summary tab replaces.
- Period changes use `Link` because they require new server data. They push a
  history entry, retain the tab, clear category drill-in, and keep scroll.
- Transaction writes use Server Actions plus `useActionState`. On success they
  revalidate both `/transactions` and `/summary`; on validation failure they
  return structured errors without closing the sheet.
- The Summary has no route `loading.tsx` and no aggregate-level Suspense
  fallback. Its two adjacent Period links prefetch fully on mount and show a
  delayed, arrow-local `useLinkStatus` indicator only on a cache miss.
- The Transactions-to-Summary navigation prefetches only after hover, focus, or
  touch intent, not merely because its tab is in the viewport.

What does not port is Inertia's implementation vocabulary: partial-prop
`only`, cache-tag props on links/forms, and a global `navigate + cached`
listener. Next.js has no direct equivalents. Server Action revalidation and
the App Router's client cache provide the same required outcome for this
same-tab product, with caveats recorded below.

Primary product sources: [mobile entry](../legacy-wayfinder/issues/08-prototype-mobile-transaction-entry.md),
[Summary composition](../legacy-wayfinder/issues/09-prototype-summary-view.md),
[money, dates, and Periods](../legacy-wayfinder/issues/04-money-dates-and-periods.md),
[validation](../legacy-wayfinder/issues/16-validation-and-error-presentation.md),
[loading behavior](../legacy-wayfinder/issues/17-summary-loading-behaviour.md), and
[navigation](../legacy-wayfinder/issues/18-navigation-and-information-architecture.md).

## Repository-specific baseline

`apps/web` pins Next.js 16.3.2 and the workspace catalog pins React and React
DOM 19.2.8. `next.config.ts` is empty, so Cache Components and Partial
Prefetching are not enabled. Under this model, ordinary `fetch` calls are not
cached by default, and direct ORM/database reads are cached only if the app
explicitly wraps them in `unstable_cache`. [Next.js caching without Cache Components](https://nextjs.org/docs/app/guides/caching-without-cache-components)

The tracking feature should therefore begin with uncached, owner-scoped Drizzle
reads. Revalidation is still required to refresh the current React Server
Component tree and invalidate client navigation state after a mutation; cache
tags are not useful until the app deliberately introduces a persistent server
cache.

## Framework guarantees

### History and route state

- `router.push` performs a client navigation and adds a browser-history entry;
  `router.replace` performs one without adding an entry. Both accept
  `scroll: false`. `router.back` and `router.forward` traverse browser history.
  [Next.js `useRouter`](https://nextjs.org/docs/app/api-reference/functions/use-router)
- `window.history.pushState` and `replaceState` update the URL without a page
  reload and are integrated with the App Router, so `usePathname` and
  `useSearchParams` receive the new value. `pushState` adds an entry that Back
  can revisit; `replaceState` does not. [Next.js Native History API](https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api)
- `Link` pushes by default, supports `replace`, and supports `scroll={false}`.
  Next.js preserves scroll for browser back/forward navigation; `scroll={false}`
  also prevents a new navigation from moving the current scroll surface.
  [Next.js `Link`](https://nextjs.org/docs/app/api-reference/components/link)
- Parallel plus Intercepting Routes are the framework's full-route modal
  primitive. On a soft navigation they preserve the underlying slot, support a
  shareable URL, close on Back, and reopen on Forward; a hard navigation renders
  the standalone route instead. Every slot needs an explicit `default.tsx` in
  Next.js 16. [Parallel Routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes) ·
  [Intercepting Routes](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes) ·
  [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16#parallel-routes-defaultjs-requirement)

### Mutation response and freshness

- A Server Action can return a value and an immediately re-rendered current
  route in one Flight response. Calling `revalidatePath`, `updateTag`, or
  `refresh` causes that re-render; no follow-up browser fetch is required for
  the current UI. Server Actions are dispatched sequentially per client.
  [Next.js Server Actions and Mutations](https://nextjs.org/docs/app/guides/server-actions)
- `revalidatePath` from a Server Function updates an affected path immediately
  when it is currently visible. In Next.js 16.3 it also causes all previously
  visited pages to refresh when they are navigated to again. The documentation
  explicitly calls that broader behavior temporary, so code must name every
  path whose freshness is a product invariant rather than relying on the global
  purge forever. [Next.js `revalidatePath`](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- `router.refresh()` clears the current route's client cache and merges a fresh
  RSC payload without losing unaffected Client Component or browser state, but
  it does not invalidate server-side cached data. The Server-Action-only
  `refresh()` helper refreshes the current client router. Neither is a substitute
  for invalidating every affected route. [Next.js `useRouter`](https://nextjs.org/docs/app/api-reference/functions/use-router) ·
  [Next.js `refresh`](https://nextjs.org/docs/app/api-reference/functions/refresh)
- If cached Ledger reads are introduced later, `updateTag` is the
  Server-Action-only read-your-own-writes primitive: it expires tagged data and
  blocks the next read for fresh data. `revalidateTag(tag, "max")` deliberately
  serves stale data while refreshing in the background, so it is unsuitable for
  a person's just-written Ledger. [Next.js `updateTag`](https://nextjs.org/docs/app/api-reference/functions/updateTag) ·
  [Next.js `revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)

### Prefetch, pending feedback, and loading UI

- In the current non-Cache-Components configuration, `Link` automatically
  prefetches in production when visible. `prefetch={true}` fetches the full
  route even when it is dynamic; `prefetch={false}` disables both viewport and
  hover prefetch. Automatic behavior is production-only. [Next.js `Link` prefetch](https://nextjs.org/docs/app/api-reference/components/link#prefetch)
- `router.prefetch` supports manual intent- or mount-driven warming and an
  `onInvalidate` callback that fires at most once when a prefetched payload is
  considered stale. Next.js documents hover-only wrappers but warns that custom
  prefetch policy also owns accessibility and invalidation details.
  [Next.js prefetching guide](https://nextjs.org/docs/app/guides/prefetching)
- `useLinkStatus` reports pending for the nearest parent `Link`. It is intended
  for control-local feedback when prefetch is absent or unfinished; it skips
  pending when the destination is already prefetched. The official pattern
  reserves fixed space and delays visibility so fast navigation does not flash
  a spinner. [Next.js `useLinkStatus`](https://nextjs.org/docs/app/api-reference/functions/use-link-status)
- A route `loading.tsx` automatically wraps the page below it in Suspense and
  supplies an immediate, prefetched fallback. Omitting it omits that route-level
  fallback; Suspense may still be added around genuinely slow subtrees.
  [Next.js `loading.js`](https://nextjs.org/docs/app/api-reference/file-conventions/loading)

### Form and error state

- A form action receives `FormData`. `useActionState` exposes the action's
  returned state and pending state, and Next.js recommends returning expected
  validation errors rather than throwing them. Unexpected failures belong to
  an error boundary. Every Server Action remains a reachable POST endpoint and
  must authenticate and authorize independently of page visibility.
  [Next.js forms](https://nextjs.org/docs/app/guides/forms) ·
  [Next.js error handling](https://nextjs.org/docs/app/getting-started/error-handling) ·
  [Next.js Server Action security](https://nextjs.org/docs/app/guides/server-actions#security)
- `useFormStatus` can give a child submit control the parent form's pending
  state and submitted data. `useActionState` is the better owner for structured
  field errors because its state is the Server Action's return value.
  [React `useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus) ·
  [React `useActionState`](https://react.dev/reference/react/useActionState)
- React resets uncontrolled form fields after a form Action succeeds. That is
  useful on a completed create, but it is not a draft-retention guarantee.
  Controlled sheet state remains the safe choice for amount, Category, Account,
  date, and Note, especially because the custom keypad already requires
  controlled string state. [React `<form>`](https://react.dev/reference/react-dom/components/form)
- `useOptimistic` can roll an optimistic view back after failure, but it is an
  optional UI composition. React does not make an optimistic close preserve an
  unmounted form draft. [React `useOptimistic`](https://react.dev/reference/react/useOptimistic)

## Inferred composition for tracking

The following is not one framework primitive; it is the smallest composition
of the guarantees above that preserves the accepted product behavior.

### Entry sheet and browser Back

Keep the accepted `/transactions?new=1` contract. The Transactions page owns a
Client Component sheet whose open state is derived from `useSearchParams`:

1. The FAB calls `window.history.pushState(null, "", nextUrl)` to add `new=1`
   without requesting or replacing the Transactions page.
2. The underlying Ledger remains mounted with its scroll and Client Component
   state intact.
3. Browser Back removes the query state; `useSearchParams` updates and the
   sheet closes. Forward reopens it.
4. A direct request for `/transactions?new=1` renders the Ledger and opens the
   sheet from the initial query value. A visible Close control should replace
   to the clean Transactions URL when no same-page history entry can safely be
   assumed; hardware Back after the FAB remains the primary dismiss behavior.

This reproduces the accepted interaction more directly than an Intercepting
Route because `new=1` is query state, not a route segment. If a later decision
requires a standalone create page on hard navigation, change the contract to a
segment such as `/transactions/new` and use an intercepted parallel route. That
alternative is officially supported, but it is not necessary for the current
bottom-sheet product.

The same query-state pattern may open an edit sheet if edit does not need a
standalone hard-navigation page. Either way, only the sheet steps are local
component state: opening the sheet adds exactly one history entry, while moving
between Category selection and amount/details does not add entries.

### Period, tab, and category URLs

Use one URL builder that always starts from the current parameters and applies
these rules:

| Interaction                   | Mechanic                                                                                            | History and data result                                                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Previous/next Period          | `Link` with the new `period`, current `tab`, no `category`, `prefetch={true}`, and `scroll={false}` | Pushes. Back returns to the prior Period. A server navigation obtains the new aggregates.                                                        |
| Summary tab                   | `window.history.replaceState`                                                                       | Replaces because a tab is a lens. The full Summary tree is already in memory, so no request is made.                                             |
| Parent Category drill-in      | `window.history.pushState`                                                                          | Pushes because drill-in is a subject. Back returns to the parent Summary. No request is made because the full breakdown tree is already present. |
| Category row to Ledger        | `Link` to `/transactions?period=...&category=...`                                                   | Pushes a real route navigation and loads the filtered Ledger.                                                                                    |
| Main Transactions/Summary tab | `Link`, retaining `period` and dropping surface-local parameters                                    | Pushes between sibling product surfaces.                                                                                                         |

Native History API updates are important for the Summary tab and drill-in. A
`router.push` to changed search params is a Next.js navigation and may request a
new Server Component payload; only the native-history path gives the accepted
zero-request client drill-in from the already-loaded tree. This is an inferred
use of the documented history integration, not a special "shallow routing"
guarantee.

### Create, edit, delete, and Undo

Use one feature operation per mutation behind a thin Server Action adapter. The
adapter resolves identity, authorizes through the feature, validates transport
input, invokes the operation, maps expected failures, and returns a serializable
discriminated state. This satisfies the repository's feature-owned
authorization ADR and the Server Action security requirement.

On failure:

- return `{ status: "error", fieldErrors, formError }` through
  `useActionState`;
- keep the sheet mounted and all fields controlled;
- render field-owned errors inline and a form-level invariant immediately above
  Save; and
- leave retryable network/unexpected failures to the sheet's error/toast
  boundary without discarding the controlled draft.

On success:

1. call `revalidatePath("/transactions")` and
   `revalidatePath("/summary")` inside the Server Action;
2. return `{ status: "success", transactionId, mutation }` in the same
   response;
3. close the sheet by traversing or replacing its one history entry only after
   success is committed; and
4. let page-level client coordination flash the returned Transaction and offer
   create's Undo. Undo is another authorized Server Action followed by the same
   two path invalidations.

Do not redirect on validation failure, optimistically unmount the sheet, or
depend on uncontrolled inputs. A success redirect also needs care: Server
Action `redirect` is a navigation, so a naive redirect to `/transactions` after
opening `?new=1` can leave the sheet entry behind it. Popping or replacing the
sheet state preserves the accepted Back stack.

The two explicit path invalidations cover:

- the currently visible Ledger and its new-row flash;
- Summary totals and Category rollups;
- prefetched Summary/Period destinations associated with that page; and
- same-tab previously visited pages when Back/Forward returns to them under
  Next.js 16.3's documented revalidation behavior.

The docs define invalidation at route-path granularity, not a testable promise
about every query-string cache key. The implementation must therefore include a
production-mode integration test that prefetches an adjacent Period, mutates a
Transaction, then navigates to that Period and back to a previously visited
Summary. That test guards the exact freshness obligation while Next.js evolves
the temporary broad client-cache purge.

If the app later caches Drizzle Ledger reads, tag every list and Summary read
with one owner-scoped Ledger tag and call `updateTag` as well as the two path
invalidations. Use an owner-qualified tag such as `ledger:<person-id>` rather
than one global `ledger` tag. Do not add tags before there are cached reads for
them to invalidate.

### Prefetch and pending design

The Summary stays a blocking, whole response because its local indexed
aggregates are expected to be fast. Do not add `summary/loading.tsx`, and do not
wrap the aggregate panel in a Suspense skeleton. The first rendered state is
therefore real Summary data or the accepted per-panel empty state, never a
skeleton that resolves into emptiness.

Within Summary, render the previous and next Period arrows as visible
`Link prefetch={true}` controls. In the current configuration this fully
prefetches even the dynamic, authenticated destination in production. Put a
fixed-size child using `useLinkStatus` inside each arrow and reveal it only
after a 100–250 ms CSS delay. On a warm navigation pending is skipped; on a miss
only the touched arrow changes.

For the much less frequent Transactions-to-Summary link, begin with
`prefetch={false}` and arm `prefetch={true}` only on mouse hover, keyboard focus,
or touch/pointer intent. Keeping a real `Link` preserves keyboard and modified
click behavior. This is a small custom wrapper, so production tests must verify
that it does not prefetch on mount and does prefetch after each supported intent.

## Server Action versus Route Handler

| Concern                  | Server Action                                                                                                         | Route Handler                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current UI refresh       | Can return state and an updated current RSC tree in one response after `revalidatePath`, `updateTag`, or `refresh`.   | Returns an ordinary HTTP response. `revalidatePath` marks a path for its next visit; browser code needs a separate navigation or `router.refresh` for the current tree. |
| Inline field errors      | Direct fit with `useActionState` and returned structured errors.                                                      | Client code must `fetch`, parse status/JSON, own pending/error state, and coordinate refresh.                                                                           |
| Draft retention          | Controlled state survives the action response while the sheet remains mounted.                                        | Also possible, but entirely client-managed and easier to lose during manual close/refresh coordination.                                                                 |
| Progressive enhancement  | A form-bound Server Action can submit before hydration; `useActionState` supports server-returned state.              | Requires a conventional URL form/navigation or hydrated `fetch` code.                                                                                                   |
| External/non-UI consumer | Framework-specific action protocol; not a public HTTP API contract.                                                   | Appropriate when a real HTTP consumer or webhook exists. Supports standard HTTP verbs and `Request`/`Response`.                                                         |
| Cache invalidation       | `updateTag` is available for immediate read-your-own-writes; path revalidation can update the current UI immediately. | `updateTag` is unavailable; `revalidateTag`/`revalidatePath` are available, with path work occurring on the next visit.                                                 |

Route Handlers are valid standard HTTP endpoints and mutation methods are not
cached, but they do not participate in layouts or client navigation.
[Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
The current modular-monolith ADR has no non-Next client, so adding an internal
HTTP hop would create more state coordination without a consumer. Use Server
Actions for the tracking UI; reserve Route Handlers for a future genuine HTTP
boundary or webhook.

## Gaps and non-guarantees

- **No Inertia-style partial-prop reload.** Next.js returns an RSC payload and
  preserves shared layouts/Client Components, but it does not expose an `only`
  list for selected page props. Keep Ledger and Summary queries in their own
  routes and feature operations so a Transactions re-render cannot accidentally
  execute Summary aggregates.
- **No public `navigate + cached` event.** App Router does not expose the legacy
  global restoration hook. Same-tab writes remain fresh through Server Action
  path revalidation. Mutations performed through another tab, an external
  process, or a Route Handler need an additional explicit policy such as focus
  refresh, polling, or push; none is required by the current single-person MVP.
- **No exact route-modal primitive for a query key.** Intercepting Routes operate
  on route segments. The accepted `?new=1` behavior is still cleanly reproducible
  as client query state, but it does not automatically gain a separate full-page
  hard-navigation rendering. Adopt `/transactions/new` only if that distinction
  becomes a product requirement.
- **Prefetch is production behavior.** Development observations do not prove
  the adjacent-Period or intent-only contracts. Test them against a production
  build.
- **Uncontrolled fields reset on successful Actions.** React does not preserve
  them as drafts. The accepted no-loss rule depends on controlled sheet state
  and on not unmounting before a successful result.
- **Cross-deployment Action IDs can expire.** A tab holding an old build can
  receive “Failed to find Server Action” after deployment. Next.js documents
  action-ID rotation and recommends a stable encryption key across self-hosted
  instances; this failure should be treated like the legacy accepted
  session-expiry loss, not as a field error.

No accepted product behavior is impossible on Next.js 16.3. The constraints
that need tests are cache freshness across prefetched query variants, Back after
a mutation, intent-only prefetch, and controlled-draft retention after returned
validation errors.
