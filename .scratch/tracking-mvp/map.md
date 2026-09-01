# Tracking MVP current-stack migration

Label: wayfinder:map

## Destination

A decision-complete map for the tracking MVP in the current Next.js, MUI, Drizzle, and Better Auth architecture, with portable legacy product decisions retained by reference, stack-invalidated conclusions re-decided, and the domain glossary captured in `CONTEXT.md`—ready to hand to `/to-spec`, not to implementation.

## Notes

**Domain.** Runway begins with a personal ledger of actual Income, Expense, and Transfer Transactions across multiple Accounts in THB. Budgeting, forecasting, and the Runway calculation consume this ledger later and are outside this effort.

**Primary source.** The immutable legacy Wayfinder archive lives outside this repository, at `../runway.bak/.scratch/tracking-mvp/`. Its in-repo copy was removed on 2026-09-01; the `legacy-wayfinder/` links throughout this map and its tickets resolve against that directory. Its Laravel/Inertia/Tailwind/Pest conclusions are evidence about the old implementation, not current guidance. Never edit the archive while working this map.

**Current stack facts** (verified 2026-09-01): Next.js 16.3.2 and React 19.2.8 are installed in a pnpm/Turborepo workspace on Node 24. MUI, Drizzle, Better Auth, `packages/db`, and a test runner are architectural decisions but are not installed or scaffolded yet. PostgreSQL, vertical feature modules, feature-owned authorization, MUI with CSS Modules, and Railway deployment are fixed by `docs/adr/0001` through `0006`.

**Identifier preference.** Use UUIDv7 for all new persisted and public identifiers, including application-owned identity values and identifiers represented in URLs. Surface any Better Auth or adapter limitation as a future decision rather than silently choosing another format.

**Skills.** Every decision session uses `grilling` and `domain-modeling`. Use `research` for the three factual frontier tickets, `codebase-design` for feature and persistence boundaries, and `prototype` only if current-stack facts reveal a user-visible interaction that cannot be settled in conversation.

**Standing rules.** Plan, do not build. Preserve the product invariant separately from any obsolete implementation rationale. Refer to tickets by linked title, never by bare number. Record new canonical domain terms in `CONTEXT.md` as they settle. Explicitly flag any proposed answer that conflicts with an accepted ADR.

## Decisions so far

