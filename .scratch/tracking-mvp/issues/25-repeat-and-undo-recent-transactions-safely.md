# 25: Repeat and undo recent Transactions safely

**What to build:** Let a User recreate a valid recent Transaction quickly and
reverse only that new creation immediately, without allowing a shortcut to bypass
current Account or Category lifecycle rules.

**Blocked by:** 22: Correct and delete Transactions safely; 23: Correct and close
Accounts without hiding money; 24: Archive and remove Categories without rewriting
history.

**Status:** ready-for-agent

- [ ] Fast repeat cards appear at the top of creation and copy type, Category or
      Accounts, Money amount, and Note while always assigning Bangkok today.
- [ ] Candidates with archived, deleted, foreign, wrong-type, or otherwise invalid
      current choices are filtered from the read and revalidated by the create
      operation at commit time.
- [ ] A stale repeat produces retryable feedback at the shortcut and does not open
      a surprising partially completed full form.
- [ ] Successful creation closes the surface, flashes the new row, and shows a
      toast whose Undo invokes the existing authorized Transaction delete operation
      for exactly the newly created identifier.
- [ ] Undo permanently deletes only that Transaction and refreshes Transactions and
      Summary; it introduces no soft deletion, recovery bin, recurring Transaction,
      schedule, or general-purpose undo architecture.
- [ ] Public-interface and focused browser tests cover each Transaction type,
      today's date, stale lifecycle races, authorization, duplicate avoidance,
      row flash, Undo targeting, and post-Undo freshness.
