# Write scenarios

Writes the regression `.feature` file of one area from the behaviours that its existing tests do
not assert (see [inventory-tests.md](inventory-tests.md)). Syntax follows the
[Cucumber Gherkin reference](https://cucumber.io/docs/gherkin/reference); read it when unsure about
a construct instead of relying on memory.

## What a regression scenario is

A characterization of what the application does **today**. It is not a requirement: the refined
input is not its source, the existing code and the running behaviour are.

- Derive each behaviour from the code and, when the application can run, from its observed
  behaviour (a browser tool, an HTTP call, an existing test's output). When code and observation
  disagree, or the code does not settle the outcome, do not guess: raise it in the
  [walkthrough](walkthrough.md).
- Describe only behaviour that stays unchanged. A behaviour the scope changes (**Changed by the
  scope**) is never described here: a scenario that the refined input contradicts would fail the
  run for the right reason.
- Never invent a rule, a label or a value. Use the labels and values the application shows.
- Describe what a user would notice breaking, not every code path. Skip behaviour an existing test
  already asserts.

## Structure

- One `Feature` per file, named after the area, in `areas/<area-slug>/<area-slug>.feature`. An
  area with coverage `covered` has no file.
- `Scenario` for one behaviour; `Scenario Outline` with `Examples` only when the same behaviour is
  observed with different values; `Background` only for a context every scenario shares.
- `Given` sets the state, `When` is the single action, `Then` is the observable outcome.
- Language: the language of the project's BDD suite (`.zapper/behaviour-driven-development/`). When
  it is not English, add the `# language: <code>` header and use that language's keywords.
- Business language, declarative: what the user does and sees, no selectors, URLs or technology.
- One behaviour per scenario, and its name states it. Names are unique within the feature.
- Reuse the sentences of the BDD suite for the same state or action, so the glue shares step
  definitions.

## Tagging and traceability

- Put `@regression` and `@<area-id>` on the line above each `Scenario` or `Scenario Outline`.
  Do not tag the `Feature`, and never use a requirement tag (`@<story-key>-R<nn>`): the scenario
  verifies no requirement of the input.
- Every `partial` or `uncovered` area has at least one scenario; every scenario belongs to exactly
  one area.

A filled-in area: [../references/example-area.md](../references/example-area.md). Template:
[../assets/area.feature](../assets/area.feature).
