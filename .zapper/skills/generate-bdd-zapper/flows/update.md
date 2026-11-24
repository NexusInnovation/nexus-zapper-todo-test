# Update

Re-run: folds changed stories or feedback into the existing suite. Triggers include a changed
story or acceptance criterion, a question raised by a later stage, a failing scenario that turns
out to be a wrong scenario, and a rejected report.

## Before Starting

1. Read [../references/bdd-layout.md](../references/bdd-layout.md),
   [../references/execution-contract.md](../references/execution-contract.md) and the templates in
   [../assets/](../assets/).
2. Read the current `.zapper/behaviour-driven-development/`, the stories of
   `.zapper/input/stories/` and `.zapper/input/non-functional-requirements.md`. The `.feature`
   files are in the `features-path` of the README (see
   [../references/bdd-layout.md](../references/bdd-layout.md)). If the suite is empty, switch to
   [generate.md](generate.md).
3. Note the current `status` in `README.md` (`approved` or `draft`), then set `status: draft`
   before editing any `.feature` file: an approved suite is read-only to agents.

## Step 1: Find what changed

Rebuild the working list of each story from its acceptance criteria and the tags of its `.feature`
file (see [../steps/derive-requirements.md](../steps/derive-requirements.md)), then compare: criteria
added, reworded or removed, plus stories added or removed. Do the same for each non-functional
category (see [../steps/non-functional-checks.md](../steps/non-functional-checks.md)): statements
added, reworded or removed, a threshold or the dataset that changed. For feedback or a rejected
report, map each reason to the stories and requirements it affects.

## Step 2: Update the features

Change only what the difference requires, following
[../steps/derive-requirements.md](../steps/derive-requirements.md) and
[../steps/write-features.md](../steps/write-features.md):

- Keep every existing requirement ID. A reworded criterion keeps its ID and its scenarios are
  re-read; a new criterion takes the number after the highest one of its story.
- When a criterion was removed, remove its tag from the scenarios that carry it. Delete a scenario
  only if it then verifies no current requirement; a scenario shared with another requirement stays.
- Keep the team's manual edits to the files; do not regenerate a scenario that is still correct.
- A removed story's folder is deleted along with its row in `README.md`. The same holds for a
  non-functional category that no longer has a requirement.
- An approved threshold is changed only when the requirement or the team's feedback changes it;
  a changed threshold is raised again in the walkthrough.

## Step 3: Check coverage

Follow [../steps/coverage-check.md](../steps/coverage-check.md).

## Step 4: Walk through and approve

Follow [../steps/walkthrough.md](../steps/walkthrough.md). Limit it to the changed stories only if
the suite was `approved` when the update started and the user does not ask for the whole suite. If
it was already `draft`, an earlier walkthrough may have skipped a story, so walk through the whole
suite: there is no per-story approval marker.

## Step 5: Run

If `run-command` is set, follow [run.md](run.md) to refresh the results, and tell the user to run
the **Update** operation of `wire-bdd-zapper` so the wiring follows the changed suite.

## Checklist

- [ ] Requirement IDs (stories and non-functional) were preserved; none was renumbered or given to
      another criterion.
- [ ] Every reason from the feedback or report was mapped and addressed.
- [ ] Coverage check found no gap or orphan scenario.
- [ ] `README.md` shows `status: approved`, or the user knows the walkthrough is unfinished.
- [ ] The `bdd` row of `.zapper/run/metrics.md` includes this update (cost, duration, human
      interventions), as `report-run-zapper` defines in `references/metrics-layout.md`.
