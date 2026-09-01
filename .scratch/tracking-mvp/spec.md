# Tracking MVP

Status: ready-for-agent

## Problem Statement

A User needs a fast, trustworthy way to record actual Income, Expense, and
Transfer Transactions across their Accounts and understand what happened to
their money. The current application is still a starter shell: it has no
tracking feature, Ledger persistence, authentication integration, category
taxonomy, transaction entry flow, Summary, or production-grade test harness.

Without the tracking MVP, a User cannot establish an accurate Opening balance,
record day-to-day money movements, correct mistakes, manage Accounts and
Categories, or review Income, Expenses, net movement, category breakdowns, and
Balances for a Period. More importantly, later budgeting and Runway calculations
would have no trustworthy Ledger to consume.

The MVP must make incorrect or cross-User financial data difficult to represent,
keep money and Bangkok Calendar dates exact, remain fast on a 375px one-handed
screen, and preserve understandable browser history and fresh data across the
Transactions and Summary surfaces.

## Solution

Build tracking as one deep vertical feature in the existing Next.js modular
monolith. A User receives an ordinary, editable Default set of Categories after
registration, creates their own Accounts with truthful Opening balances and
Opening dates, and lands on the month-scoped Transactions list as the home
surface.

The User records an Income, Expense, or Transfer from a mobile-first sheet or a
desktop dialog. The Ledger stores each Transaction once, uses exact Satang
amounts and Bangkok Calendar dates, and derives every Balance rather than caching
it. The Summary presents Period Income, Expenses, net movement, category shares,
and as-of Account Balances without mixing time bases. Account and Category
lifecycle controls live in Settings and explain blocked actions before the User
attempts them.

Better Auth establishes identity at the application seam, while tracking owns
authorization and owner-qualified data access. PostgreSQL provides the final
row and reference integrity gates; framework-neutral feature behavior owns
cross-row rules and atomic writes. Expected failures return typed results that
the Next.js adapters render inline or at the initiating control.

The primary verification seam is the public tracking interface exercised
against real PostgreSQL. Narrow pure-domain, schema, Next.js adapter, and
production-mode browser tests cover contracts that cannot be observed reliably
through that seam.

## User Stories

