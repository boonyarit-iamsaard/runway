# 14: Register, authenticate, and retain identity control

**What to build:** Let a person register openly, sign in, reach a protected
tracking shell, manage their Profile, and delete their identity without exposing
or retaining another User's Ledger data.

**Blocked by:** 13: Establish the owned Ledger integrity foundation.

**Status:** ready-for-agent

- [ ] Better Auth provides open registration, sessions, cookies, sign-in, Profile,
      and Delete User behavior with its own database transaction support enabled.
- [ ] Every protected server-rendered entry point and Server Action authenticates
      at one Next.js composition seam, translates the session User identifier to
      `TrackingIdentity`, and never passes framework or Better Auth types into
      tracking behavior.
- [ ] Tracking owns authoritative authorization: collection access is qualified
      by the User, identifiers combine owner and identifier in one predicate, and
      absent and foreign identifiers are observationally identical.
- [ ] Deleting a User cascades through all of that User's Ledger and receipt data
      without affecting another User; Profile and Delete User controls do not
      depend on tracking readiness.
- [ ] Next.js remains the single composition root and calls tracking in-process;
      no internal HTTP API, Hono boundary, global auth package, or client-supplied
      ownership is introduced, preserving ADRs 0001 and 0004.
- [ ] Tracking exposes one deliberate server-only feature root; framework-neutral
      behavior does not import Next.js, React, MUI, or Better Auth, and a build or
      lint guard prevents Client Modules from importing the server-only root, as
      required by ADR 0002.
- [ ] The application shell establishes the shared MUI theme and uses CSS Modules
      only for structural layout, without Tailwind or a second token system, as
      required by ADR 0005.
- [ ] Real-PostgreSQL contract tests prove two-User isolation and deletion cleanup;
      thin adapter tests prove session rejection, identity translation, and
      non-disclosing error mapping.
