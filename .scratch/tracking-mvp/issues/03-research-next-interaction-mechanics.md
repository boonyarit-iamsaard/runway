# Research Next.js interaction, cache, and history mechanics

Type: research
Status: resolved

## Question

Using current official Next.js 16.3 and React 19 documentation/source, determine which App Router primitives can preserve the accepted tracking interactions:

- Opening entry as navigable UI whose browser Back behavior dismisses it without losing the underlying list context.
- Period and category drill-in URLs with deliberate push-versus-replace history semantics.
- Post-create/edit/delete freshness for the Transaction list, Summary aggregates, prefetched destinations, and browser-restored pages.
- Prefetching and control-local pending feedback without imposing a first-load skeleton on fast local aggregates.
- Server Action, Route Handler, and form-state trade-offs for inline field errors, retained drafts, and mutation success behavior.

Separate framework guarantees from inferred compositions and identify any accepted legacy behavior that Next.js cannot reproduce cleanly. Use [mobile entry](../legacy-wayfinder/issues/08-prototype-mobile-transaction-entry.md), [Summary composition](../legacy-wayfinder/issues/09-prototype-summary-view.md), [validation](../legacy-wayfinder/issues/16-validation-and-error-presentation.md), [loading behavior](../legacy-wayfinder/issues/17-summary-loading-behaviour.md), and [navigation](../legacy-wayfinder/issues/18-navigation-and-information-architecture.md) as product requirements. Save the cited report under `.scratch/tracking-mvp/research/`.

## Answer

[Next.js interaction, cache, and history mechanics](../research/03-next-interaction-cache-history.md)
finds that all accepted user-visible behavior is reproducible. Use native
History API query state for the entry sheet, Summary tab, and client-only
Category drill-in; push-navigation `Link`s for Period changes; Server Actions
with controlled form state and explicit `/transactions` plus `/summary` path
revalidation; and a skeleton-free Summary whose adjacent Period links prefetch
fully and expose delayed control-local pending state. Inertia's partial-prop
reload, link/form cache tags, and global restored-page event do not port
directly, so production-mode tests must pin prefetched Period freshness, Back
restoration after writes, intent-only prefetch, and retained drafts.
