# Zapper goal

Implement the approved plan in one pass (never ask the human to write or fix code) so every validation below passes.

## Inputs (approved, read-only)

Under `.zapper/`: `config.md`, `input/`, `behaviour-driven-development/` (BDD), `regression-baseline/` (needs `baseline: passed`), `run/plan/`. If one is missing or not `status: approved`, stop and tell the human to run `workspace-check-zapper`; the `goal-gate` hook blocks tools until then, never work around it.

Write only to `.zapper/run/{decisions,report,metrics}.md`, `.zapper/run/output-report/`, BDD/regression results, project code and tests; no other goal, plan or log file.

## Stopping condition

Done only when all hold, each verified by a fresh run after your last code change with the config `commands` (`none` = waived, report it):

1. **BDD and regression**, same final pass: **Run** of `generate-bdd-zapper` (incl. non-functional and performance checks on the loaded `performance-dataset`; never lower a threshold or shrink it) and of `regression-baseline-zapper`. `@manual` = non-automatable, listed with reason, never a way to skip. Failed, undefined, pending, skipped or ambiguous = failure.
2. `build` succeeds; `unit-test` and `e2e` pass.
3. `lint`: 0 errors.
4. `security`: 0 unresolved high/critical.
5. Plan followed; never override a plan decision.
6. Output report generated (Finish).

No BDD `run-command`: the plan's `bdd-runner` block delivers it. A command that cannot run: assume the most reasonable way, log a decision; never waive silently.

## Rules

- **Branch**: never commit, push or merge to `default-branch` or a protected branch; one feature branch (create it if on default), push only it; PRs are the human's.
- **Commits**: reviewable, per `report-run-zapper` `references/commit-layout.md` (one commit per kind and plan block, in **Building blocks** order, each building and logged in `report.md`). Never rewrite history. Push after each block. Evidence: separate `chore:` commit before the report.
- **Environments and paths**: never touch `protected-environments` or modify `protected-paths` (open question); other environments only via IaC/pipelines within the plan's `infra` decisions, else open question.
- **Goalposts**: never edit `.feature` files, plan or input; never weaken a test, disable a lint rule, suppress a finding or skip a scenario. If they seem wrong, follow them, leave that part undone, open question in `report.md`.
- **Existing tests**: change only when the input changes their behaviour, never to pass; log `existing-test` (test, area `RG-<nn>`, requirement ID).
- **Scope**: only the input within the plan's `scope`; anything else is forbidden: open question.
- **Decisions**: ask nothing. Where plan and input are silent (dependency, schema, contract, data access, security, infra, `critical-areas`), assume the most reasonable option: `TODO(A<nn>)` in code and an entry in `.zapper/run/decisions.md` (ID, category, context, options, choice, justification, `deviation from plan: yes`, status `assumed`, follow-up outside the code). Security, data access, infra: most conservative only, else open question. Nothing reasonable to assume: open question, continue independent work, stop when none is left.
- **Evidence**: keep `report.md` current (each validation with command, result, time; non-functional results; open questions).
- **Metrics**: fill the `goal` row of `metrics.md` per `report-run-zapper` `references/metrics-layout.md`; complete it before the report.

## Finish

When 1 to 5 hold: write the final status in `report.md`, complete the `goal` row, commit evidence, run **Generate** of `report-run-zapper` (no free-form summary; summary and one file per story must exist) and stop. Never set `sign-off: signed-off` or run **Sign off**/**Package**. Spend cap first: write the state in `report.md`, generate the report if possible, stop.
