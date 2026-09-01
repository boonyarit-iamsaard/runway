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
- Leave the application container's process time zone at UTC, uniformly across development, CI, and Railway, and do not set a PostgreSQL session time zone. Runway's Calendar dates are resolved with an explicit `Asia/Bangkok` time zone and never read the host zone, so the process zone is deliberately not Bangkok. The Dockerfile carries a comment pointing here so the setting is not "fixed" later.

## Considered options

Native Next.js deployment on Vercel with Neon was considered for its free tiers and managed scale-to-zero model. It was rejected because the existing Railway subscription and preference for an always-on Node.js process with a co-located PostgreSQL service outweigh the likely small cost difference.

Setting `TZ=Asia/Bangkok` on the Railway service was considered and rejected. It looks like a safety net and is the opposite: host-local date formatting agrees with Bangkok only when the host is Bangkok, so the setting would make production the one environment where a host-zone dependency produces the right answer, hiding in production a bug that a uniformly UTC development and CI environment surfaces. A PostgreSQL session time zone was rejected for the same reason, compounded by being unreliable across a process-level pool unless attached to its connect handler; the documented route, if a server-side Bangkok day is ever genuinely needed, is `options=-c timezone=Asia/Bangkok` on the connection string.