1. As a new User, I want open registration to create my identity safely, so that I can begin using Runway without an administrator.
2. As a new User, I want my registration to remain successful if Default set delivery temporarily fails, so that I am not told to register a second time.
3. As a new User, I want tracking to retry incomplete Default set delivery automatically, so that a transient setup failure can repair itself.
4. As a new User, I want a clear blocking setup state and Retry action after repeated setup failure, so that I know my identity exists and what to do next.
5. As a User with incomplete tracking setup, I want Profile and Delete User controls to remain available, so that I retain control of my identity.
6. As a User, I want exactly one private Ledger, so that my financial history is not shared with or visible to another User.
7. As a User, I want foreign and nonexistent identifiers to behave identically, so that the application never reveals another User's data.
8. As a User deleting my identity, I want my Ledger and setup receipt removed with it, so that no orphaned financial data remains.
9. As a new User, I want a useful Default set of Income and Expense Categories, so that I can record common Transactions without first doing extensive setup.
10. As a User, I want Default set Categories to become ordinary owned Categories, so that I can rename, reparent, archive, or delete them under the normal rules.
11. As a returning User, I want changes to future Default sets not to overwrite my taxonomy, so that my established Categories remain mine.
12. As a new User, I want Runway not to guess my Accounts or Opening balances, so that my first Balance is truthful.
13. As a User with no Accounts, I want ordinary surfaces to point me to Add an account, so that First run is useful without becoming a separate wizard.
14. As a User, I want First run to be derived from current data, so that the same helpful state returns if required data later becomes absent.
15. As a User, I want each Account to record its name, Opening balance, Opening date, and display order, so that the Ledger begins from a known truthful state.
16. As a User, I want an Opening balance to be Account state rather than a synthetic Transaction, so that the Ledger contains only actual money movements.
17. As a User, I want to edit an Account's Opening balance, so that an initial mistake can be corrected retroactively.
18. As a User, I want to move an Account's Opening date earlier, so that I can back-enter older Transactions safely.
19. As a User, I want a later Opening date refused when older Transactions exist, so that money is never counted outside the Account's Ledger history.
20. As a User, I want Accounts to allow negative Balances, so that correct Transactions are not rejected merely because of entry order or temporary overdraft.
21. As a User, I want to reorder Accounts with simple up and down controls, so that frequently used Accounts stay predictable in pickers.
22. As a User, I want to archive an Account only when its current Balance is zero, so that archived Accounts never hide money.
23. As a User, I want archived Accounts removed from new-Transaction choices and the Balance list, so that closed Accounts do not clutter daily use.
24. As a User, I want archived Accounts retained on historical Transactions, so that my Ledger remains understandable.
25. As a User, I want to delete an Account only when no Transaction references it, so that historical money movements cannot be broken.
26. As a User, I want a refused Account archive or delete action to explain why it is blocked, so that I know how to resolve it.
27. As a User, I want Income and Expense Categories kept separate, so that irrelevant choices never appear during entry.
28. As a User, I want Categories to support a top level and one Child level, so that the taxonomy is useful without becoming difficult to navigate.
29. As a User, I want to attach a Transaction directly to a Parent category, so that adding children does not force me to reclassify history.
30. As a User, I want direct-to-Parent amounts shown as Other in a breakdown, so that Child totals always reconcile to their Parent.
31. As a User, I want Category names unique among live siblings without being globally unique, so that names remain concise and meaningful in context.
32. As a User, I want to rename or reparent a Category retroactively, so that correcting my taxonomy updates historical summaries consistently.
33. As a User, I want a Parent category with children prevented from becoming a Child, so that Category nesting never exceeds two levels.
34. As a User, I want archiving a Parent category to archive its Child categories atomically, so that no live Child becomes unreachable.
35. As a User, I want unarchiving a Parent not to restore its children automatically, so that Categories archived for separate reasons stay archived.
36. As a User, I want a Child category to remain archived while its Parent is archived, so that every live Category has a live Parent.
37. As a User, I want archived Categories absent from new-Transaction choices but visible in historical summaries and edits, so that history retains its meaning.
38. As a User, I want to delete only unused Categories with no children, so that mistakes are removable without destroying Ledger history.
39. As a User, I want Category and Account administration in Settings, so that daily navigation stays focused on Transactions and Summary.
40. As a User, I want archived rows hidden by default and revealed in place with one toggle, so that ordinary settings stay concise while restoration preserves context.
41. As a User, I want Account and Category create and edit forms to open over their settings lists, so that low-frequency administration remains compact on mobile and desktop.
42. As a User, I want irreversible deletes and cascading Parent archives confirmed, so that their consequences are deliberate.
43. As a User, I want to record Income as money arriving in one Account with one Income Category, so that the Ledger captures external inflows.
44. As a User, I want to record an Expense as money leaving one Account with one Expense Category, so that the Ledger captures external spending.
45. As a User, I want to record a Transfer once with distinct source and destination Accounts and no Category, so that moving my own money is not counted as Income or Expense.
46. As a User, I want every Transaction amount to be a positive exact count of Satang, so that direction and arithmetic cannot disagree.
47. As a User, I want Transaction dates to be Bangkok Calendar dates rather than timestamps, so that a timezone conversion cannot move a Transaction to another day.
48. As a User, I want to add an optional Note to a Transaction, so that I can retain useful context without introducing payees, tags, or receipts.
49. As a mobile User, I want entry to open as a bottom sheet above the Transactions list, so that I can record money one-handed without losing context.
50. As a desktop User, I want entry and edit to use a focused dialog and normal text amount input, so that the interface fits a keyboard and larger screen.
51. As a mobile User, I want category-first entry with large Parent choices, search, and Child drill-in, so that the hardest choice receives the most space.
52. As a mobile User, I want a baht-first keypad where digits enter whole baht and a decimal opens two Satang places, so that common amounts are fast and exact.
53. As a User, I want today's Calendar date and my last-used Account prefilled for new entry, so that common Transactions require fewer taps.
54. As a User, I want Transfer to be a first-class entry type, so that its second Account does not burden ordinary Income and Expense entry.
55. As a User, I want unavailable entry types hidden according to live Accounts and Categories, so that I never enter a form that cannot be completed.
56. As a User, I want Fast repeat cards to copy a recent Transaction and date the copy today, so that repeat purchases can be recorded in at most two taps after opening entry.
57. As a User, I want stale or archived Fast repeat choices filtered and safely rejected, so that a shortcut cannot bypass current lifecycle rules.
58. As a User, I want successful creation confirmed by a toast with Undo and a flashing new row, so that accidental duplicates are easy to reverse.
59. As a User, I want the create Undo action to delete only the newly created Transaction, so that no soft-delete or recovery bin complicates Ledger arithmetic.
60. As a User, I want the Transactions list to be the post-login home surface, so that recording and reviewing daily activity is immediately available.
61. As a User, I want a whole Calendar month's Transactions in one date-grouped list, so that ordinary monthly activity is easy to scan without pagination.
62. As a User, I want sticky Calendar-date headers without misleading daily subtotals, so that Transfers do not make the list arithmetic confusing.
63. As a User, I want each Transaction row to show its type, Category or Transfer direction, Account context, optional Note, and signed display amount, so that I can recognize it quickly.
64. As a User, I want tapping a Transaction row to open its full form directly, so that correcting a value does not repeat the category-first creation flow.
65. As a User, I want changing a Transaction type to preserve the still-meaningful Account and clear incompatible fields, so that edits remain coherent.
66. As a User, I want a one-tap source/destination swap when editing a Transfer, so that reversing an accidental Transfer direction is easy.
67. As a User, I want deleting a Transaction to require confirmation and then remove it permanently, so that aggregates cannot silently include soft-deleted rows.
68. As a User, I want expected validation errors beside the fields I can fix, so that I can correct an entry without hunting for the problem.
69. As a User, I want form-level invariant errors immediately above Save, so that errors without one owning field remain visible at the initiating control.
70. As a User, I want my draft preserved after validation, network, and retryable server failures, so that I do not have to re-enter data.
71. As a User, I want a future-dated Transaction accepted and visibly labelled before save, so that planned entry is possible without silently affecting today's Balance.
72. As a User, I want the Transactions URL to preserve the selected Period and optional Category filter, so that a filtered Ledger view is shareable and survives Back.
73. As a User, I want an empty month to name the Period, so that I can distinguish a real empty Ledger from a broken page.
74. As a User, I want a Summary for one Calendar-month Period, so that I can review Income, Expenses, net movement, and Account Balances together.
75. As a User, I want the Summary hero to emphasize net movement so far for the selected Period, so that the most important result is visible first on mobile.
76. As a User, I want Spending, Income, and Accounts lenses to retain their headline values on mobile, so that switching detail never hides the other totals.
77. As a desktop User, I want the three Summary panels visible side by side, so that extra width supports comparison rather than adding new content.
78. As a User, I want top-level spending rows to include a proportional bar and share of total spending, so that the breakdown is both chart and list.
79. As a User, I want a Parent category to drill into Child categories and its own Other amount, so that every total can be explained.
80. As a User, I want a Child or childless Parent category row to open the matching filtered Transactions list, so that I can see which Transactions produced a figure.
81. As a User, I want archived Categories with activity in the Period included and marked in Summary, so that historical totals remain complete.
82. As a User, I want Accounts shown in a separate Summary lens with an explicit as-of Calendar date, so that Balances are not confused with Period movement.
83. As a User, I want each Balance computed as of the Period end clamped to today, so that past Periods are historically coherent and future Transactions do not change today's money.
84. As a User, I want Transfers excluded from Income, Expense, net, and Category totals while affecting both Account Balances, so that internal movement remains money-neutral across the Ledger.
85. As a User, I want Summary empty states per panel rather than one blank screen, so that available Accounts or Income remain useful when another panel has no data.
86. As a User, I want Period changes in Transactions and Summary to push browser history and retain scroll, so that Back returns to the Period I was reviewing.
87. As a User, I want Summary tab changes to replace history and category drill-in to push history, so that Back reflects visible hierarchy rather than incidental lenses.
88. As a User, I want opening create or edit to add exactly one history entry, so that Back closes the sheet or dialog without stepping through its internal picker state.
89. As a User, I want direct create and edit URLs to open over the Transactions list, so that those states are meaningful when linked or restored.
90. As a User, I want successful mutations to refresh Transactions and Summary, including prefetched and previously visited Periods, so that committed data never appears stale.
91. As a User, I want Summary first paint to show real content or truthful empty states without aggregate skeletons, so that loading is never mistaken for no data.
92. As a User, I want adjacent Periods prefetched and delayed pending feedback only on the arrow I touched, so that navigation feels immediate without flashing spinners.
93. As a User, I want Summary prefetch to begin only when I show navigation intent from Transactions, so that the daily home surface does not fetch rarely used data unnecessarily.
94. As a mobile User, I want a pinned Transactions and Summary tab bar with the entry button clear of it, so that daily navigation and one-handed entry do not collide.
95. As a desktop User, I want Transactions and Summary in a top header without a sidebar, so that the Summary can use the page width and navigation stays proportional to two destinations.
96. As a User, I want Settings reachable from my avatar at every width, so that Account and Category administration is available without crowding daily navigation.
97. As a User, I want the selected Period carried between Transactions and Summary while surface-local filters are dropped, so that I do not jump to another month mid-investigation.
98. As a User, I want all human-readable Money, Calendar date, Period, and share labels produced by the server, so that every surface presents consistent values.
99. As a User, I want Runway to behave identically regardless of the application process or database session timezone, so that Bangkok Calendar dates remain correct in development, CI, and production.
100. As an operator, I want startup to fail before serving traffic if Bangkok `Intl` support is unavailable, so that the application cannot silently assign wrong Calendar dates.

