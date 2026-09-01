# 26: Review monthly movement and as-of Balances

**What to build:** Give a User a trustworthy Summary of one Period's Income,
Expenses, and net movement alongside live Account Balances calculated through an
explicit as-of Calendar date, without mixing those two time bases.

**Blocked by:** 12: Prove exact Money and Bangkok Calendar semantics; 16: Create
and arrange truthful Accounts; 19: Record an Expense end to end; 20: Record Income
through the shared entry flow; 21: Record a Transfer once.

**Status:** ready-for-agent

- [ ] One owner-scoped, surface-shaped Summary read returns Period Income,
      Expenses, net movement, and Account Balances from one PostgreSQL statement
      and one snapshot.
- [ ] Period totals include the matching Calendar month, while each Balance is
      Opening balance plus incoming Money minus outgoing Money through
      `min(Period end, Bangkok today)` and carries that explicit as-of label.
- [ ] Transfers affect both Account Balances symmetrically but are excluded from
      Income, Expenses, net movement, and Category totals.
- [ ] Archived Accounts are absent from the Balance list, negative Balances remain
      valid and visually distinct, and no cached Balance or database Balance view
      is added.
- [ ] The mobile Summary emphasizes net movement and offers Spending, Income, and
      Accounts lenses whose labels retain their headline values; desktop renders
      all three panels side by side without adding a sidebar or new content.
- [ ] Summary first paint is one blocking real payload with truthful per-panel
      empty states and no aggregate skeleton, deferred partial totals, optimistic
      figures, or client Money arithmetic.
- [ ] Hand-computed public-interface tests cover inclusive Period boundaries,
      future dates, clamped as-of dates, Opening balances, negative values,
      transfer neutrality, two-User isolation, zero activity, and snapshot
      consistency during a concurrent write.
- [ ] The read remains behind the server-only tracking interface and follows ADRs
      0001 through 0005 without leaking SQL, Drizzle shapes, or formatting work to
      Client Components.
