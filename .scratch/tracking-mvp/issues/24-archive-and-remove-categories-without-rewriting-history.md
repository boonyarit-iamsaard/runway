# 24: Archive and remove Categories without rewriting history

**What to build:** Let a User retire, restore, or remove Categories under rules
that keep every live Child reachable and every historical classification intact.

**Blocked by:** 17: Shape the live Category taxonomy; 19: Record an Expense end to
end; 22: Correct and delete Transactions safely.

**Status:** ready-for-agent

- [ ] Archiving a Parent category archives its live Child categories in the same
      locked atomic write and requires confirmation that explains the cascade.
- [ ] Restoring a Parent does not restore its children; restoring a Child is refused
      until its Parent is live, so every live Child always has a live Parent.
- [ ] Archived Categories disappear from new-Transaction choices but retain their
      identity on historical rows and remain available when currently selected in
      an edit.
- [ ] Settings hides archived rows by default and reveals them in place with one
      toggle so restoration preserves taxonomy context.
- [ ] A Category can be hard-deleted only when no Transaction and no Child category
      references it; irreversible deletion requires confirmation and explains a
      refusal at the initiating control.
- [ ] Default-set Categories use exactly these ordinary lifecycle rules and receive
      no immutable, system-owned, re-seeding, or upgrade behavior.
- [ ] Parent and Child operations remain owner- and type-qualified, lock and recheck
      the relevant Parent, and return non-disclosing typed failures for foreign or
      invalid related identifiers.
- [ ] Public-interface PostgreSQL tests cover cascade atomicity, independent Child
      archival, restoration rules, deletion restrictions, concurrent hierarchy
      changes, historical edits, and two-User isolation.
