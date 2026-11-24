---
name: generate-bdd-zapper
description: "Turns Zapper's refined input (.zapper/input/) into a Gherkin BDD suite in .zapper/behaviour-driven-development/: one .feature per story and per non-functional category, one requirement ID per acceptance criterion and per non-functional requirement (performance on a realistic-volume dataset with thresholds, security, accessibility), scenarios tagged with their requirement, and recorded run results. The team approves the suite before any code. Stack-agnostic: one run command, machine-readable results.
  USE FOR: zapper generate BDD, write Gherkin or .feature files from stories or non-functional requirements, update, review, approve or run the BDD suite.
  DO NOT USE FOR: refining stories (use `refine-input-zapper`), refining a work item in Azure DevOps (use `refine-nexus`), step definitions or application code, frontend Playwright or Vitest tests (use `frontend-slim`)."
---

# Generate BDD (Zapper)

Produces and maintains `.zapper/behaviour-driven-development/`, the executable definition of
"done" that every later Zapper stage reads. It is built from the stories and from the
non-functional requirements, so that quality is checked like behaviour. The folder format is
defined in
[references/bdd-layout.md](references/bdd-layout.md), the run and result contract in
[references/execution-contract.md](references/execution-contract.md), and a filled-in story in
[references/example-feature.md](references/example-feature.md). Templates live in [assets/](assets/).

The source of truth is the refined input, `.zapper/input/`: read it live on every run, never copy
its content into this skill.

## Available Operations

| Operation | Description                                                                                              | Flow                                   |
| --------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Generate  | First run: build the requirements and `.feature` files from the stories, then walk the team through them | [flows/generate.md](flows/generate.md) |
| Update    | Re-run: fold changed stories or feedback into the suite, keep requirement IDs and prior edits            | [flows/update.md](flows/update.md)     |
| Review    | Walk the team through the existing suite and record its approval                                         | [flows/review.md](flows/review.md)     |
| Run       | Run the whole suite with its single command and record the results per story                             | [flows/run.md](flows/run.md)           |

## Shared Steps

| Step                | Description                                               | File                                                         |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| Derive requirements | One requirement with a unique ID per acceptance criterion | [steps/derive-requirements.md](steps/derive-requirements.md) |
| Non-functional checks | One requirement and executable check per non-functional requirement: dataset, thresholds, manual list | [steps/non-functional-checks.md](steps/non-functional-checks.md) |
| Write features      | Gherkin writing rules and tagging of scenarios            | [steps/write-features.md](steps/write-features.md)           |
| Coverage check      | Requirement ↔ scenario traceability and Gherkin validity  | [steps/coverage-check.md](steps/coverage-check.md)           |
| Walkthrough         | Guided human review, corrections and the approval marker  | [steps/walkthrough.md](steps/walkthrough.md)                 |

## Routing

If the intent is not clear from the request, look at `.zapper/behaviour-driven-development/`:

- No `stories/` folder yet (nothing but `.gitkeep`) → **Generate**.
- Has content and the stories or the team's feedback changed → **Update**.
- Has content and the user only wants to review or approve it → **Review**.
- The user wants to execute the suite or refresh its results → **Run**.

When still ambiguous, ask: "Do you want to **generate** the suite, **update** it, **review** it, or
**run** it?"
