# Wire and verify

Makes the approved baseline executable in the project's test project and proves it passes on the
unmodified code. Run it only when `status: approved`: the wiring reads the approved `.feature` files.

## Step 1: Wire the scenarios (skill → `wire-bdd-zapper`)

Resolve the following before launching:

- The skill `wire-bdd-zapper` must be available in the session. If it is not, stop: tell the user
  the baseline cannot be wired yet, leave `baseline: not-run`, and say that this operation resumes
  once the skill is available. Never write the glue by hand.
- The inventory of the existing tests with how each location is run (from
  [inventory-tests.md](inventory-tests.md)), and the existing `run-command` of
  `.zapper/behaviour-driven-development/README.md` if it has one.

**Subagent prompt:**

> Execute `wire-bdd-zapper` for the regression suite (its "Other suites" rules: the suite's own
> README and contract, `.feature` files read in place, existing suites included in the command).
> Inputs:
>
> - Feature files: every `.feature` under `.zapper/regression-baseline/areas/`, read-only, tagged
>   `@regression` and `@<area-id>`. Do not edit them.
> - Existing tests to include: <the suites to run, with their commands, from the inventory>.
> - Contract: `.zapper/skills/regression-baseline-zapper/references/execution-contract.md`.
>
> Task: wire the regression scenarios to the project's test project, reusing the existing runner and
> steps, and provide one command that runs the regression scenarios plus the listed existing
> suites and writes machine-readable results to a single file. Record `run-command`,
> `result-format` and `result-file` in the frontmatter of `.zapper/regression-baseline/README.md`
> without changing any other field. Do not change application code or an existing test.
> Report back: SUCCESS or FAILURE, the three recorded fields and a brief summary.

On failure show the output and stop. `wire-bdd-zapper` delivers an empty shell: with it alone every
regression scenario is `undefined` and the baseline cannot pass, so the step definitions are
written in the next step.

## Step 2: Write the step definitions (glue)

The baseline must pass before `/goal` starts, so the glue of the regression scenarios is written
here, by this stage and not by `wire-bdd-zapper`. Skip the step when no area has a generated
scenario.

**Subagent prompt:**

> Write the step definitions, fixtures and hook bodies that the regression scenarios need, in the
> project's test project wired in Step 1, following its conventions and reusing the existing steps
> and fixtures. Inputs:
>
> - Feature files: every `.feature` under `.zapper/regression-baseline/areas/`, read-only.
> - The wiring (runner, glue folder, `run-command`) recorded in
>   `.zapper/regression-baseline/README.md`.
>
> Task: make every regression scenario run against the unmodified application and pass, using only
> the behaviour that exists today. Do not edit a `.feature` file, an existing test or application
> code, and do not write glue for any other suite. Run the regression command until no scenario is
> `undefined`. Report back: SUCCESS or FAILURE, the glue files created or changed and a brief
> summary.

On failure show the output and stop. A scenario that cannot pass on the unmodified code is wrong:
handle it as described in Step 4, never by weakening a step.

## Step 3: Commit the wiring

The baseline is recorded against a commit. Ask the user to commit the wiring and the glue on the
current feature branch (or offer to commit them, never on the default or a protected branch) before
the run: the working tree must have no uncommitted change other than the generated results. The
inventory and the approved `.feature` files under `.zapper/regression-baseline/` are part of the
commit, so that `baseline-commit` already contains them.

## Step 4: Run the baseline

Follow [../flows/run.md](../flows/run.md). The baseline must pass before `/goal` starts:

- A **regression scenario** that fails on the unmodified code is wrong: it does not describe the
  behaviour correctly. Do not touch the code. Send it back to [update.md](../flows/update.md),
  which corrects the scenario and goes through the walkthrough again.
- An **existing test** that fails on the unmodified code is a defect or a flaky test that existed
  before the run. Do not edit it and do not exclude it silently. Report it per area and ask the
  team: fix it before the run, or remove it from the regression command with the reason noted in
  `inventory.md` (which sets the status back to `draft`).
- Leave `baseline: failed` until a fresh run passes. Tell the user that `/goal` must not start.
