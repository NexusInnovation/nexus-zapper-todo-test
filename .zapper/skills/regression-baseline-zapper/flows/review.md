# Review

Walks the team through the existing baseline and records its approval, without new input. Use it to
resume an unfinished walkthrough or to review changes made to the files since the last run.

## Before Starting

1. Read [../references/baseline-layout.md](../references/baseline-layout.md).
2. Read the current `.zapper/regression-baseline/`. If it is empty, switch to
   [generate.md](generate.md).

## Step 1: Check coverage

Follow [../steps/coverage-check.md](../steps/coverage-check.md) so the team reviews a consistent
baseline.

## Step 2: Walk through and approve

Follow [../steps/walkthrough.md](../steps/walkthrough.md). When the baseline becomes `approved` and
`baseline` is not `passed`, tell the user the next step is the wiring and the baseline run
([../steps/wire-and-verify.md](../steps/wire-and-verify.md)) and offer to do it.

## Checklist

- [ ] Every area was confirmed or corrected.
- [ ] Coverage check found no gap or orphan scenario.
- [ ] `README.md` shows `status: approved`, or the user knows the walkthrough is unfinished.
- [ ] The `regression` row of `.zapper/run/metrics.md` includes this review session (cost,
      duration, human interventions), as `report-run-zapper` defines in
      `references/metrics-layout.md`.
