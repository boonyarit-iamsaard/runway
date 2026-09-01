# 28: Make routing and freshness browser-trustworthy

**What to build:** Make Transactions, Summary, entry overlays, Period changes,
and Category investigations behave as one predictable browser application whose
Back button, prefetched views, and previously visited pages always reflect the
committed Ledger.

**Blocked by:** 22: Correct and delete Transactions safely; 23: Correct and close
Accounts without hiding money; 24: Archive and remove Categories without rewriting
history; 25: Repeat and undo recent Transactions safely; 27: Explain Summary totals
through Categories.

**Status:** ready-for-agent

- [ ] Transactions and Summary preserve the selected Period between them while
      dropping surface-local filters; mobile uses a pinned two-item bottom bar and
      desktop uses a top header, with Settings available from the avatar at every
      width.
- [ ] Period changes push history and retain scroll; Summary lens changes replace
      history; Category drill-in pushes history; Back returns through visible
      hierarchy rather than incidental control state.
- [ ] Opening create or edit adds exactly one history entry, local picker steps add
      none, Back closes the overlay, Forward reopens it, and direct overlay URLs
      render the Transactions list underneath with a safe close fallback.
- [ ] Every committed Transaction mutation, including Fast repeat and Undo,
      refreshes Transactions and Summary for visible, explicitly prefetched, and
      previously visited Periods so Back never restores stale financial data.
- [ ] Adjacent Periods prefetch explicitly; only the touched arrow may show a
      fixed-size delayed pending indicator, and Transactions begins Summary
      prefetch only after hover, focus, touch, or pointer intent.
- [ ] Reads remain uncached unless a later accepted decision introduces persistent
      caching with owner-qualified invalidation; this ticket does not add cache
      tags before cached reads exist.
- [ ] A narrow Playwright suite runs against a production Next.js build and covers
      direct and in-session URLs, exact history behavior, draft retention, Summary
      replace/push rules, Period navigation, filtered navigation, create flash and
      Undo, mutation freshness, intent-only prefetch, and arrow-local feedback.
- [ ] Browser coverage verifies App Router history, caching, and network contracts
      rather than MUI structure, screenshots, broad visual behavior, or performance
      thresholds, preserving the testing and architecture decisions in the parent
      specification and ADRs 0001 through 0006.
