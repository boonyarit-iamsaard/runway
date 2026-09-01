# 20: Record Income through the shared entry flow

**What to build:** Extend the proven Transaction entry flow so a User can record
external money arriving in an Account without seeing Expense Categories or
duplicating a second architecture for the same interaction.

**Blocked by:** 19: Record an Expense end to end.

**Status:** ready-for-agent

- [ ] Income creation stores one positive Money amount arriving in one live owned
      Account with one live owned Income Category and no source Account.
- [ ] The type control exposes Income only when its own live Account and Category
      prerequisites exist, independently of whether Expense is currently possible.
- [ ] Category-first selection shows only Income Categories, while shared date,
      amount, Account, Note, validation, draft-retention, and responsive behavior
      remains consistent with Expense.
- [ ] Changing between Income and Expense preserves the still-meaningful Account,
      clears the incompatible Category, and requires the newly necessary choice.
- [ ] Owner, type, liveness, Opening-date, and positive-Money rules are rechecked
      inside the Account-locked atomic write and return non-disclosing typed
      failures.
- [ ] The implementation deepens the existing tracking behavior, adapters, and UI
      rather than creating a sibling feature, internal HTTP endpoint, or duplicate
      public interface, preserving ADRs 0001 and 0002.
- [ ] Contract tests prove exact Income arithmetic, wrong-type and foreign Category
      rejection, two-User isolation, and expected failure mapping through the
      public tracking seam.