- [Transaction shape across income, expense and transfer](legacy-wayfinder/issues/01-transaction-shape.md): retain one positive-amount Transaction with structural direction; Income, Expense, and Transfer remain the three product types, and a Transfer is one event.
- [Category taxonomy semantics and lifecycle](legacy-wayfinder/issues/02-category-taxonomy.md): retain the typed two-level taxonomy, direct-to-parent Transactions, reserved `Other` breakdown, and archive-versus-delete behavior; exact constraints are reopened.
- [Account lifecycle and balance derivation](legacy-wayfinder/issues/03-account-lifecycle-and-balances.md): retain Opening balance, Opening date, derived as-of Balance, zero-balance archive guard, negative balances, and ordinary Adjustment Transactions.
- [Money, dates and period boundaries](legacy-wayfinder/issues/04-money-dates-and-periods.md): retain THB minor-unit amounts, Bangkok-local calendar dates, calendar-month Periods, and server-owned human-readable values; TypeScript and wire representations are reopened.
- [Data ownership with open registration](legacy-wayfinder/issues/05-data-ownership-with-open-registration.md): retain per-user ownership, open registration, no shared ledgers, and user-deletion cleanup; Laravel global-scope enforcement is rejected by current ADR 0004 and reopened.
- [Prototype: mobile transaction entry](legacy-wayfinder/issues/08-prototype-mobile-transaction-entry.md): retain the mobile bottom-sheet flow, category-first entry, baht-first keypad, first-class Transfer path, and Fast repeat behavior independently of shadcn/Inertia.
- [Prototype: summary view composition](legacy-wayfinder/issues/09-prototype-summary-view.md): retain the hero plus Spending/Income/Accounts composition, drill-in breakdown, and category bars integrated into spending rows.
- [Default categories and first run](legacy-wayfinder/issues/10-default-categories-and-first-run.md): retain the ordinary per-user Default set, no guessed Accounts, data-derived First run, and per-entry-type availability rules; Better Auth provisioning is reopened.
- [Chart implementation: recharts or hand-rolled](legacy-wayfinder/issues/12-chart-implementation.md): retain the product form—single-accent horizontal bars embedded in category rows—but retire the old bundle and dependency comparison.
- [Admin surfaces for categories and accounts](legacy-wayfinder/issues/13-admin-crud-surfaces.md): retain list-owned create/edit interactions, archive visibility, lifecycle explanations, and account ordering; translate component details to MUI.
- [Testing the period and rollup arithmetic](legacy-wayfinder/issues/14-testing-the-period-and-rollup-arithmetic.md): retain hand-computed expectations, boundary fixtures, transfer invariants, tenant-isolation coverage, and Bangkok/UTC clock cases; the Pest/Laravel harness is retired.
- [Transaction list, edit and delete](legacy-wayfinder/issues/15-transaction-list-edit-and-delete.md): retain the list as home, tap-to-edit, hard deletion, category drill-in, whole-month payload assumption, and create-only Undo behavior.
- [Validation and error presentation](legacy-wayfinder/issues/16-validation-and-error-presentation.md): retain inline feedback for typed input, retry feedback at the initiating control, draft preservation except unavoidable session expiry, and prevention of impossible choices; Inertia mechanics are retired.
- [Loading behaviour for the summary](legacy-wayfinder/issues/17-summary-loading-behaviour.md): retain the intended experience of direct first paint, control-local navigation feedback, fresh post-mutation data, and meaningful browser Back behavior; all Inertia cache/navigation mechanisms are reopened.
- [Navigation and information architecture](legacy-wayfinder/issues/18-navigation-and-information-architecture.md): retain flat Transactions and Summary siblings, mobile bottom navigation, desktop top navigation, list-only entry affordance, real drill-in URLs, and Back-as-navigation; starter sidebar and Wayfinder route details are retired.
- [Runway domain glossary](../../CONTEXT.md): canonical implementation-free language imported from resolved legacy decisions.
- [Research Better Auth identity and provisioning boundaries](issues/01-research-identity-and-provisioning.md): Better Auth's public hooks cannot add the Default set to its sign-up transaction; current enforcement requires translated application identity, explicit owner predicates, and feature-owned authorization.
- [Research Drizzle data integrity and PostgreSQL testing](issues/02-research-data-integrity-and-testing.md): Drizzle directly expresses the preserved row constraints and relational indexes; cross-row rules still need operations or triggers, and real-PostgreSQL test isolation has viable current options.
- [Research Next.js interaction, cache, and history mechanics](issues/03-research-next-interaction-mechanics.md): Next.js can reproduce every accepted interaction with native history state, Links, controlled Server Actions, explicit path invalidation, and production-mode freshness tests.
- [Decide identity, ownership, and Default set provisioning](issues/04-decide-identity-ownership-and-default-data.md): authenticate at the Next.js seam, authorize inside tracking, and deliver the Default set post-commit through a gated idempotent workflow.
- [Decide the ledger persistence and feature boundary](issues/05-decide-ledger-persistence-boundary.md): keep the three-table owned Ledger and derived Balances inside tracking; let PostgreSQL enforce row/reference integrity and feature operations enforce cross-row rules without MVP triggers.
- [Decide the Next.js interaction and navigation contract](issues/06-decide-next-interaction-contract.md): use native query-history state, navigational Links, controlled Server Actions, explicit Transactions/Summary revalidation, skeleton-free Summary loading, intent-aware prefetch, and production-mode freshness tests.
- [Decide the TypeScript money and calendar contract](issues/07-decide-money-and-calendar-contract.md): use exact Satang `bigint` Money values and date-only Calendar dates internally, serialize strings plus server-owned labels, and keep Period/as-of derivation on the Bangkok-aware server.
- [Decide the tracking test architecture](issues/08-decide-test-architecture.md): use Vitest with real PostgreSQL, a dedicated fail-closed test database, explicit Bangkok dates, uncached Turbo integration tests, thin adapter tests, and a narrow production-mode Playwright suite; Testcontainers is optional future hardening, not an MVP requirement.
- [Research Bangkok calendar operations](issues/10-research-bangkok-calendar-operations.md): the Bangkok Calendar date contract needs no PostgreSQL, Railway, or runtime timezone setting; its safety rests on Drizzle string-mode dates and an explicit `Intl` time zone, leaving only operational guards to decide.
- [Decide the tracking module shape](issues/09-decide-tracking-module-shape.md): one `tracking` feature with framework-neutral `domain`/`operations` and Next.js-facing `server`/`ui`, twenty surface-shaped operations returning a `TrackingResult`, an enumerated atomic-write and lock table, and extraction to `packages/tracking` held open by an enforced one-way import rule.
- [Decide the Bangkok clock operational commitments](issues/11-decide-bangkok-clock-commitments.md): keep the process zone uniformly UTC as an ADR 0006 consequence, add a read-only `instrumentation.ts` Bangkok/`Intl` startup assertion, run pure date tests under `UTC` plus `Pacific/Honolulu` only, require `timestamptz` for every Instant column, and split the six residual bypasses into three test obligations, three review conventions, and a one-off `DateStyle` deployment check.

## Not yet specified

<!-- Nothing remains. Every ticket is resolved and no fog is left; the map is clear and ready to hand to `/to-spec`. -->

## Out of scope

- Rebuilding or deleting `../runway.bak`. It is the only remaining copy of the legacy Wayfinder archive and must survive until `/to-spec` has consumed this map.
- Implementing the tracking MVP, installing dependencies, scaffolding packages, or writing its final specification. `/to-spec` begins only after this map clears.
- Porting Laravel, Eloquent, Inertia, Tailwind, shadcn, Pest, Fortify, or PHP implementation patterns.
- Credit cards, explicit reconciliation, imports, recurring/scheduled Transactions, payees, receipts, PWA/offline operation, shared ledgers, multi-currency, configurable or non-month Periods, and charts beyond the accepted category breakdown.
- Budgeting, forecasting, and calculation of Runway.
- Whether a separate Hono deployable should exist. That is [ADR 0001](../../docs/adr/0001-adopt-a-single-deployable-modular-monolith.md)'s question; [Decide the tracking module shape](issues/09-decide-tracking-module-shape.md) only preserves the option to extract `packages/tracking` if it ever is.
