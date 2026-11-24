# Execution contract

How the regression suite is run and how its results are read. It is stack-agnostic: the project's
test project fills it in through the BDD wiring skill.

## What the suite is

The regression suite is the **regression scenarios** of `areas/` plus the **existing project
tests** listed in `inventory.md`. Both must pass before `/goal` starts (the baseline) and when it
finishes (condition 1 of `.zapper/goal.md`).

For the existing tests, run whole suites (a test project, an end-to-end suite, a unit test
project), not hand-picked files: a break an area's tests do not name is often caught by a sibling.
Propose the suites to include when you write the contract, and ask the user to confirm them in the
[walkthrough](../steps/walkthrough.md) when a suite is slow or needs infrastructure.

## Rules

- **One command runs the whole regression suite**, from the repository root, with no argument
  required. It is recorded in the `run-command` field of `.zapper/regression-baseline/README.md`.
  When the project needs several tools, the command wraps them (a script or a task runner entry).
- **Results are machine-readable**: [Cucumber JSON](https://github.com/cucumber/cucumber-json-schema)
  (`cucumber-json`) or JUnit XML (`junit-xml`), recorded in `result-format`, written to
  `result-file`. A runner that emits several files is merged or wrapped by the command.
- **Exit code**: non-zero when at least one scenario or test fails, is undefined, pending or
  skipped.
- **The glue is project-specific.** The BDD wiring skill delivers only the empty shell; this stage
  writes the step definitions of the regression scenarios in
  [wire-and-verify.md](../steps/wire-and-verify.md), because the baseline must pass before `/goal`.
- An empty `run-command` means the suite is not runnable yet. It is not an error before the wiring,
  but the baseline cannot be `passed` and the goal does not start.

## Reading the results

- **Regression scenarios**: a scenario maps to its area through its `@<area-id>` tag. It is
  `passed` only if every step and every reported hook has the status `passed`; any other status
  makes it `failed`.
- **Existing tests**: a test maps to an area when its file (JUnit `classname` or `file`, Cucumber
  `uri`) is one of the paths listed in **Existing tests** of that area, or lies under a listed
  folder. A result that maps to no area is **unmapped**: it is always reported. The whole suites
  also run tests the inventory does not list, so an unmapped existing test that passed does not
  block the baseline, while an unmapped one that failed or was skipped does. A regression scenario
  without an area tag is never acceptable: it blocks the baseline.
- A test that was skipped, disabled or not executed counts as `failed`, exactly like a scenario.

An area is `failed` if one of its scenarios or existing tests failed; `passed` only when every one
of them has a result and all passed; `not run` otherwise. An area with no existing test and no
scenario is a gap and blocks approval (see [../steps/coverage-check.md](../steps/coverage-check.md)).

## results.md (per area)

Written by the Run operation, overwritten on each run, for every area (also those covered only by
existing tests).

```markdown
# Results: <area name> (<area-id>)

Run: <ISO date and time> · Command: `<run-command>`

| Source              | Item                          | Status |
| ------------------- | ----------------------------- | ------ |
| regression scenario | <scenario name>               | passed |
| existing test       | <test path or name>           | failed |
```

List the first failing step or assertion of each failure below the table.
