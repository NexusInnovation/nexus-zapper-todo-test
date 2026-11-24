# Review

Runs the gate on the existing plan and records its approval, without new input. Use it to resume an
unfinished gate or to approve manual edits made to the files since the last run.

## Before Starting

1. Read [../references/plan-layout.md](../references/plan-layout.md).
2. Read the current `.zapper/run/plan/`. If it has no `README.md`, switch to
   [generate.md](generate.md). An interrupted gate may have only the outline (`README.md` and
   `decisions.md`): that is expected, the block files do not exist yet.
3. Set `status: draft` in `README.md` if it is not already.

## Step 1: Run the gate

Follow the **Gate** section of [../steps/outline.md](../steps/outline.md#4-gate). It needs only the
outline, so it can resume a gate interrupted before the blocks were written.

## Step 2: Reconcile the blocks

Once the outline is confirmed and no decision is `proposed`, bring the block files in line with it:

- Missing blocks (gate interrupted before the blocks existed): write them with
  [../steps/write-blocks.md](../steps/write-blocks.md).
- Blocks affected by a correction at the gate, a decision answer or a manual edit: update them with
  the same step, one writer per affected block.

## Step 3: Validate and approve

Follow sections 1 to 4 of [../steps/coverage-check.md](../steps/coverage-check.md) on the final
plan, after every correction of the gate and of Step 2. Never approve on a check that ran before
the last change.

## Checklist

- [ ] The outline was confirmed or corrected, and no decision is `proposed`.
- [ ] Every block exists and reflects the confirmed outline and the answers given at the gate.
- [ ] Mechanical checks passed on the final plan; the independent sanity check's material findings
      are resolved.
- [ ] No pending arbitration is hidden behind a hypothesis or TODO.
- [ ] `README.md` shows `status: approved`, or the user knows the gate is unfinished.
- [ ] The `plan` row of `.zapper/run/metrics.md` includes this review session (cost, duration,
      human interventions), as `report-run-zapper` defines in `references/metrics-layout.md`.
