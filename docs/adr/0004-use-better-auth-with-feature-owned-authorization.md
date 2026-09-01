---
status: accepted
---

# Use Better Auth with feature-owned authorization

Use Better Auth through the Next.js adapter for authentication, sessions, cookies, and future OAuth integration. Translate Better Auth sessions into application-owned identity data before invoking feature operations; feature behavior owns authoritative authorization decisions.

## Consequences

- Do not expose Better Auth session types through feature-operation interfaces.
- Keep the Better Auth adapter inside the web application initially instead of creating a workspace package for one consumer.
- Next.js may gate pages and hide unavailable actions for usability, but every protected operation performs server-side authorization.
- If an HTTP API is later extracted, exactly one deployable must own the Better Auth HTTP endpoints and the new architecture must reconsider cookie, origin, and client-authentication behavior.

## Considered options

Implementing authentication and session machinery locally was rejected to reduce security-sensitive custom code. Treating authentication as authorization was rejected because establishing identity does not decide which business operations that identity may perform.