## Implementation Decisions

- Implement tracking as one vertical feature owned by the web application. The
  feature contains shared domain values, Transaction recording, Ledger reading,
  Account lifecycle, Category lifecycle, Default-set provisioning, Next.js
  server adapters, and MUI presentation. These are internal behavior modules,
  not sibling public features.
- Keep Next.js as the single composition root and application deployable. Server
  Actions call tracking operations in-process; do not add an internal HTTP API or
  Hono boundary.
- Expose one server-only feature root as the deliberate public interface used by
  route modules and server-side callers. Interactive Client Modules remain
  internal, receive serializable data and dedicated Server Actions, and never
  import the server-only root.
- Keep the framework-neutral dependency direction acyclic: presentation depends
  on server adapters; server adapters depend on behavior modules; behavior
  modules depend on shared domain values and the database infrastructure. Enforce
  that domain and behavior modules do not import Next.js, React, MUI, or Better
  Auth.
- Keep Money and Calendar as deep shared domain modules. Each behavior module
  owns its input schemas, output contracts, and private failures. Do not create a
  generic repository, global domain package, global auth package, or
  persistence-shaped public interface.
- Use MUI as the component and token system and CSS Modules for structural and
  page-specific layout. Keep Client Component boundaries as narrow as the
  interaction requires. Shared UI receives only genuinely domain-free reusable
  primitives; tracking-specific controls stay in the feature.
