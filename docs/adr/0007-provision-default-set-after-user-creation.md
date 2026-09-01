---
status: accepted
---

# Provision the Default set after user creation

Accept a committed Better Auth User before provisioning their Default set, then deliver the set through one idempotent tracking operation with a durable one-time receipt. Better Auth's public user-created hook runs after its sign-up transaction; using it preserves the supported authentication seam, while strict User-plus-Default-set atomicity would require coupling Runway to lower-level, undocumented Better Auth internals.

## Consequences

- A provisioning failure does not turn a committed User into an apparent failed registration. Tracking remains gated, retries once on authenticated entry, and then presents an explicit Retry action while authentication and profile controls remain available.
- The complete Default set and its unversioned receipt commit together in a feature-owned transaction. Repeated and concurrent delivery attempts are successful no-ops after one commits.
- The receipt records delivery, not current Category state. Delivered Categories remain ordinary user-owned rows; they are never inferred from row counts, re-seeded, or upgraded.
- Better Auth's Drizzle transaction option remains enabled independently so its own multi-write sign-up is atomic.
