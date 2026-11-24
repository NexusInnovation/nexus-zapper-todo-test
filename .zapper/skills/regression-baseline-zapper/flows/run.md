# Run

Runs the whole regression suite (regression scenarios plus the existing tests) with its single
command, records the results per area and sets the `baseline` marker. Contract:
[../references/execution-contract.md](../references/execution-contract.md).

## Before Starting

1. Read [../references/execution-contract.md](../references/execution-contract.md).
2. Read `.zapper/regression-baseline/README.md` for `status`, `run-command`, `result-format` and
   `result-file`, and `inventory.md` for the areas and their existing test paths.
3. If `run-command` is empty, stop and tell the user the suite is not wired yet: follow
   [../steps/wire-and-verify.md](../steps/wire-and-verify.md). Do not invent results and do not
   create a runner here.
4. Fix the purpose of the run. It is a **baseline** run on the unmodified code (the default, before
   `/goal` starts) or an **evidence** run on the code after the implementation (when the caller,
   for example `report-run-zapper`, says so). Only a baseline run sets `baseline` and
   `baseline-commit`.
5. For a baseline run, record `HEAD` (`git rev-parse HEAD`). If the working tree has any uncommitted
   change other than the generated results (`.zapper/regression-baseline/results/`, the
   `results.md` files and the markers of `.zapper/regression-baseline/README.md`), say so: the
   inventory and the approved `.feature` files must be committed too, otherwise committing them
   later would look like a change to the locked scenarios. The results are shown, but
   `baseline-commit` is not recorded and `baseline` is not set to `passed`.
6. For a baseline run, invalidate the markers before running: set `baseline: not-run` and empty
   `baseline-commit` in `README.md`. A run that then fails to produce a readable result leaves the
   baseline `not-run`, never a previous `passed`. An evidence run keeps them untouched.

## Step 1: Run the suite

Remove or archive the previous `result-file` before running, so a report left by an earlier run can
never be read as the current one. Then run `run-command` once from the repository root. A non-zero
exit code is a normal outcome when something fails; only a missing or unreadable `result-file` is a
failure of the run itself: in that case do not update `results.md` or **Last run**, and leave the
`baseline` markers as invalidated in Before Starting (`not-run`, empty `baseline-commit`).
Never edit a `.feature` file or an existing test to make the suite pass.

## Step 2: Read the results

Parse `result-file` in `result-format` and map each scenario and test to its area as described in
the contract. Results that map to no area are unmapped; an area with no result is `not run`.

## Step 3: Record the results

- Keep the raw output in `results/`, overwriting the previous run.
- Write `areas/<area-slug>/results.md` for every area, using the format of the contract.
- Update the **Last run** column of `README.md` with each area's outcome (`passed`, `failed`,
  `not run`).
- Set `baseline` in `README.md` on a baseline run only: `passed` only if every area passed, no
  failed or skipped result is unmapped, every regression scenario maps to an area, and the tree is
  clean apart from the generated results (see Before Starting); then also set `baseline-commit` to
  the recorded `HEAD`. An unmapped existing test that passed does not block; the full suites may
  run tests the inventory does not list. Otherwise set `failed`, or leave `not-run` when the run
  itself failed, and keep `baseline-commit` empty. An evidence run never touches either field.
- Do not change `status`: running the suite is not a change to the baseline.

## Step 4: Report

Tell the user the totals (areas passed, failed, not run), list each failed area with its failed
scenarios or tests and their first failing step, and report unmapped results. Say whether `/goal`
may start: it may only when `status: approved` and `baseline: passed`.

## Checklist

- [ ] The previous `result-file` was removed first, and the command ran once and produced a new
      `result-file` in the declared format.
- [ ] Every area has an up-to-date `results.md`, and `README.md` shows each last run outcome.
- [ ] `baseline` and `baseline-commit` reflect this run when it was a baseline run; no `.feature`
      file, existing test or `status` was modified.