- Use UUIDv7 for all new persisted and public identifiers, including User,
  Account, Category, Transaction, and receipt identifiers represented across
  application seams or URLs. Any Better Auth adapter limitation must become an
  explicit follow-up decision rather than an implicit format change.
- Validate every protected Server Action, Route Handler, and server-rendered
  entry point through Better Auth. Translate the authenticated session User ID to
  an application-owned `UserId` and pass only a `TrackingIdentity` into ordinary
  tracking operations. Tracking never accepts Better Auth sessions, cookies,
  requests, headers, or ownership supplied by the client.
- Keep authoritative authorization inside tracking. Collection reads qualify by
  the authenticated User; identifier reads and mutations use one predicate that
  combines identifier and owner; inserts derive ownership from identity; and
  related Accounts, Categories, Parents, and Transactions are resolved through
  owner-qualified predicates.
- Return the same `notFound` result for absent and foreign identifiers. Treat
  missing, archived, wrong-type, and foreign related rows as non-disclosing
  validation failures. Hidden controls and route guards are usability aids, not
  authorization.
- Cascade Better Auth User deletion through owned Accounts, Categories,
  Transactions, and the Default-set delivery receipt. Do not soft-delete the
  User or leave orphaned financial data.
- Enable Better Auth's own database transaction support. After its User creation
  commits, invoke one trusted idempotent Default-set provisioning operation from
  the supported post-creation hook. Do not couple registration to undocumented
  Better Auth internals to obtain cross-feature atomicity.
- Provision the complete Default set and a unique unversioned delivery receipt
  in one feature-owned atomic write. A failed attempt writes neither; concurrent
  and repeated attempts become successful no-ops after one commit. The receipt
  records delivery only and is never inferred from Category counts.
- Treat a missing receipt as incomplete tracking setup, not First run. On each
  authenticated tracking entry, retry provisioning once before returning a
  blocking, retryable setup state. Existing Categories without a receipt are an
  invariant failure requiring operational repair; never merge or re-seed
  ambiguous data.
- Seed thirty ordinary user-owned Categories for future registrations: six
  top-level Income Categories (`Adjustment`, `Bonus`, `Gifts & Support`, `Other
Income`, `Refunds`, `Salary`) and twelve top-level Expense Categories
  (`Adjustment`, `Entertainment`, `Family & Gifts`, `Fees & Taxes`, `Food &
Beverage`, `Health`, `Housing`, `Other Expense`, `Personal Care`, `Shopping`,
  `Transport`, `Travel`). `Food & Beverage` has `Coffee`, `Delivery`, `Dining
Out`, and `Groceries`; `Housing` has `Electricity`, `Internet`, `Rent`, and
  `Water`; `Transport` has `Fuel`, `Parking & Tolls`, `Public Transport`, and
  `Taxi & Ride-hailing`.
- Never provision Accounts. First run is derived from missing required live data,
  not stored as a phase. The Default set is never re-offered, version-upgraded,
  or protected from ordinary Category lifecycle operations.
- Represent the owned Ledger with Accounts, Categories, Transactions, and the
  separate provisioning receipt. The database infrastructure package owns the
  PostgreSQL pool, Drizzle schema, reviewed migrations, and transaction
  primitive; tracking owns queries, validation, atomic writes, and workflow
  boundaries.
- Store one Transaction row with a positive amount and structural direction.
  Income has a destination Account and Income Category; Expense has a source
  Account and Expense Category; Transfer has distinct source and destination
  Accounts and no Category. Do not introduce signed amounts, separate Transfer
  rows, double-entry legs, a cached Balance, an Account kind, or a currency
  column.
