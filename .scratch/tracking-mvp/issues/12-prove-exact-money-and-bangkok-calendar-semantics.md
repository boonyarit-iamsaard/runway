# 12: Prove exact Money and Bangkok Calendar semantics

**What to build:** Give every later tracking behavior one exact, framework-neutral
way to accept, calculate, validate, and present Money, Calendar dates, Periods,
and Bangkok's current day, while making an unsafe runtime refuse to serve traffic.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Money accepts whole Satang, parses decimal text without floating-point
      multiplication, permits signed Opening balances and Balances, and supports
      positive-only Transaction validation.
- [ ] Calendar dates remain canonical date-only values, Periods remain validated
      calendar months, and no Ledger date operation constructs a JavaScript
      `Date` from a date string.
- [ ] Period bounds, neighbors, labels, Bangkok today, and the as-of date clamped
      to today are derived on the server and serialize with server-owned labels.
- [ ] Pure tests use hand-computed expectations and pass under UTC and
      Pacific/Honolulu, including boundary Instants where Bangkok has a different
      Calendar date.
- [ ] Startup performs a read-only assertion that `Asia/Bangkok` is supported and
      correctly resolved, with no migrations, DDL, or database access.
- [ ] Production packaging keeps the process timezone at UTC and documents that
      choice as an ADR 0006 commitment rather than setting the process or database
      session timezone to Bangkok.
- [ ] The modules remain framework-neutral and introduce no global domain package,
      satisfying ADRs 0001, 0002, and 0006.
