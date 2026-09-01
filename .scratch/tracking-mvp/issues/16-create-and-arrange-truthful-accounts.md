# 16: Create and arrange truthful Accounts

**What to build:** Let a User move from the derived First run state to a truthful
Ledger by creating, viewing, editing, and arranging their own Accounts with exact
Opening balances and Opening dates.

**Blocked by:** 12: Prove exact Money and Bangkok Calendar semantics; 13: Establish
the owned Ledger integrity foundation; 14: Register, authenticate, and retain
identity control; 15: Deliver and repair the Default set.

**Status:** ready-for-agent

- [ ] Runway never guesses or provisions an Account; ordinary empty states derive
      First run from current live data and point clearly to Add an account.
- [ ] A User can create and edit an Account name, signed exact Opening balance,
      Opening date, and display position through owner-qualified tracking
      operations returning typed expected failures.
- [ ] Live Account names are case-insensitively unique per User, negative Opening
      balances are valid, and Money and Calendar labels come from the server.
- [ ] Up and down controls swap neighboring Accounts atomically under row locks so
      concurrent reordering retains a valid and predictable order.
- [ ] Account settings are reachable from the authenticated shell; create and edit
      open over the list as a mobile sheet or desktop dialog using MUI and CSS
      Modules under ADR 0005.
- [ ] Server Actions use the shared protected-invocation seam, parse through the
      owning behavior schema, and do not import database infrastructure into the
      adapter or presentation layers.
- [ ] Public-interface PostgreSQL tests cover ownership, uniqueness, exact Opening
      values, ordering, typed failures, and concurrent neighbor swaps; adapter
      tests remain limited to transport and result mapping.
