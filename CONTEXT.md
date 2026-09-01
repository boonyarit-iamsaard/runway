# Runway

Runway is a personal financial-tracking product. Its tracking context records actual money movements across a person's accounts so later budgeting and runway calculations have a trustworthy ledger to read.

## Ownership

**User**:
A person registered on this Runway instance who owns exactly one Ledger. Users have no roles, share no Ledgers, and administer only their own data.
_Avoid_: Account holder, tenant, administrator

**Owned**:
Belonging to exactly one User. Every Account, Category, and Transaction is Owned; ownership is fixed when created and is never transferred.
_Avoid_: Shared, global, unscoped

## Money movements

**Satang**:
The minor unit of THB; one hundred Satang make one baht. Monetary values in the Ledger are whole counts of Satang.
_Avoid_: Decimal baht, float amount

**Money**:
An exact monetary value expressed as a count of Satang. Transaction amounts are positive; Opening balance and Balance may be negative.
_Avoid_: Floating-point amount

**Transaction**:
One recorded movement of money on one Calendar date for one positive Money amount. Every transaction is Income, Expense, or Transfer.
_Avoid_: Entry, record, movement

**Income**:
A Transaction in which money arrives in one Account from outside the person's own accounts.
_Avoid_: Credit, inflow

**Expense**:
A Transaction in which money leaves one Account for somewhere outside the person's own accounts.
_Avoid_: Debit, outflow, purchase

**Transfer**:
A Transaction that moves money from one of the person's Accounts to another without being Income or Expense.
_Avoid_: Expense transfer, two transactions

**Adjustment**:
Income or Expense recorded to correct the difference between an Account's calculated balance and its real balance. It is not a separate Transaction type.
_Avoid_: Reconciliation

**Note**:
Optional free text attached to a Transaction. It is not a payee, merchant, category, or tag.

**Ledger**:
The person's complete history of Transactions. A Transfer appears in it once even though it affects two Accounts.
_Avoid_: Transaction list

## Accounts and balances

**Account**:
A real place in which the person holds money, such as cash or a bank account. Accounts may hold a negative balance.
_Avoid_: User account, login, wallet

**Opening balance**:
The amount held by an Account when its Ledger history begins. It is the starting point for balance calculation, not a Transaction.
_Avoid_: Initial transaction

**Opening date**:
The first Calendar date covered by an Account's Ledger history. No Transaction involving the Account may predate it.
_Avoid_: Creation date, opened on

**Balance**:
The Opening balance plus money transferred or received into an Account, minus money transferred or spent from it, calculated as of a stated Calendar date.
_Avoid_: Cached balance

## Categories

**Category**:
An Income or Expense classification attached to a Transaction. A Category belongs to exactly one type and may be either top-level or nested one level below another Category.
_Avoid_: Tag, label

**Parent category**:
A top-level Category that may have Child categories and may also receive Transactions directly.
_Avoid_: Group

**Child category**:
A Category nested directly beneath one Parent category of the same type. Categories never nest below this second level.
_Avoid_: Subtag

**Other**:
The reserved breakdown line for Transactions attached directly to a Parent category that also has children. It is not a Category name.
_Avoid_: Uncategorised

**Archived category**:
A Category removed from new-Transaction choices while retaining its identity in historical summaries. Archiving a Parent category also archives its Child categories. A Child category may be archived alone, but may never be live while its Parent category is archived: every live Category has a live Parent category.
_Avoid_: Deleted category, inactive tag

**Archived account**:
An Account removed from new-Transaction choices and the Balance list while retaining its identity on historical Transactions. It may be archived only when its Balance is zero.
_Avoid_: Closed account, deleted account

## Product views and states

**Calendar date**:
A date-only day in Runway's Bangkok calendar, without a time of day or an instant. Transaction dates, Opening dates, and as-of Balance dates use Calendar dates.
_Avoid_: Timestamp, datetime

**Instant**:
An exact point in time used for operational or audit events, never as the date of a Transaction or Balance calculation.
_Avoid_: Calendar date, local date

**Period**:
The calendar month whose Income, Expenses, and category breakdown are being reviewed.
_Avoid_: Date range, statement period

**Summary**:
The period-scoped view of Income, Expenses, net movement, and category breakdown, alongside Account balances calculated as of the appropriate date.
_Avoid_: Dashboard

**Default set**:
The standard Income and Expense Categories given to a person once when they register. They are ordinary user-owned Categories afterward, with no special protection or upgrade lifecycle.
_Avoid_: System categories, template

**First run**:
The ordinary product state in which required data is absent, such as having no Accounts or no live Categories of a type. It is derived from current data, not stored as an onboarding phase.
_Avoid_: Onboarding status

**Fast repeat**:
A shortcut that creates another Transaction from a recent one. It does not schedule future or recurring Transactions.
_Avoid_: Recurring transaction, scheduled transaction

**Runway**:
How long the person's available money can support future spending. Tracking supplies its Ledger, but calculating Runway is outside the tracking MVP.
