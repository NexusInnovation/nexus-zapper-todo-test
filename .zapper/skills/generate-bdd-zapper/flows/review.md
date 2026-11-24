# Review

Walks the team through the existing suite and records its approval, without new input. Use it to
resume an unfinished walkthrough or to review changes made to the files since the last run.

## Before Starting

1. Read [../references/bdd-layout.md](../references/bdd-layout.md).
2. Read the current `.zapper/behaviour-driven-development/`. If it is empty, switch to
   [generate.md](generate.md).

## Step 1: Check coverage

Follow [../steps/coverage-check.md](../steps/coverage-check.md) so the team reviews a consistent
suite.

## Step 2: Walk through and approve

Follow [../steps/walkthrough.md](../steps/walkthrough.md).

## Checklist

- [ ] Every story was confirmed or corrected.
- [ ] Coverage check found no gap or orphan scenario.
- [ ] `README.md` shows `status: approved`, or the user knows the walkthrough is unfinished.
- [ ] The `bdd` row of `.zapper/run/metrics.md` includes this review session (cost, duration,
      human interventions), as `report-run-zapper` defines in `references/metrics-layout.md`.
