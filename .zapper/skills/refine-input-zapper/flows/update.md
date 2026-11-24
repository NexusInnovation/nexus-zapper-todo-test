# Update

Re-run: folds new input or feedback into the existing `.zapper/input/`. Triggers include new or
changed raw input, a question raised by a later stage, and a rejected output report.

## Before Starting

1. Read [../references/input-layout.md](../references/input-layout.md),
   [../references/example-story.md](../references/example-story.md) and the templates in
   [../assets/](../assets/).
2. Read the current `.zapper/input/`. If it is empty, switch to [refine.md](refine.md).

## Step 1: Gather the new input

Follow [../steps/gather-input.md](../steps/gather-input.md). For a rejected report or a stage
question, map each reason or question to the stories and sections it affects.

## Step 2: Update the files

Apply the new input to the current files, following [../steps/distill.md](../steps/distill.md).
Change only what the new input requires, and set `status: draft` in `README.md`.

## Step 3: Walk through and approve

Follow [../steps/walkthrough.md](../steps/walkthrough.md), including the final
[sanity check](../steps/sanity-check.md) before the approval.

## Checklist

- [ ] Changes made to the files since the last run were preserved.
- [ ] Every reason from a rejected report or stage question was mapped and addressed.
- [ ] `.zapper/input/` still matches the layout reference.
- [ ] The sanity check found no remaining contradiction, story overlap or irrelevant asset.
- [ ] `README.md` shows `status: approved`, or the user knows the walkthrough is unfinished.
- [ ] The `refine` row of `.zapper/run/metrics.md` includes this update (cost, duration, human
      interventions), as `report-run-zapper` defines in `references/metrics-layout.md`.
