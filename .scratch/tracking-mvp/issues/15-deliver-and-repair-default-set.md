# 15: Deliver and repair the Default set

**What to build:** Give each newly registered User the complete Default set once,
without turning a post-registration setup failure into an apparent registration
failure, and provide an honest repair path when automatic recovery does not work.

**Blocked by:** 13: Establish the owned Ledger integrity foundation; 14: Register,
authenticate, and retain identity control.

**Status:** ready-for-agent

- [ ] The supported post-User-creation hook invokes one trusted tracking
      provisioning operation only after Better Auth registration has committed,
      preserving ADR 0007.
- [ ] One atomic write creates exactly the thirty Default-set Categories specified
      in the parent specification and one unique, unversioned delivery receipt;
      partial failure commits neither.
- [ ] Repeated and concurrent provisioning attempts become successful no-ops once
      one complete delivery commits.
- [ ] Every authenticated tracking entry retries a missing receipt once, then
      returns a blocking and retryable setup state whose Retry, Profile, and Delete
      User controls remain available.
- [ ] Existing Categories without a receipt produce an invariant failure for
      operational repair and are never merged with or overwritten by a new seed.
- [ ] Delivered Categories are ordinary owned Categories: later edits or deletion
      do not cause re-seeding, version upgrades, or special protection.
- [ ] Public-interface PostgreSQL tests cover success, rollback, repeated and
      concurrent delivery, retry gating, successful repair, edited Default data,
      and the ambiguous-data invariant without coupling to Better Auth internals.
