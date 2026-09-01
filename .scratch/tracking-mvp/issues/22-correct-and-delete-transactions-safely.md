# 22: Correct and delete Transactions safely

**What to build:** Let a User open any historical Transaction, correct every
meaningful field or type mistake, reverse a Transfer direction quickly, and
permanently delete an unwanted Transaction with deliberate confirmation.

**Blocked by:** 19: Record an Expense end to end; 20: Record Income through the
shared entry flow; 21: Record a Transfer once.

**Status:** ready-for-agent

- [ ] Tapping a row opens the full edit form directly over the Transactions list;
      direct edit URLs render the same underlying Period rather than replaying the
      creation category-first flow.
- [ ] Editing supports every Transaction field and coherent type changes, retains
      the still-meaningful Account, clears incompatible fields, and offers a
      one-control source/destination swap for Transfers.
- [ ] An archived Account or Category currently attached to the Transaction remains
      visible and selectable for that edit without making other archived choices
      available.
- [ ] Update re-locks every affected Account and rechecks ownership, liveness,
      type, amount, and Opening-date invariants atomically; absent and foreign
      identifiers return the same result.
- [ ] Expected field and invariant failures preserve the edit draft at the same
      controls used by creation, while retryable failures remain actionable.
- [ ] Delete requires confirmation, removes the Transaction permanently, and does
      not introduce soft deletion, a recovery bin, or general mutation Undo.
- [ ] Successful update or deletion refreshes Transactions and Summary after
      commit, flashes an updated row when applicable, and gives plain completion
      feedback.
- [ ] Public-interface and browser tests cover type transitions, archived-current
      values, Transfer swapping, hard deletion, authorization, draft retention,
      direct URLs, and result mapping without inspecting private SQL or components.
