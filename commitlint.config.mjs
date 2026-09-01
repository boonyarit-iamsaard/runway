/**
 * Machine-checkable half of the `commit-message` skill.
 *
 * The skill authors the message and owns the judgement calls it encodes —
 * imperative mood, matching this repository's verbs and granularity, choosing
 * the type. Those cannot be linted. Everything below is the subset a machine
 * can verify, kept deliberately in step with the skill's Format section.
 *
 * Bodies and footers are allowed. The skill writes single-line messages, but
 * `git revert`, `git commit -s`, and squash-merge trailers all produce bodies,
 * and the commits that carry one are usually the ones that deserve it.
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Skill: Commit Types table, top-to-bottom. `revert` is added because
    // `git revert` generates its own subject.
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "docs",
        "chore",
        "revert",
      ],
    ],
    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],

    // Skill: scope is optional; reuse an existing scope name verbatim.
    "scope-case": [2, "always", "lower-case"],

    // Skill: "everything must be lowercase — no uppercase letters anywhere,
    // including acronyms, brand names, and proper nouns".
    "subject-case": [2, "always", "lower-case"],
    "subject-empty": [2, "never"],
    // Skill: "no period at the end".
    "subject-full-stop": [2, "never", "."],

    // Skill: "full message including type and scope must not exceed 72
    // characters".
    "header-max-length": [2, "always", 72],

    "body-leading-blank": [2, "always"],
    "body-max-line-length": [2, "always", 100],
    "footer-leading-blank": [2, "always"],
  },
};
