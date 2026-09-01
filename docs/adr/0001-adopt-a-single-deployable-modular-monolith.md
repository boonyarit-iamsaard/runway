---
status: accepted
---

# Adopt a single-deployable modular monolith

Runway will begin as a modular monolith with Next.js as its composition root and one application deployable. Next.js adapters call feature operations in-process; the application will not introduce internal HTTP calls or Hono until a real non-Next client or independently scalable HTTP workload exists.

## Consequences

- The application has one release unit and one application scaling boundary.
- Scale identical Next.js replicas before separating an HTTP API.
- Feature interfaces remain independent of Next.js, Hono, HTTP requests and responses, cookies, and authentication-framework types so extraction remains practical.
- Introducing a separately deployed Hono API is a new architectural decision that supersedes this ADR and must resolve routing, authentication ownership, deployment compatibility, and database connections.

## Considered options

An embedded or separately deployed Hono API was considered and deferred. There is no current HTTP consumer that justifies its additional framework, contract, and operational seams.