- Store Account name, signed Opening balance, Opening date, display order, and
  archive state. Store Category name, Income-or-Expense type, optional Parent,
  and archive state. Opening balance remains Account state rather than a
  Transaction.
- Make PostgreSQL the final authority for positive Transaction amounts,
  type-dependent direction slots, distinct Transfer Accounts, non-null
  ownership, foreign-key existence, owner/type-compatible references,
  case-insensitive uniqueness among live Account names and Category siblings,
  and restrictive deletion of referenced rows.
- Use composite ownership and type references so cross-User Account, Category,
  Parent, and Transaction relationships are unrepresentable even if feature
  code is defective. Reuse the Transaction type value set for Categories while
  excluding Transfer through a database constraint.
- Keep cross-row rules in authorized feature operations for this MVP: a Parent
  cannot itself have a Parent; a Transaction cannot predate either involved
  Account's Opening date; an Account can be archived only at zero current
  Balance; a live Child requires a live Parent; and Parent archive cascades to
  its children. Re-lock and re-check the affected rows inside atomic writes.
- Use Account rows as the shared lock target when Transaction recording or
  Account lifecycle can race. Concurrent Account archive and Transaction create
  must serialize into one refused operation, never an archived non-zero Account.
  Lock both neighbor Accounts for reordering and the relevant Parent Category
  for hierarchy changes.
- Allow hard deletion of an Account only when no Transaction references it, and
  of a Category only when no Transaction or Child references it. Archive
  referenced Accounts and Categories. Hard-delete Transactions after explicit
  confirmation; do not add Transaction soft deletion.
- Archive a Parent Category and its live children in one atomic write. Unarchive
  does not cascade. Refuse Child unarchive until its Parent is live. Historical
  reads retain archived identities, while creation pickers show live choices and
  edit pickers additionally retain the currently selected archived value.
- Derive Balance for an Account as Opening balance plus incoming Money through
  the as-of Calendar date minus outgoing Money through that date. Transfers
  affect both Accounts without a type branch. Never persist or expose a cached
  Balance or database Balance view; begin with indexed aggregate queries and
  revisit only after measured need.
- Compute Summary hero values, category breakdown, and as-of Balances in one SQL
  statement built from common table expressions so they share one PostgreSQL
  snapshot. Independent queries are acceptable for the Transactions page because
  its payload has no internally reconciling figures.
- Persist Money in PostgreSQL `bigint` Satang and use JavaScript `bigint` through
  Drizzle. Wrap exact minor-unit values in the framework-neutral `Money` domain
  value, normalize aggregate numeric values immediately, and parse decimal input
  as text without floating-point multiplication.
- Persist Transaction and Opening dates as PostgreSQL `date` values through
  Drizzle string mode. Represent them as opaque canonical `CalendarDate` values;
  never construct JavaScript `Date` objects from Ledger date strings.
- Represent operational and audit events as Instants and persist every Instant
  column as PostgreSQL `timestamp with time zone`. Never substitute an Instant
  for a Ledger Calendar date.
- Represent Period as one calendar month with a validated `YYYY-MM` key. The
  Bangkok-aware server derives Period start, end, neighbors, labels, current
  Calendar date, and `asAtDate = min(periodEnd, today)`. SQL always receives an
  explicit bound date and never uses `CURRENT_DATE`.
- Serialize Money as exact minor-unit text plus one server-owned formatted label;
  Calendar dates as ISO text plus one server-owned label; Periods as validated
  keys, labels, bounds, and neighbors; and category share as one ratio plus one
  formatted percentage. Client code performs no Money arithmetic, Money
  formatting, Calendar conversion, or Period derivation.
- Publish four surface-shaped reads: Transactions page, Summary, Account
  settings, and Category settings. The server owns Period arithmetic, as-of
  rules, category rollups, `Other`, liveness selection, and per-row lifecycle
  capabilities rather than forcing adapters to compose entity-shaped reads.
- Publish Transaction create, update, and delete; Account create, update, move,
  archive, unarchive, and delete; Category create, update, archive, unarchive,
  and delete; and tracking readiness and Default-set provisioning operations.
  Create-only Undo calls the existing Transaction delete operation.
- Return expected operation failures through one feature-owned discriminated
  result contract with `notFound`, field-aware `invalidInput`, reasoned
  `notPermitted`, and retryable `setupRequired` cases. Expected failures do not
  throw. Database constraint violations remain exceptional final guards rather
  than normal presentation paths.
- Use one protected-invocation composition in the Next.js server seam for session
  validation, identity translation, readiness and retry, surface invocation,
  DTO mapping, and route freshness. A direct mutation that somehow bypasses the
  composition must still fail closed with `setupRequired`.
- Use one Server Action per mutation. Each adapter authenticates, parses
  transport input through the owning behavior schema, invokes tracking, maps a
  serializable result, and revalidates affected paths after commit. Do not add
  Route Handlers for internal calls.
