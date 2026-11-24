# Review

Walks the team through the existing `.zapper/input/` and records its approval, without new input.
Use it to resume an unfinished walkthrough or to review changes made to the files since the last
run.

## Before Starting

1. Read [../references/input-layout.md](../references/input-layout.md).
2. Read the current `.zapper/input/`. If it is empty, switch to [refine.md](refine.md).

## Step 1: Walk through and approve

Follow [../steps/walkthrough.md](../steps/walkthrough.md), including the final
[sanity check](../steps/sanity-check.md) before the approval.

## Checklist

- [ ] Every item was confirmed or corrected.
- [ ] The sanity check found no remaining contradiction, story overlap or irrelevant asset.
- [ ] `README.md` shows `status: approved`, or the user knows the walkthrough is unfinished.
- [ ] The `refine` row of `.zapper/run/metrics.md` includes this review session (cost, duration,
      human interventions), as `report-run-zapper` defines in `references/metrics-layout.md`.
