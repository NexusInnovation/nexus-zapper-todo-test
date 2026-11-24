---
name: regression-baseline-zapper
description: "Builds the regression baseline in .zapper/regression-baseline/ so a Zapper run never breaks existing behaviour: an inventory of the existing behaviour the refined input touches and the tests covering it, Gherkin scenarios (@regression, linked to an area) for uncovered areas, one regression command, and a passing baseline before /goal. Human-approved in a walkthrough.
  USE FOR: zapper regression baseline, protect existing behaviour before a run, inventory touched behaviour and its tests, generate regression scenarios, update, review or approve the baseline, run the regression suite per area, zapper stage 4.
  DO NOT USE FOR: refining stories (use `refine-input-zapper`), new-behaviour BDD (use `generate-bdd-zapper`), planning (use `plan-implementation-zapper`), feature Playwright or Vitest tests (use `frontend-slim`), hand-wiring a runner (use `wire-bdd-zapper`)."
---

# Regression baseline (Zapper)

Produces and maintains `.zapper/regression-baseline/`, the executable description of the existing
behaviour the run must not break. It sits between the BDD suite and the plan: the BDD suite defines
the new behaviour, the baseline protects the behaviour that exists today. The folder format and the
run contract are defined in [references/baseline-layout.md](references/baseline-layout.md) and
[references/execution-contract.md](references/execution-contract.md), a filled-in area in
[references/example-area.md](references/example-area.md). Templates live in [assets/](assets/).

The sources of truth are the refined input, `.zapper/input/`, the BDD suite (to tell new behaviour
from existing behaviour), and the target codebase with its existing tests: read them live on every
run, never copy their content into this skill.

## Available Operations

| Operation | Description                                                                                                  | Flow                                   |
| --------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| Generate  | First run: inventory the touched areas and their tests, write the missing scenarios, approve, wire, baseline | [flows/generate.md](flows/generate.md) |
| Update    | Re-run: fold a changed input, scope or feedback into the baseline, keep area IDs and prior edits             | [flows/update.md](flows/update.md)     |
| Review    | Walk the team through the existing baseline and record its approval                                          | [flows/review.md](flows/review.md)     |
| Run       | Run the regression suite with its single command and record the results per area                             | [flows/run.md](flows/run.md)           |

## Shared Steps

| Step              | Description                                                              | File                                                     |
| ----------------- | ------------------------------------------------------------------------ | -------------------------------------------------------- |
| Map touched areas | Which existing behaviour the scope touches, as stable areas              | [steps/map-touched-areas.md](steps/map-touched-areas.md) |
| Inventory tests   | Which existing tests cover each area, and the coverage verdict           | [steps/inventory-tests.md](steps/inventory-tests.md)     |
| Write scenarios   | Regression Gherkin for the uncovered behaviour, tagging and traceability | [steps/write-scenarios.md](steps/write-scenarios.md)     |
| Coverage check    | Area ↔ test ↔ scenario traceability, conflicts with the input, validity  | [steps/coverage-check.md](steps/coverage-check.md)       |
| Walkthrough       | Guided human review, corrections and the approval marker                 | [steps/walkthrough.md](steps/walkthrough.md)             |
| Wire and verify   | Wire the shell (`wire-bdd-zapper`), write the glue, prove the baseline   | [steps/wire-and-verify.md](steps/wire-and-verify.md)     |

## Routing

If the intent is not clear from the request, look at `.zapper/regression-baseline/`:

- Nothing but `.gitkeep` → **Generate**.
- Has content and the input, the scope or the team's feedback changed → **Update**.
- Has content and the user only wants to review or approve it → **Review**.
- The user wants to execute the regression suite or refresh its results → **Run**.

When still ambiguous, ask: "Do you want to **generate** the baseline, **update** it, **review** it,
or **run** it?"
