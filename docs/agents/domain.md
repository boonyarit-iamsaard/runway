# Domain docs

This repository uses a single domain context.

## Before exploring

Read these sources when they exist:

- `CONTEXT.md` at the repository root.
- Relevant ADRs under `docs/adr/`.

Proceed silently when either source does not exist. Domain-modeling skills create them when domain terms or decisions are resolved.

## Layout

```text
/
├── CONTEXT.md
├── docs/adr/
├── apps/
└── packages/
```

## Use the glossary vocabulary

Use terms as defined in `CONTEXT.md` when naming domain concepts in issues, proposals, hypotheses, and tests.

When a needed concept is absent, reconsider whether the project uses another term. Record genuine vocabulary gaps for domain modeling.

## Flag ADR conflicts

Explicitly identify output that contradicts an existing ADR. Name the ADR and explain why the decision may need to be reconsidered.
