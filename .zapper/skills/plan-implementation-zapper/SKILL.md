---
name: plan-implementation-zapper
description: "Turns Zapper's approved refined input and BDD suite into a concise implementation plan in .zapper/run/plan/: cohesive blocks with shared contracts and invariants, implementation freedom, approved major decisions and AI assumptions tracked as TODO(ID). Bounded audit, one subagent per block, deterministic checks and a cross-block sanity check before approval.
  USE FOR: zapper plan, plan the implementation of a generation, architectural plan from refined input and BDD, cut into building blocks, record major decisions, track hypotheses as TODO(ID), update, review or approve the plan, zapper stage 5.
  DO NOT USE FOR: a single work item outside a Zapper run (use `story-implementation-lastwomanstanding`), refining stories (use `refine-input-zapper`), BDD requirements or Gherkin (use `generate-bdd-zapper`), task-level steps or implementing the code."
---

# Plan implementation (Zapper)

Produces and maintains `.zapper/run/plan/`, the map every implementation agent reads before writing
code. The folder format is defined in [references/plan-layout.md](references/plan-layout.md), a
filled-in block in [references/example-block.md](references/example-block.md), and templates live in
[assets/](assets/).

The sources of truth are the refined input, `.zapper/input/`, the BDD suite,
`.zapper/behaviour-driven-development/`, the regression baseline,
`.zapper/regression-baseline/`, and the project itself (its instructions, skills, docs and
code): read them live on every run, never copy their content into this skill.

## Available Operations

| Operation | Description                                                                                   | Flow                                   |
| --------- | --------------------------------------------------------------------------------------------- | -------------------------------------- |
| Generate  | First run: bounded audit, outline gate, delegated blocks, checks and approval                 | [flows/generate.md](flows/generate.md) |
| Update    | Re-run: fold changed input, requirements, answers or a rejected report in, keep IDs and edits | [flows/update.md](flows/update.md)     |
| Review    | Run the gate on the existing plan and record its approval                                     | [flows/review.md](flows/review.md)     |

## Shared Steps

| Step           | Description                                                                          | File                                               |
| -------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Audit context  | Read the input, the BDD suite, the project's standards and the code to reuse         | [steps/audit-context.md](steps/audit-context.md)   |
| Outline        | Building blocks, decisions and hypotheses, and the single human gate                 | [steps/outline.md](steps/outline.md)               |
| Write blocks   | Touchpoint-level block files, splitting and hypothesis markers                       | [steps/write-blocks.md](steps/write-blocks.md)     |
| Sanity check   | Independent review of contracts, duplication, requirements and risky assumptions   | [steps/sanity-check.md](steps/sanity-check.md)     |
| Coverage check | Deterministic validation, remaining semantic checks and final approval              | [steps/coverage-check.md](steps/coverage-check.md) |

## Routing

If the intent is not clear from the request, look at `.zapper/run/plan/`:

- Missing or empty → **Generate**.
- Has content and the input, the BDD suite or the team's answers changed → **Update**.
- Has content and the user only wants to review or approve it → **Review**.

When still ambiguous, ask: "Do you want to **generate** the plan, **update** it, or **review** it?"
