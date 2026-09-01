# 18: Browse a monthly Ledger from Transactions

**What to build:** Make Transactions the useful post-login home where a User can
scan one Bangkok Calendar month of their Ledger, understand each money movement,
and distinguish an empty Period from a failed page.

**Blocked by:** 12: Prove exact Money and Bangkok Calendar semantics; 13: Establish
the owned Ledger integrity foundation; 14: Register, authenticate, and retain
identity control; 15: Deliver and repair the Default set.

**Status:** ready-for-agent

- [ ] Post-login navigation lands on Transactions and accepts a validated Period,
      defaulting to the Bangkok current month without reading the process or
      database session timezone.
- [ ] One owner-scoped, surface-shaped read returns the complete month with no
      pagination or virtualization and supports only the optional Category filter
      defined by the specification.
- [ ] Transactions are grouped beneath sticky Calendar-date headings with no daily
      subtotals; each row identifies type, Category or Transfer direction, Account
      context, optional Note, and a signed server-formatted Money label.
- [ ] The empty state names the selected Period and, when required live data is
      absent, derives helpful links to the relevant Settings surface.
- [ ] Invalid, absent, and foreign filter identifiers disclose no foreign data and
      collection reads remain isolated across two Users.
- [ ] The responsive shell provides the two daily destinations and avatar access
      to Settings without a sidebar or a second navigation hierarchy.
- [ ] The read is published through the server-only tracking root, remains uncached
      initially, and exposes no Drizzle types or presentation-driven entity
      composition, preserving ADRs 0001 through 0004.
- [ ] Public-interface tests cover Period boundaries, signed row presentation,
      transfer direction, filtering, empty states, archived identities, and
      two-User isolation with hand-declared fixtures.
