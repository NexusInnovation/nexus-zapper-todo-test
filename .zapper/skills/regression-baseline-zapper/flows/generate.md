# Generate

First run: builds `.zapper/regression-baseline/` from the refined input and the codebase, walks the
team through it, then wires it and proves the baseline passes.

## Before Starting

1. Read [../references/baseline-layout.md](../references/baseline-layout.md),
   [../references/execution-contract.md](../references/execution-contract.md),
   [../references/example-area.md](../references/example-area.md) and the templates in
   [../assets/](../assets/).
2. Read `.zapper/input/README.md` and `.zapper/behaviour-driven-development/README.md`. If either
   `status` is not `approved`, tell the user the baseline should be built from approved input and an
   approved suite, and ask whether to continue or to run `refine-input-zapper` or
   `generate-bdd-zapper` first.
3. Check that `.zapper/regression-baseline/` holds nothing but `.gitkeep`. If it has content, switch
   to [update.md](update.md): a first run would overwrite existing work.
4. Check the current branch. The baseline is verified on the code the run starts from: if the
   working tree has uncommitted changes outside `.zapper/`, tell the user and ask whether to
   continue.

## Step 1: Map the touched areas

Follow [../steps/map-touched-areas.md](../steps/map-touched-areas.md).

## Step 2: Inventory the existing tests

Follow [../steps/inventory-tests.md](../steps/inventory-tests.md).

## Step 3: Write the scenarios

For each area that is `partial` or `uncovered`, follow
[../steps/write-scenarios.md](../steps/write-scenarios.md).

## Step 4: Write the inventory and the README

Write `inventory.md` and `README.md` from [../assets/](../assets/) with `status: draft`,
`baseline: not-run` and an empty run contract, and one row per area. Assign IDs `RG-01`, `RG-02`
… in the order of the areas. Never create the glue or scaffold a framework here.

## Step 5: Check coverage

Follow [../steps/coverage-check.md](../steps/coverage-check.md).

## Step 6: Walk through and approve

Follow [../steps/walkthrough.md](../steps/walkthrough.md).

## Step 7: Wire and verify

Once `status: approved`, follow [../steps/wire-and-verify.md](../steps/wire-and-verify.md).

## Checklist

- [ ] One section per touched area in `inventory.md`, with a stable `RG-<nn>` ID, its existing
      tests and its coverage verdict.
- [ ] Every `partial` or `uncovered` area has scenarios tagged `@regression` and its area ID; none
      describes behaviour the scope changes, and none carries a requirement tag.
- [ ] Nothing invented: each gap is a flagged item the team answered.
- [ ] `README.md` shows `status: approved` and a complete run contract, or the user knows what is
      unfinished.
- [ ] `baseline: passed` with its `baseline-commit`, or the user knows `/goal` must not start.
- [ ] No existing test, application code or `.feature` outside the baseline was modified.
- [ ] The `regression` row of `.zapper/run/metrics.md` is filled in (cost, duration, human
      interventions), as `report-run-zapper` defines in `references/metrics-layout.md`.
