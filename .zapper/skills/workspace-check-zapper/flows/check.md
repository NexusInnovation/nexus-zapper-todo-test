# Check

Verifies that a run can start with `/goal`, and tells the user what to do for each missing item.
Read-only: do not create, edit or delete anything, and do not run any project command.

## Before Starting

Read `.zapper/README.md` for the canonical paths, and
[../assets/config.md](../assets/config.md) for the format of the project configuration.

## Step 1: Check the prerequisites

Report each row as **ready** or **missing** with the path that was looked for. A `status` is read
from the YAML frontmatter of the file.

| #   | Prerequisite          | Ready when                                                                                                                                                                                                                                                                              | If missing                                                     |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | Project configuration | `.zapper/config.md` has `status: approved`, no `<placeholder>`, every field of the template (`performance-dataset` filled in, or `none` only when the non-functional requirements have no performance requirement), and each `commands` category is a non-empty list or `none`          | Copy the template, fill it in, ask the team to approve it      |
| 2   | Refined input         | `.zapper/input/README.md` has `status: approved`                                                                                                                                                                                                                                        | `refine-input-zapper`                                          |
| 3   | BDD suite             | `.zapper/behaviour-driven-development/README.md` has `status: approved` and at least one `.feature` file in its `features-path`; every category of `.zapper/input/non-functional-requirements.md` with a requirement has its `nfr-<category>` folder                                    | `generate-bdd-zapper`                                          |
| 4   | Regression baseline   | `.zapper/regression-baseline/README.md` has `status: approved` and `baseline: passed`                                                                                                                                                                                                   | `regression-baseline-zapper`                                   |
| 5   | Implementation plan   | `.zapper/run/plan/README.md` has `status: approved`, no decision of `decisions.md` is `proposed`, and its blocks table has a `bdd-runner` block unless the BDD README already has a `run-command`                                                                                       | `plan-implementation-zapper`                                   |
| 6   | Branch                | The current branch is not the `default-branch` of the configuration                                                                                                                                                                                                                     | Create or switch to a feature branch                           |
| 7   | Working tree          | No uncommitted change outside `.zapper/run/` (a warning, not a blocker)                                                                                                                                                                                                                 | Commit or stash                                                |
| 8   | Runner (Azure only)   | `runner` of `.zapper/config.md` is `none`, or has no `<placeholder>`, names the Key Vault secrets of `COPILOT_GITHUB_TOKEN` and `GIT_TOKEN`, and the base branch is pushed (`git rev-list --count origin/<branch>..HEAD` is `0`). A blocker only for a run in Azure Container Instances | Fill the runner block, run `Initialize-ZapperRunner.ps1`, push |

Use only `git` for rows 6 to 8, besides reading `.zapper/config.md`. Do not inspect other host-project files.

## Step 2: Report

Show the table, then one verdict line:

- **Ready**: every blocker row is ready. Give the launch commands of `.zapper/README.md`: on a
  workstation `/goal Achieve the objective of .zapper/goal.md --max-ai-credits <N>`, in Azure
  `./.zapper/runner/Start-ZapperRun.ps1 -Mode Preflight -Follow` then
  `./.zapper/runner/Start-ZapperRun.ps1 -Follow` (row 8 must be ready). The `goal-gate` hook
  applies the same rows 1 to 5 and refuses the goal otherwise; the runner checks them again
  before it launches `/goal`.
- **Not ready**: list the missing rows in order, each with its next action. Do not start the run.

## Checklist

- [ ] Nothing was created, edited or deleted.
- [ ] Every row has a result, with the path that was looked for.
