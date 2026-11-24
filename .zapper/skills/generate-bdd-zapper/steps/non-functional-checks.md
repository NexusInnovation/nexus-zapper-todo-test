# Non-functional checks

Turns `.zapper/input/non-functional-requirements.md` into requirements and executable checks, so
that quality (performance, security, accessibility…) is part of "done" like the stories. Read the
file live on every run. Writing and tagging rules are those of [write-features.md](write-features.md);
the layout is in [../references/bdd-layout.md](../references/bdd-layout.md#non-functional-requirements).

## Requirements

- One pseudo-story per category that holds at least one requirement. Its **key** and slug are
  `nfr-<category>` (`nfr-security`, `nfr-performance`, `nfr-accessibility`, `nfr-localization`,
  `nfr-observability`, `nfr-other`), and its file is
  `stories/nfr-<category>/nfr-<category>.feature`. A category that says `No requirement.` gets no
  folder. IDs are `nfr-<category>-R<nn>` (for example `nfr-performance-R01`), assigned and kept
  stable as in [derive-requirements.md](derive-requirements.md).
- One requirement per bullet, in document order. A bullet that only states how another bullet is
  measured or covered is part of that requirement, not a new one. Keep the bullet's wording and
  the story IDs it cites; never add a rule, value or screen it does not state.
- Every requirement maps to at least one check, automated or manual (below). None is dropped
  because it is hard to test.
- A bullet that cannot be turned into a check (no observable outcome, no measurable target, a
  decision not taken) is flagged and raised in the [walkthrough](walkthrough.md), like a
  non-testable acceptance criterion. If the team cannot settle it, send it back to
  `refine-input-zapper`.

## Automated checks

Every requirement is checked automatically unless it falls under **Manual checks**. A check
verifies the requirement at the level the requirement states, and is written like any scenario:
business language, no selectors, no tool names.

- **Security**: the abuse case, not the happy path: for example data of another tenant or role is
  never served, a forbidden resource is refused, no secret or public link is exposed.
- **Accessibility, localization**: the observable outcome for each language, format or assistive
  need the requirement names.
- **Observability**: the event that must be logged is produced by the action that triggers it.
- Reuse the sentences of the stories for shared states and actions.

### Performance

- **Dataset.** Every performance scenario starts with the shared step
  `Given the realistic-volume dataset is loaded`. The dataset is the `performance-dataset` of
  `.zapper/config.md` (an anonymized copy or a volume seeder, with its volumes and the command that
  loads it); never describe or invent data in a scenario. When the configuration has no such field,
  or it still holds a placeholder, flag it: it blocks approval.
- **One check per screen or query** the requirement names or the stories flag as large
  (list, search, paste of many values, counters, export…). Use a `Scenario Outline` with one
  `Examples` row per screen or query when the behaviour is the same.
- **Two kinds of check**, one scenario each:
  - the screen or query completes within its **threshold** on the dataset;
  - paging, filtering, sorting or grouping happen on the server, never by loading the whole set to
    cut it in the browser. For a paginated list, only the requested page and the total count are
    returned. For any other operation (a counter or other aggregate, an export, a pasted-list
    verification), verify that the server does the processing and that the expected result is
    unchanged: an aggregate returns its aggregate, an export still returns the whole requested
    result.
- **Threshold.** Every timing check states a number and a unit in its steps. Take the value from
  the requirement; when it says only « reasonable » or « fast », propose a value, mark it as
  proposed and flag it: the team confirms or corrects each threshold in the
  [walkthrough](walkthrough.md). Approving the suite approves its thresholds.
- Do not add a performance check for a screen or query no requirement or story flags.

## Manual checks

Only when no automated check is possible: a judgment that cannot be encoded, or a property the test
environment cannot observe (for example the geographic region of a cloud resource).

- Tag the scenario `@manual` next to its requirement tag. Its description (the free text under the
  scenario name) gives the reason no automated check is possible and what a human verifies and
  where. Its steps are written for a human to carry out.
- A `@manual` scenario is excluded from the run command (see the
  [execution contract](../references/execution-contract.md)) and listed as `manual` in the results
  and in the report, never as passed and never silently skipped.
- The [walkthrough](walkthrough.md) raises every manual check, with its reason, so the team can
  confirm it or ask for an automated one.