- Make `/transactions` the post-login home and `/summary` its flat sibling.
  Preserve `period=YYYY-MM` across them while dropping surface-local parameters.
  Use an avatar entry into Settings. On mobile, use a pinned two-item bottom bar;
  on desktop, use a top header and no sidebar.
- Use `/transactions?new=1` for create and `/transactions?edit=<transactionId>`
  for edit. Opening either adds exactly one history entry and keeps picker/form
  steps local. Browser Back closes it, Forward reopens it, and direct requests
  render the Transactions list underneath. Close replaces the clean URL when a
  safe same-page history entry is unavailable.
- Use a mobile bottom sheet and desktop dialog for the shared Transaction form.
  New entry opens the full-sheet Category picker before the form; edit opens the
  form directly and treats Category as a field that opens the picker on demand.
  Transfer uses a first-class type tab and source/destination Account controls.
- On mobile, use a baht-first custom amount keypad; on desktop, use a focused
  text input feeding the same parser. Date defaults to today's Bangkok Calendar
  date and Account defaults to the last used choice. Note remains optional.
- Render an entry type only when its prerequisites exist: Income and Expense
  each require a live Category of the matching type and one live Account;
  Transfer requires two live Accounts. Show the entry button only when at least
  one type is recordable, and use empty-state links to Settings when none are.
- Provide Fast repeat cards at the top of the picker. A repeat copies type,
  Category or Accounts, amount, and Note, but dates the new Transaction today.
  Filter invalid repeat candidates; treat a stale repeat failure as retryable
  feedback rather than opening the full form unexpectedly.
- Keep the Transaction draft mounted until a successful commit. Render typed
  field errors next to controls and invariant errors above Save. Put retry-only
  network or unexpected failures in a destructive toast at the initiating
  surface. Session expiry is the only accepted draft-loss case.
- Disable Save for obviously impossible local states, omit the selected source
  Account from a Transfer destination list, constrain Transaction date to the
  later involved Opening date, and keep server-side validation as the authority.
  Future Calendar dates remain legal and visibly labelled.
- On Transaction type change, retain the still-meaningful Account in its
  structural direction slot, remove incompatible Category or Account fields,
  and require newly necessary values. Provide a dedicated Transfer direction
  swap control.
- After create, close the sheet, flash the new row, and show a toast with Undo.
  After edit, flash the row and show a toast without Undo. Confirm before delete
  and show a plain completion toast afterward.
- Load the selected month's Transactions in one payload with no pagination or
  virtualization until measured volume reaches a few hundred rows in one month.
  Group by sticky Calendar-date headings, omit day subtotals and header summary
  numbers, and support only the Period and optional Category filter.
- Compose Summary around a net-movement hero and Period switcher. Below desktop,
  use Spending, Income, and Accounts tabs whose labels retain headline values;
  at desktop width, render all three panels in columns and keep the tab query
  value inert for later mobile restoration.
- Integrate top-level category bars directly into Spending rows. Derive each bar
  and label from the same share value. A Parent with children drills into Child
  rows plus its own `Other` line; a childless Parent or drill-in row links to the
  Category-filtered Transactions list. Account rows are not links.
- Send Summary as one blocking payload and provide truthful per-panel empty
  states. Do not add Summary aggregate skeletons, deferred partial payloads, or
  optimistic Period figures.
- Use native App Router query and history state: Period links push and retain the
  current Summary tab while clearing drill-in; tab selection replaces; category
  drill-in pushes; and Back moves up the visible hierarchy. Invalid empty
  deep-links fall back to the Parent list.
- Revalidate both Transactions and Summary after every committed Transaction
  mutation, including Undo. Start with uncached owner-scoped Drizzle reads. If
  persistent server caching is later introduced, use owner-qualified cache tags
  and read-your-own-writes invalidation rather than adding tags before cached
  reads exist.
- Prefetch adjacent Period links explicitly. Show a fixed-size pending indicator
  only on the touched arrow after a short delay. From Transactions, arm Summary
  prefetch only on hover, keyboard focus, or touch/pointer intent.
- Keep the application process timezone uniformly UTC in development, CI, and
  Railway; do not set a PostgreSQL session timezone. Resolve Bangkok dates only
  through an explicit `Asia/Bangkok` formatter. Add a Dockerfile comment pointing
  to the deployment decision so UTC is not later treated as misconfiguration.
- Add a read-only startup assertion that `Intl` supports and resolves
  `Asia/Bangkok`. The startup hook performs no migrations, DDL, or database work.
- Use Drizzle rather than raw pool queries for Ledger date reads and test helpers,
  keep all Ledger date columns in string mode, use no `CURRENT_DATE`, and keep
  every Instant column timezone-aware.
