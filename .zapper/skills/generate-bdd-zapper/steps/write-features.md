# Write features

Writes the `.feature` file of one story from its working list of requirements (see
[derive-requirements.md](derive-requirements.md)). Syntax follows the
[Cucumber Gherkin reference](https://cucumber.io/docs/gherkin/reference); read it when unsure
about a construct instead of relying on memory.

## Structure

- One `Feature` per file, named after the story title (for a non-functional category, the category
  name), in the file `stories/<story-slug>/<story-slug>.feature` (under the `features-path` of the
  README once the suite is wired).
- `Scenario` for one concrete behaviour; `Scenario Outline` with `Examples` only when the same
  behaviour is checked with different values stated in the story. `Background` only for a context
  every scenario shares.
- `Given` sets the state, `When` is the single action, `Then` is the observable outcome. `And` /
  `But` continue the previous keyword. No `Then` before a `When`.
- Language: the `language` of `.zapper/config.md`. When it is not English, add the
  `# language: <code>` header and use that language's keywords from the reference's list of spoken
  languages.

## Content

- Business language, declarative: say what the user does and sees, not how the screen is built.
  No selectors, no URLs, no technology, no step that names a framework.
- Use the labels, names and values of the story and its mockups. Never invent a rule, a label, a
  value or test data the story does not state; when a scenario needs data the story lacks, raise
  it in the [walkthrough](walkthrough.md). Non-functional requirements follow the same rules, plus
  those of [non-functional-checks.md](non-functional-checks.md) (dataset, thresholds, `@manual`).
- One behaviour per scenario, and the scenario name states it. Scenario names are unique within
  the feature.
- Cover the nominal case of each requirement, plus the edge or error cases the criterion itself
  mentions. Do not add scenarios for behaviour no criterion states.
- Reuse the same sentence for the same state or action across scenarios so the glue can share step
  definitions.

## Tagging and traceability

- Put `@<requirement-id>` on the line above each `Scenario` or `Scenario Outline`, one tag per
  requirement verified. Tags are the only link to the requirements; do not tag the `Feature`.
- Every requirement is verified by at least one scenario, and every scenario verifies at least one
  requirement.
- Once written, a requirement ID appears nowhere but in these tags; record the scenario names in the
  working list only for the walkthrough.

A filled-in story: [../references/example-feature.md](../references/example-feature.md).
Template: [../assets/story.feature](../assets/story.feature).
