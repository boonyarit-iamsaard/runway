# Issue tracker: Local Markdown

Issues and specifications for this repository live as Markdown files in `.scratch/`.

## Conventions

- Use one directory per feature: `.scratch/<feature-slug>/`.
- Store the specification at `.scratch/<feature-slug>/spec.md`.
- Store implementation issues as separate files under `.scratch/<feature-slug>/issues/`.
- Name issue files `<NN>-<slug>.md`, starting with `01`.
- Record triage state in a `Status:` line near the top of each issue.
- Append discussion under a `## Comments` heading.

## Publish an issue

When a skill says to publish to the issue tracker, create the appropriate file under `.scratch/<feature-slug>/`.

## Fetch an issue

Read the referenced file. The user will normally provide its path or issue number.

## Wayfinding operations

The map has one child file per ticket.

- Map: `.scratch/<effort>/map.md`.
- Child ticket: `.scratch/<effort>/issues/<NN>-<slug>.md`.
- Type: record `research`, `prototype`, `grilling`, or `task` in a `Type:` line.
- Status: record `claimed` or `resolved` in a `Status:` line.
- Blocking: record dependencies in a `Blocked by: <NN>, <NN>` line.
- Frontier: select the first open, unblocked, and unclaimed ticket by number.
- Claim: set `Status: claimed` and save before starting work.
- Resolve: append the result under `## Answer`, set `Status: resolved`, and add a context pointer to the map's decisions.