- When Railway PostgreSQL is first provisioned, inspect `TimeZone` and
  `DateStyle`. Require ISO `DateStyle`; record the cluster timezone for diagnosis
  but do not make it application behavior.

## Testing Decisions

- Prefer the highest observable seam: real-PostgreSQL behavior tests call the
  public tracking interface and assert externally visible results. Tests should
  not depend on private helper names, SQL text, Drizzle row shapes, React
  component structure, or the number of internal queries unless the public
  consistency contract requires it.
- Use Vitest with the Node environment as the repository TypeScript runner. Add
  package-level test scripts and root Turbo orchestration. Keep integration tasks
  uncached in local and CI execution.
- Make the public tracking interface the primary contract-test seam for all four
  reads and every mutation. Cover ownership, authorization, lifecycle,
  Transaction invariants, Fast repeat inputs, exact Summary and Balance
  arithmetic, atomic workflows, typed expected failures, and concurrency through
  that one seam.
- Group real-PostgreSQL behavior tests beside the five framework-neutral behavior
  modules while invoking public exports. Add focused internal tests only for a
  meaningful private concurrency seam, particularly shared Account locking.
- Use pure unit tests only for deep value interfaces: Money construction,
  decimal parsing, normalization and formatting; Calendar date and Period
  arithmetic; as-of date policy; and Bangkok Calendar-date resolution from fixed
  Instants.
- Let the database infrastructure package own migration/bootstrap helpers,
  migration-from-empty coverage, named constraint tests, and schema inspection.
  Build test databases from committed reviewed migrations; never use schema push
  or direct test table creation.
- Run integration tests against a dedicated serialized PostgreSQL test database.
  Require `TEST_DATABASE_URL`, separate test-only credentials, and a validated
  test-only database name. Fail closed if the URL is missing or unsafe, and never
  fall back to the development `DATABASE_URL`.
- Apply migrations before the suite and reset the isolated database between
  tests. Do not rely on wrapping each test in a rollback transaction because
  feature operations may use independent pooled connections. Testcontainers is
  optional future hardening, not an MVP dependency.
- Keep reset, fixture, and database helpers out of production exports. Do not use
  raw pool queries for Calendar-date fixture reads; exercise Drizzle's configured
  string-mode path.
- Use hand-computed literal Money expectations. No test may derive an expected
  value from the operation or aggregate layer under test. Keep financial fixtures
  small enough to verify by hand; shared helpers may create structural context
  but each test declares the Transactions whose Money affects its result.
- Preserve the archived arithmetic prior art in current-stack tests: inclusive
  Period boundaries, the distinction between Period totals and an as-of Balance
  clamped to today, exact transfer symmetry, transfer exclusion from Income and
  Expense, Parent direct amounts represented as `Other`, archived Category
  history, zero-spending ratios, and two-User aggregate isolation.
- Cover all Transaction row constraints and relational ownership constraints in
  PostgreSQL. Include cross-User references, wrong Category type, invalid
  direction slots, non-positive amounts, same-Account Transfers, restrictive
  deletion, live-name uniqueness, and Category hierarchy references.
- Cover every public operation returning a typed result for expected failures.
  Prove that absent and foreign identifiers are observationally identical and
  that spoofed ownership input is ignored.
- Cover two-User isolation for collection reads, identifier reads, all mutations,
  Summary aggregates, Account and Category relationships, and deletion cleanup.
  Ensure deleting one User removes only that User's Ledger and receipt.
- Cover successful, failed, repeated, and concurrent Default-set provisioning.
  Assert the all-thirty-Categories-plus-receipt invariant, rollback on partial
  failure, retry gating, successful repair, no re-seeding after User edits, and
  invariant failure for Categories without a receipt.
- Cover atomic and concurrency behavior: Transaction dates checked under Account
  locks, concurrent Transaction create versus Account archive, Account Opening
  date changes versus Ledger history, Parent Category archive cascades, refused
  Child unarchive under an archived Parent, Account neighbor swaps, and internally
  consistent Summary figures during a concurrent write.
- Run pure Money, Calendar, Period, and Bangkok resolver tests under UTC and a
  second dedicated Vitest project using `Pacific/Honolulu`. Choose boundary
  Instants at which UTC, Bangkok, and Honolulu produce different Calendar dates;
  do not duplicate the entire integration suite across timezones.
- Add one non-UTC driver-seam round-trip integration test that writes a boundary
  Calendar date and reads the exact `YYYY-MM-DD` value through the public tracking
  interface. This guards Drizzle string mode and driver parser behavior.
- Add one schema inspection test asserting every Instant column is PostgreSQL
  `timestamp with time zone` and every Ledger date column is PostgreSQL `date`.
