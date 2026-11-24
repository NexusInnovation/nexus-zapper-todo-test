# Refine

First run: builds `.zapper/input/` from raw input, then walks the team through it.

## Before Starting

1. Read [../references/input-layout.md](../references/input-layout.md),
   [../references/example-story.md](../references/example-story.md) and the templates in
   [../assets/](../assets/).
2. Check that `.zapper/input/` holds nothing but `.gitkeep`. If it has content, switch to
   [update.md](update.md): a first run would overwrite existing work.

## Step 1: Gather the input

Follow [../steps/gather-input.md](../steps/gather-input.md).

## Step 2: Ask the blocking questions

Before writing, ask the user the questions that change the overall shape of the input, one at a
time: the scope boundaries and the starting point when the input does not state them. Leave
story-level questions for the walkthrough.

## Step 3: Distill

Follow [../steps/distill.md](../steps/distill.md) to write every file of `.zapper/input/`.

## Step 4: Walk through and approve

Follow [../steps/walkthrough.md](../steps/walkthrough.md), including the final
[sanity check](../steps/sanity-check.md) before the approval.

## Checklist

- [ ] `.zapper/input/` matches the layout reference: no extra root file, one folder per story.
- [ ] Every story has a description, acceptance criteria and an Origin line; criteria have no IDs.
- [ ] Every image a story links is in that story's `assets/`, and every asset is linked and relevant.
- [ ] Nothing was invented: each gap is a hypothesis, an open question or was answered by the team.
- [ ] The sanity check found no remaining contradiction or story overlap.
- [ ] `README.md` shows `status: approved`, or the user knows the walkthrough is unfinished.
- [ ] The `refine` row of `.zapper/run/metrics.md` is filled in (cost, duration, human
      interventions), as `report-run-zapper` defines in `references/metrics-layout.md`.
