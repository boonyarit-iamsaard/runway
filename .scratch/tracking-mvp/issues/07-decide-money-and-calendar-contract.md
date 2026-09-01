# Decide the TypeScript money and calendar contract

Type: grilling
Status: resolved
Blocked by: 02, 03

## Question

Decide the current persistence, feature-interface, and server/client representation of THB amounts, transaction dates, month Periods, and as-of Balance dates.

The answer must keep minor-unit arithmetic exact, prevent JavaScript timezone conversion from changing a Bangkok calendar day, make human-readable values consistent, distinguish a date-only value from an instant, and prevent the browser from independently deriving period boundaries or current dates. Reassess the legacy PHP `Money` value object and server-formatting choice rather than porting them mechanically.

## Answer

Adopt one exact domain contract with explicit adapters at the persistence and Next.js server/client seams. The decision preserves the product's day-based Ledger semantics while replacing the legacy PHP and browser-specific representations.

### Money

- Persist THB as PostgreSQL `bigint` counts of Satang, using Drizzle's JavaScript `bigint` mode. Transaction amounts remain strictly positive; Opening balance and derived Balance remain signed.
- The framework-neutral tracking interface uses a `Money` value object wrapping the exact minor-unit `bigint`. It does not expose Drizzle rows or PostgreSQL aggregate types. Aggregate results, including PostgreSQL `numeric` values returned by `SUM(bigint)`, are normalized to `Money` immediately at the persistence adapter.
- No floating-point representation is permitted for money. The server parses client-entered decimal text without float multiplication and validates the resulting minor-unit value.

### Calendar dates and instants

- Persist Transaction dates and Opening dates as PostgreSQL `date` values, with Drizzle string mode. The tracking interface uses an opaque `CalendarDate` in canonical `YYYY-MM-DD` form.
- A Transaction is dated to a Calendar date, not an instant. Opening dates and as-of Balance dates use the same date-only value. Operational or audit timestamps are separate `Instant` values and never substitute for a Ledger date.
- No Ledger date is converted through JavaScript `Date`, whose timezone behavior could shift a Bangkok calendar day.

### Server/client representation

- Feature operations exchange domain `Money` and `CalendarDate` values and remain independent of Next.js, browser APIs, and authentication-framework types, consistent with [Organize code as vertical feature modules](../../../docs/adr/0002-organize-code-as-vertical-feature-modules.md).
- The Next.js server adapter maps those values into serializable view DTOs. A money DTO carries the exact minor value as a string alongside one server-produced human-readable formatted value; a date DTO carries its ISO value alongside one server-produced label.
- Client input remains text until the server adapter parses and validates it. Client code does not format money with `Intl`, construct dates from ISO strings, or perform money arithmetic.

### Period and as-of Balance authority

- `Period` remains a calendar month identified by the URL-compatible `YYYY-MM` key. The server validates the key and derives its start, end, neighboring Period keys, and human-readable labels.
- The server resolves the effective current Calendar date using the `Asia/Bangkok` application clock and passes that date explicitly into tracking reads. A read computes `asAtDate = min(periodEnd, today)` and binds it into SQL; queries never use PostgreSQL `CURRENT_DATE`.
- The browser receives ready-made Period values, bounds, and current/as-of dates. It never derives month boundaries or the current date.

This contract is consistent with the accepted PostgreSQL/Drizzle and feature-owned-authorization architecture in [Use PostgreSQL and Drizzle](../../../docs/adr/0003-use-postgresql-and-drizzle.md) and [Use Better Auth with feature-owned authorization](../../../docs/adr/0004-use-better-auth-with-feature-owned-authorization.md). The exact copy of human-readable labels remains a specification concern; their ownership and serialization shape are fixed here.
