# Update

Re-run: folds a changed input, a changed scope or feedback into the existing baseline. Triggers
include a changed story or scope, a new BDD scenario that overlaps an area, a regression scenario
that fails on the unmodified code (so it is wrong), an existing test that must leave the regression
command, and a rejected report.

## Before Starting

1. Read [../references/baseline-layout.md](../references/baseline-layout.md),
   [../references/execution-contract.md](../references/execution-contract.md) and the templates in
   [../assets/](../assets/).
2. Read the current `.zapper/regression-baseline/`, the refined input and the BDD suite. If the
   baseline is empty, switch to [generate.md](generate.md).
3. Note the current `status` in `README.md`, then set `status: draft` and `baseline: not-run`
   before editing `inventory.md` or any `.feature` file: an approved baseline is read-only to
   agents.

## Step 1: Find what changed

Rebuild the touched areas with [../steps/map-touched-areas.md](../steps/map-touched-areas.md) and
compare them with `inventory.md`: areas added, merged, split or removed, and stories whose
**Touched by** or **Changed by the scope** changed. For feedback or a failing baseline, map each
reason to the areas it affects.

## Step 2: Update the inventory and the scenarios

Change only what the difference requires, following
[../steps/inventory-tests.md](../steps/inventory-tests.md) and
[../steps/write-scenarios.md](../steps/write-scenarios.md):

- Keep every existing area ID. A reworded or moved area keeps its ID; a new area takes the number
  after the highest ever used; a removed area's number is retired.
- Keep the team's manual edits to the files; do not regenerate a scenario that is still correct.
- A removed area's folder is deleted along with its inventory section and its row in `README.md`.
- A behaviour that the scope now changes leaves the baseline: delete its scenario and note it under
  **Changed by the scope**.

## Step 3: Check coverage

Follow [../steps/coverage-check.md](../steps/coverage-check.md).

## Step 4: Walk through and approve

Follow [../steps/walkthrough.md](../steps/walkthrough.md). Limit it to the changed areas only if
the baseline was `approved` when the update started and the user does not ask for the whole
baseline. If it was already `draft`, walk through the whole baseline: there is no per-area
approval marker.

## Step 5: Wire and verify

Follow [../steps/wire-and-verify.md](../steps/wire-and-verify.md) to wire the new scenarios and
refresh the baseline.

## Checklist

- [ ] Area IDs were preserved; none was renumbered or given to another area.
- [ ] Every reason from the feedback or report was mapped and addressed.
- [ ] Coverage check found no gap or orphan scenario.
- [ ] `README.md` shows `status: approved`, or the user knows the walkthrough is unfinished.
- [ ] `baseline` was refreshed by a run, never edited by hand.
- [ ] The `regression` row of `.zapper/run/metrics.md` includes this update (cost, duration, human
      interventions), as `report-run-zapper` defines in `references/metrics-layout.md`.
