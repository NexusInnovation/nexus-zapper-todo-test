# Generate

First run: builds `.zapper/run/plan/` from the approved input and BDD suite, with a single human
gate on the outline.

## Before Starting

1. Read [../references/plan-layout.md](../references/plan-layout.md) and the templates in
   [../assets/](../assets/). Consult the example only when needed.
2. Read `.zapper/input/README.md`, `.zapper/behaviour-driven-development/README.md` and
   `.zapper/regression-baseline/README.md`. If a `status` is not `approved` or the baseline is not
   `passed`, tell the user the plan should be built from approved input, an approved suite and a
   passing baseline, and ask whether to continue or to run `refine-input-zapper`,
   `generate-bdd-zapper` or `regression-baseline-zapper` first.
3. Check that `.zapper/run/plan/` does not exist or is empty. If it has content, switch to
   [update.md](update.md): a first run would overwrite existing work.

## Step 1: Audit the context

Follow [../steps/audit-context.md](../steps/audit-context.md).

## Step 2: Outline and gate

Follow [../steps/outline.md](../steps/outline.md). Do not go further until the outline is approved
and no decision is `proposed`.

## Step 3: Write the blocks

Follow [../steps/write-blocks.md](../steps/write-blocks.md).

## Step 4: Validate, sanity-check and approve

Follow [../steps/coverage-check.md](../steps/coverage-check.md).

## Checklist

- [ ] `.zapper/run/plan/` matches the layout reference: `README.md`, `decisions.md` and one folder
      per block.
- [ ] Every active requirement ID is covered by at least one block.
- [ ] The `bdd-runner` block comes first, and every block with requirements owns the step
      definitions of its tagged scenarios.
- [ ] One writing subagent handled each block, with bounded parallelism and scoped context.
- [ ] Blocks bind contracts and invariants, leave internals free and target 80-150 lines.
- [ ] Every major decision is approved or rejected, with its approver and date.
- [ ] Only still-assumed answers remain in compact hypothesis files, with TODO and placement.
- [ ] Mechanical checks passed and one independent cross-block sanity check was integrated.
- [ ] No mandatory behavior is waived by a hypothesis; unresolved conflicts prevent approval.
- [ ] `README.md` shows `status: approved`, or the user knows the gate is unfinished.
- [ ] The `plan` row of `.zapper/run/metrics.md` is filled in (cost, duration, human
      interventions), as `report-run-zapper` defines in `references/metrics-layout.md`.
