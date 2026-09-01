# 27: Explain Summary totals through Categories

**What to build:** Let a User explain every Summary Category total by moving from
top-level shares to Child amounts, direct-to-Parent `Other`, and finally the exact
filtered Transactions that contributed to a figure.

**Blocked by:** 18: Browse a monthly Ledger from Transactions; 24: Archive and
remove Categories without rewriting history; 26: Review monthly movement and as-of
Balances.

**Status:** ready-for-agent

- [ ] Top-level spending rows show a proportional bar and server-formatted share
      derived from the same exact ratio used by the label; zero spending never
      produces invalid arithmetic.
- [ ] A Parent with children drills into each Child plus an `Other` line containing
      Transactions attached directly to that Parent, and every displayed amount
      reconciles exactly to the Parent total.
- [ ] `Other` remains a calculated line rather than a Category, and a Parent may
      continue receiving Transactions directly after children exist.
- [ ] Child and childless Parent rows link to the matching Period and Category
      filter on Transactions; Parent drill-in uses meaningful URL state and invalid
      or empty deep links fall back safely without disclosing foreign data.
- [ ] Archived Categories with Period activity remain in the breakdown and are
      visibly marked, while Category rename and reparent changes historical
      summaries retroactively.
- [ ] Summary tab changes and category hierarchy state are represented without
      requiring client-side Money, Calendar, Period, or share calculation.
- [ ] Public-interface and browser tests use hand-computed fixtures for Child
      rollups, direct-to-Parent `Other`, archived history, zero-spending shares,
      category filtering, retroactive taxonomy edits, and two-User isolation.
