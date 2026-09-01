# 21: Record a Transfer once

**What to build:** Let a User move money between two Accounts as one first-class
Transaction whose direction is clear and whose value is never misreported as
Income or Expense.

**Blocked by:** 16: Create and arrange truthful Accounts; 19: Record an Expense end
to end.

**Status:** ready-for-agent

- [ ] Transfer creation stores one positive Money amount with distinct live owned
      source and destination Accounts, no Category, and a Calendar date on or
      after both Opening dates.
- [ ] Transfer appears as its own entry type only when two live Accounts exist;
      the source is omitted from destination choices and ordinary Income or
      Expense entry is not burdened by the second Account control.
- [ ] Changing to or from Transfer preserves the still-meaningful Account in the
      correct structural slot and clears every incompatible Category or Account
      field.
- [ ] Both Accounts are locked in deterministic order and rechecked inside one
      atomic write so archive, Opening-date, and concurrent Transaction races
      cannot produce an invalid result.
- [ ] The Ledger stores one Transaction row rather than signed amounts, double-entry
      legs, or paired rows; negative resulting Account Balances remain valid.
- [ ] The refreshed monthly list presents both Account names and the direction
      once, using server-owned date and Money labels.
- [ ] Public-interface tests cover same-Account refusal, cross-User references,
      Opening-date boundaries, concurrent changes, exact transfer symmetry, and
      the absence of Category data.
