# Update

Re-run: folds changes into the existing plan. Triggers include a changed refined input, new or
retired BDD requirements, a hypothesis or question answered by the team, a question raised during
implementation, and a rejected output report.

## Before Starting

1. Read [../references/plan-layout.md](../references/plan-layout.md) and the relevant templates.
2. Read the current outline and the affected block/contract files. If the plan is empty, switch
   to [generate.md](generate.md). Do not regenerate unaffected blocks.
3. Note the current `status` in `README.md`, then set `status: draft` before editing any file: an
   approved plan is read-only to agents.

## Step 1: Find what changed

- Compare active `.feature` requirement tags with block coverage: new and removed IDs. Inspect
  changed scenarios and source criteria for reworded behavior; there is no requirements file.
- Compare `.zapper/input/` with the plan: changed scope, architecture constraints, stories and their
  hypotheses.
- Map each answer, question or report reason to the blocks, decisions and hypotheses it affects.

## Step 2: Audit the affected areas

Follow [../steps/audit-context.md](../steps/audit-context.md), limited to the affected blocks and
what the changes touch.

## Step 3: Update the outline and run the gate

Apply the changes to `README.md` and `decisions.md` following
[../steps/outline.md](../steps/outline.md):

- Keep every decision and hypothesis ID; never reuse or renumber one.
- A hypothesis the team confirmed or refuted is removed from the active hypotheses file; adapt
  the plan directly to the answer without narrating the old hypothesis. If the code already
  carries its marker, tell the user that every `TODO(<ID>)` of that hypothesis must now be resolved
  in the code.
- Keep the team's manual edits.

Then run the gate. Limit it to the changes only if the plan was `approved` when the update started
and the user does not ask for the whole outline; otherwise run it on the whole outline.

## Step 4: Update the blocks

Follow [../steps/write-blocks.md](../steps/write-blocks.md) for the affected blocks only. Remove the
folder of a block the outline dropped.

## Step 5: Validate, sanity-check and approve

Follow [../steps/coverage-check.md](../steps/coverage-check.md).

## Checklist

- [ ] Decision and hypothesis IDs were preserved; none was reused or renumbered.
- [ ] Every change, answer and report reason was mapped and addressed.
- [ ] Manual edits made to the files since the last run were preserved.
- [ ] One writer per affected block; no unrelated blocks regenerated or decisions reopened.
- [ ] Mechanical checks passed and one independent cross-block sanity check was integrated.
- [ ] Unresolved conflicts were submitted to the team and prevent approval.
- [ ] `README.md` shows `status: approved`, or the user knows the gate is unfinished.
- [ ] The `plan` row of `.zapper/run/metrics.md` includes this update (cost, duration, human
      interventions), as `report-run-zapper` defines in `references/metrics-layout.md`.
