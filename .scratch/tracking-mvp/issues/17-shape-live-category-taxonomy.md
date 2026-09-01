# 17: Shape the live Category taxonomy

**What to build:** Let a User adapt the ordinary Default set and create a concise
two-level Income and Expense taxonomy without making historical classifications
or another User's Categories unsafe.

**Blocked by:** 13: Establish the owned Ledger integrity foundation; 14: Register,
authenticate, and retain identity control; 15: Deliver and repair the Default set.

**Status:** ready-for-agent

- [ ] Category settings show the User's owned Income and Expense Categories and
      let the User create, rename, and reparent top-level and Child categories.
- [ ] Category names are case-insensitively unique only among live siblings, and
      the same concise name remains valid in another type, Parent, or User.
- [ ] A Child has a same-owner, same-type top-level Parent; a Parent with children
      cannot become a Child, and no operation can create a third nesting level.
- [ ] Reparenting locks and rechecks the relevant Parent inside the atomic write,
      while foreign, archived, and wrong-type related identifiers remain
      non-disclosing validation failures.
- [ ] A Parent category remains directly selectable for a Transaction even after
      it gains children; `Other` is never created as a Category.
- [ ] Responsive MUI create and edit surfaces open over the settings list and keep
      tracking-specific controls inside the tracking feature under ADRs 0002 and 0005.
- [ ] Public-interface PostgreSQL tests cover ownership, sibling uniqueness,
      hierarchy depth, type compatibility, reparenting, Default-category edits,
      and concurrent Parent changes.
