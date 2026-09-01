# 19: Record an Expense end to end

**What to build:** Let a User record an exact Expense from the Transactions page
on a one-handed phone or keyboard-driven desktop, recover from expected failures
without losing the draft, and immediately see the committed Transaction.

**Blocked by:** 16: Create and arrange truthful Accounts; 17: Shape the live
Category taxonomy; 18: Browse a monthly Ledger from Transactions.

**Status:** ready-for-agent

- [ ] Expense creation stores one positive Money amount leaving one live owned
      Account on or after its Opening date with one live owned Expense Category
      and an optional Note.
- [ ] The mobile sheet starts with a spacious category-first Parent/search/Child
      flow and a baht-first keypad; the desktop dialog uses a focused text amount
      input feeding the same exact parser.
- [ ] New Expense defaults to Bangkok today and the last-used live Account, visibly
      labels a future Calendar date, and never rejects a valid negative resulting
      Balance.
- [ ] Expense is offered only when one live Account and one live Expense Category
      exist; impossible local states disable Save without weakening server-side
      validation.
- [ ] The create URL renders over the Transactions list and can be opened directly;
      picker steps remain local rather than adding browser-history entries.
- [ ] Field-aware failures render beside their controls, invariant failures render
      above Save, retryable failures stay at the initiating surface, and the draft
      remains mounted until successful commit or session expiry.
- [ ] Creation locks and rechecks the Account, derives all ownership from identity,
      returns the feature-owned typed result, and refreshes both Transactions and
      Summary only after commit.
- [ ] Success closes the form, flashes the committed row, and shows a completion
      toast; public-interface, adapter, and focused browser tests verify the full
      slice without importing framework concerns into behavior.
