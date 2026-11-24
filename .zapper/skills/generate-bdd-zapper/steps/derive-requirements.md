# Derive requirements

Builds the working list of requirements of one story: one entry per acceptance criterion, with its
ID. The list is temporary: it exists only to write the `.feature` file and to run the coverage check
and the walkthrough. Layout and ID rules: [../references/bdd-layout.md](../references/bdd-layout.md).

## Rules

- One requirement per acceptance criterion, in the story's order. Never merge two criteria or split
  one into several requirements: when a criterion holds several behaviours, keep one requirement
  and cover it with several scenarios.
- Keep the criterion's own wording. Condense only to remove context; never add a rule, a value or
  a label the story does not state.
- Assign IDs as defined in the layout reference. On an update, first read the `@<requirement-id>`
  tags of the story's `.feature` file and the scenarios that carry them: a criterion that already
  has scenarios keeps their ID; match by meaning, not by position. Only a criterion that matches no
  existing tag is new.
- A criterion that is not observable or testable (vague, contains a hypothesis, depends on a
  decision not taken) is flagged and raised in the [walkthrough](walkthrough.md). Do not guess a
  scenario for it, and so give it no ID yet. A criterion left without scenario stays visible in the
  [coverage check](coverage-check.md), which blocks approval. If the team cannot settle it, send
  it back to `refine-input-zapper`.
- Stories without acceptance criteria get no folder; list them in the final report.
- The non-functional requirements are a second source of requirements, derived by
  [non-functional-checks.md](non-functional-checks.md) with the same rules (stable IDs, one
  requirement per statement, flagged when not testable).

## Working list

For each story, keep a list with one line per criterion: its ID (or "flagged" when it has none),
the criterion, and later the scenarios that verify it. Keep it in the conversation, or in a scratch
file outside `.zapper/behaviour-driven-development/` (for example under `.zapper/run/`) that is
deleted when the operation ends. Never write it inside the suite folder: the criteria stay in
`.zapper/input/`, the IDs stay in the tags.
