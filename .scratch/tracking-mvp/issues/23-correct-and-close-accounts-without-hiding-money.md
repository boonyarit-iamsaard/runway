# 23: Correct and close Accounts without hiding money

**What to build:** Let a User repair an Account's starting state and retire or
remove an Account only when doing so cannot hide Money or break Ledger history,
with clear explanations for every refused action.

**Blocked by:** 16: Create and arrange truthful Accounts; 21: Record a Transfer
once; 22: Correct and delete Transactions safely.

**Status:** ready-for-agent

- [ ] Opening balance edits recalculate every derived Balance retroactively, and
      Opening date may move earlier but cannot move later than an existing
      Transaction involving the Account.
- [ ] Account archival succeeds only when its Balance as of Bangkok today is zero;
      future-dated Transactions do not silently change today's Balance.
- [ ] Archive and Transaction writes share Account row locks and recheck state so a
      concurrent create-versus-archive race commits one valid outcome and never an
      archived non-zero Account.
- [ ] Archived Accounts disappear from new-Transaction choices and ordinary live
      Account lists while remaining named on historical Transactions and retained
      when currently selected in an edit.
- [ ] A User can reveal archived Accounts in place and restore one; an Account can
      be hard-deleted only when no Transaction references it.
- [ ] Refused Opening-date, archive, and delete operations return reasoned typed
      failures rendered at the initiating control before an irreversible action;
      deletion requires confirmation.
- [ ] Balance is always derived from Opening balance plus incoming Money minus
      outgoing Money through an explicit as-of Calendar date; no cache, projection,
      database view, or trigger-maintained Balance is introduced.
- [ ] Public-interface tests cover historical correction, negative Balances,
      deletion restriction, liveness, two-User isolation, and the specified lock
      races through the framework-neutral Account lifecycle module.