- Keep Next.js adapter tests thin. Mock authentication and tracking to cover
  session rejection, identity translation, transport parsing, readiness gating,
  retry-once composition, DTO serialization, typed error mapping, and route
  revalidation. Do not repeat PostgreSQL behavior through adapter mocks.
- Add a compile/build boundary test that a Client Module cannot import the
  server-only feature root. Enforce the absence of framework imports from the
  domain and five behavior modules with lint, not repeated source-inspection
  tests.
- Use a narrow Playwright suite against a production Next.js build for behavior
  that depends on App Router history, caching, and browser networking: direct and
  in-session create/edit URLs; exactly one history entry; Back/Forward;
  validation draft retention; Summary tab replace and drill-in push; Period
  navigation; category-to-Transactions navigation; create flash and Undo;
  mutation freshness for visible, prefetched, and Back-restored views; intent-only
  Summary prefetch; and arrow-local delayed pending feedback.
- Do not add jsdom, React Testing Library, general Client Component tests, broad
  visual browser coverage, or performance thresholds. The browser suite verifies
  route/history/network behavior, not MUI implementation details.
- Existing in-repository prior art is architectural rather than executable: the
  application currently has no test runner or tests, while the accepted vertical
  feature ADR makes the public feature root the contract seam. The archived
  tracking decisions provide the hand-computed boundary, transfer, rollup,
  isolation, and Bangkok/UTC scenarios to translate into Vitest, PostgreSQL, and
  Playwright coverage.

## Out of Scope

- Budgeting, forecasting, and calculation or presentation of Runway.
- Credit cards, Account kinds, multi-currency, configurable currency, or exchange
  rates.
- Shared Ledgers, roles, household collaboration, ownership transfer, or
  administrator access to another User's Ledger.
- Payees, merchants, receipts, attachments, tags, free-text search, Account or
  Transaction-type filters, and Account statements.
- Imports, bank feeds, export workflows, explicit reconciliation, or a separate
  Adjustment Transaction type.
- Recurring or scheduled Transactions. Fast repeat creates one immediate
  Transaction only.
- Weekly, quarterly, yearly, custom-range, payday-aligned, or all-time Periods.
- Pagination, virtualization, or a Transaction search system before measured
  monthly volume reaches the stated revisit threshold.
- A separate chart component or charting dependency beyond category bars
  integrated into Summary rows.
- PWA installation, offline entry, optimistic Transaction creation, background
  synchronization, or durable client-side draft storage.
- Inline Category creation from Transaction entry, a first-run wizard, an
  onboarding-complete flag, Default-set import, re-seeding, or Default-set
  version upgrades.
- Transaction soft deletion, a recycle bin, general mutation Undo, or an
  Account/Category reset that preserves the login.
- A cached Balance, materialized Balance projection, database Balance view, or
  PostgreSQL triggers for current cross-row invariants.
- A general repository abstraction, a global domain/auth/testing package, moving
  tracking into a shared package, or extracting a separate Hono/API deployable.
- Cache Components or persistent server caching. Enabling either requires a new
  decision that defers the Bangkok clock correctly and introduces owner-qualified
  invalidation.
- Testcontainers as a required MVP dependency, general component testing,
  screenshot testing, and CI performance benchmarks.
- Provisioning Railway itself, configuring backups, or automating the one-off
  PostgreSQL `TimeZone` and `DateStyle` inspection.
- Rebuilding, modifying, or deleting the immutable legacy project archive.

## Further Notes

- The repository currently contains a minimal Next.js/React workspace. MUI,
  Better Auth, Drizzle, the database infrastructure package, Vitest, Playwright,
  zod, the tracking feature, migrations, and deployment packaging are accepted
  architecture but still need implementation.
- The specification follows the accepted modular-monolith, vertical-feature,
  PostgreSQL/Drizzle, Better Auth authorization, MUI/CSS Modules, Railway, and
  post-commit Default-set provisioning decisions. No accepted ADR conflict was
  found.
- `Transaction` always means one domain money movement. Use `atomic write` for a
  database transaction boundary to avoid overloading that term.
- `Other` is reserved for the Summary line containing Money attached directly to
  a Parent category that also has children. It is not a Category name and does
  not mean uncategorized.
- Negative Account Balances are permitted and presented distinctly; they are not
  validation failures. Future-dated Transactions are also permitted but do not
  affect a Balance whose as-of Calendar date precedes them.
- The framework-neutral half remains extraction-ready if a second deployable
  becomes real: domain values and all five behavior modules can move together
  into a feature-named shared package while server adapters and presentation stay
  in the web application. This preserves an option; it does not authorize the
  extraction now.
- If a future raw-SQL writer, import pipeline, or second persistence adapter is
  introduced, revisit whether the Opening-date and hierarchy invariants require
  PostgreSQL triggers. If Summary or Balance queries become measurably slow,
  attempt indexed aggregates before designing a consistency mechanism for any
  cache.
