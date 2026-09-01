---
status: accepted
---

# Organize code as vertical feature modules

Organize business behavior under `apps/web/src/features` as vertical feature modules rather than global technical-layer packages. A feature may contain React and MUI presentation, hooks, Next.js adapters, framework-neutral operations, and feature-owned persistence, but it must expose a deliberate small interface and keep those concerns behind internal seams.

## Consequences

- Next.js owns presentation flow and application composition, while framework-neutral feature operations own business workflows and transaction boundaries.
- Next.js adapters may parse input, resolve identity, invoke operations, and map results, but feature-operation interfaces do not expose Next.js, Hono, HTTP, cookie, or Better Auth types.
- Each feature exposes its deliberate public interface through its root `index.ts`. Callers outside the feature, including the Next.js route tree, must use that interface rather than reaching into feature internals.
- A feature's public interface is its primary contract-test surface. Focused tests may exercise meaningful internal seams without making those seams public.
- `packages/db` owns shared database infrastructure; existing shared UI and toolchain packages remain valid.
- Do not create global `domain`, `application`, `auth`, or `api` packages before they enforce a real dependency rule, have multiple consumers, or establish a distinct ownership seam.
- If a second adapter becomes real, move only the affected framework-neutral code into a shared package or into the new deployable; presentation stays in `apps/web`.

## Considered options

Global packages organized as `domain`, `application`, `auth`, and `api` were rejected for the initial system because they would distribute one feature across several shallow modules before their interfaces or ownership were known.
