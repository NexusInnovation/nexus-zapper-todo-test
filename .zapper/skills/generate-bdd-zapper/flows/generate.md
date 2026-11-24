# Generate

First run: builds `.zapper/behaviour-driven-development/` from the refined stories, then walks the
team through it.

## Before Starting

1. Read [../references/bdd-layout.md](../references/bdd-layout.md),
   [../references/execution-contract.md](../references/execution-contract.md),
   [../references/example-feature.md](../references/example-feature.md) and the templates in
   [../assets/](../assets/).
2. Read `.zapper/input/README.md`. If `status` is not `approved`, tell the user the suite should
   be built from approved input and ask whether to continue or to run `refine-input-zapper`
   first.
3. Check that `.zapper/behaviour-driven-development/` holds nothing but `.gitkeep`. If it has
   content, switch to [update.md](update.md): a first run would overwrite existing work.
4. Read every story of `.zapper/input/stories/` and `non-functional-requirements.md`: both are
   sources of requirements. Also read `scope.md` and `architecture.md` for vocabulary only. Read
   `.zapper/config.md` for `language` and, when the non-functional requirements include
   performance, `performance-dataset`.

## Step 1: Derive the requirements

For each story, follow [../steps/derive-requirements.md](../steps/derive-requirements.md) to build
the temporary working list of requirements. Then do the same for the non-functional requirements
with [../steps/non-functional-checks.md](../steps/non-functional-checks.md).

## Step 2: Write the features

For each story and each non-functional category, follow
[../steps/write-features.md](../steps/write-features.md) (and
[../steps/non-functional-checks.md](../steps/non-functional-checks.md) for the latter).

## Step 3: Write the README

Write `README.md` from [../assets/README.md](../assets/README.md) with `status: draft`, an empty
run contract, and one row per story and per non-functional category. Then check the repository for an existing test runner that
already produces Cucumber JSON or JUnit XML. If one exists, propose its single command, format
and result file to the user and record them on confirmation; otherwise leave the fields empty.
Never create the glue or scaffold a framework here.

## Step 4: Check coverage

Follow [../steps/coverage-check.md](../steps/coverage-check.md).

## Step 5: Walk through and approve

Follow [../steps/walkthrough.md](../steps/walkthrough.md).

## Step 6: Run

If `run-command` is set, follow [run.md](run.md) to record the baseline results. Otherwise tell the
user the suite becomes runnable once implementation generates the glue.

## Checklist

- [ ] One folder per story with acceptance criteria, containing its `.feature` file and no
      requirements file.
- [ ] One requirement per acceptance criterion and per non-functional requirement, each with a
      unique ID that appears in the scenario tags.
- [ ] Every requirement has at least one scenario; every scenario carries its requirement ID tag.
- [ ] Every performance check has a threshold and the realistic-volume dataset step; every
      `@manual` check states why it cannot be automated.
- [ ] Scenarios follow the Cucumber Gherkin reference and invent no rule, label or value.
- [ ] No working file is left behind, and `README.md` holds the run contract (or states it is
      empty) and shows `status: approved`, or the user knows the walkthrough is unfinished.
- [ ] The `bdd` row of `.zapper/run/metrics.md` is filled in (cost, duration, human
      interventions), as `report-run-zapper` defines in `references/metrics-layout.md`.
