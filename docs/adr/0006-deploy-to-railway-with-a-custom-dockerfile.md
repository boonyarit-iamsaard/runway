---
status: accepted
---

# Deploy to Railway with a custom Dockerfile

Deploy the Next.js application to the existing Railway Hobby plan from a custom Dockerfile, initially as one always-on Node.js application replica alongside Railway PostgreSQL. This favors explicit, reproducible packaging and conventional long-running process semantics over the lowest possible hosting cost.

## Consequences

- The application and PostgreSQL communicate over Railway private networking.
- More identical application replicas may be added without changing the single-deployable architecture; a separately deployed Hono API requires a superseding ADR.
- Use a process-level PostgreSQL pool rather than creating one pool per request.
- Review the deployment topology when Railway projects monthly usage above USD 10; measure actual application and database usage before optimizing or changing platforms.
- Railway PostgreSQL's unmanaged operational model is accepted for the personal MVP. Enable backups as soon as its data becomes non-disposable.

## Considered options

Native Next.js deployment on Vercel with Neon was considered for its free tiers and managed scale-to-zero model. It was rejected because the existing Railway subscription and preference for an always-on Node.js process with a co-located PostgreSQL service outweigh the likely small cost difference.
