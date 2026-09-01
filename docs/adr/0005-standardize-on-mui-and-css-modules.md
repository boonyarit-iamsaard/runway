---
status: accepted
---

# Standardize on MUI and CSS Modules

Use MUI as the application component system and primary source of design tokens, with CSS Modules for structural and page-specific layout. Do not introduce Tailwind CSS or a second design-token system without a new architectural decision.

## Consequences

- `packages/ui` owns the MUI theme, design tokens, and genuinely shared UI behavior and modules.
- A wrapper does not become shared merely by living in `packages/ui`; it must hide repeated behavior, semantics, or token usage behind a useful interface.
- CSS Modules consume compatible theme variables where they need shared values rather than defining competing tokens.
- Keep React Client Component boundaries as narrow as interaction requires; using MUI does not make an entire page a Client Component.

## Considered options

Tailwind was rejected to avoid two styling vocabularies and competing token sources. Using only MUI styling APIs was also rejected because CSS Modules can express large structural layouts more directly.
