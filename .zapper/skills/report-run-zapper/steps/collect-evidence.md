# Collect evidence

Reads every source of the report and runs the hard validations fresh. Reads and runs only: it never
edits code, a `.feature` file, a configuration or the plan. Sources and attribution rules:
[../references/sources.md](../references/sources.md).

## 1. Fix the point in time

Record `HEAD` (`git rev-parse HEAD`) and the branch. If the working tree has uncommitted changes to
code or tests (other than the files the report operations write), say so in **Known risks**: the evidence is collected on the tree as it is, and the
report can be packaged only after the changes are committed and the evidence is collected again.

## 2. Run the hard validations fresh

Follow the table of hard validations in [../references/sources.md](../references/sources.md):

1. **BDD and regression**: run the Run operation of `generate-bdd-zapper` (subagent step, skill
   delegation). Prompt: execute `generate-bdd-zapper` / `flows/run.md`; task: run the whole suite
   once and record its results; report back SUCCESS or FAILURE, the totals and the failed
   requirements. If the suite has no `run-command`, the BDD condition fails: report it, do not
   create a runner. Then run the Run operation of `regression-baseline-zapper` the same way, as an
   **evidence** run (it must not touch `baseline` or `baseline-commit`); report back SUCCESS or
   FAILURE, the totals and the failed areas with their failing scenarios or tests. If the baseline
   is missing, not `approved` or has no `run-command`, the regression condition fails: report it.
   Both suites must pass for condition 1.
2. **Build and tests, linters and static analyzers, security**: run each command of the `commands`
   in `.zapper/config.md` once, from the repository root. Record the command, the exit code, the
   time and the findings (tool, rule, severity, file, line, status) from its output. A category set
   to `none` is not run: record it as `waived by configuration`.
   Keep long output out of the report: summarize it by tool and severity and point to the file the
   output was written to, if any.
3. **Decisions**: read the plan's and the run's decision logs. The condition passes only when every
   decision of the plan's log has an `approved` status with a name and a date and none is
   `proposed`, and every decision of the run's log (`.zapper/run/decisions.md`) is flagged as a
   deviation from the plan with its `TODO(A<nn>)` marker in the code. A run decision is not human
   approved yet: it is reviewed at sign-off. Work outside the scope decision of the plan (a screen,
   route or module the refined input does not name) fails the condition.
4. **Plan**: compare the plan's blocks with the diff (see Deviations in the sources reference). The
   condition passes only when every block was delivered and every difference is a recorded
   decision.

A command that cannot run (tool missing, no command found) makes its condition `not available`,
which fails it. Do not substitute another command. Run every category even when an earlier one
failed, so a failure never hides another criterion; security in particular is never skipped. A
category whose result is still missing after this step is `not run`.

## 3. Read the rest of the evidence

- Per story: the criteria, the requirement IDs, `results.md`, and the scenarios that failed or
  were skipped with their first failing step.
- Per non-functional requirement (the `nfr-<category>` folders of the suite and their
  `results.md`): the requirement, its scenarios, its result, the first failing step of a failed
  one, and for a performance check the threshold and the measured value when the result file or the
  evidence log carries them (otherwise `not available`). Read the `@manual` scenarios from the
  `.feature` files, with the reason in their description: a requirement whose scenarios are all
  `@manual` is `manual`; one that also has automated scenarios keeps its automated result, and its
  manual scenarios are listed apart. Check
  that the performance checks ran on the `performance-dataset` of `.zapper/config.md` (the run
  evidence or the evidence log says how it was loaded); if that cannot be established, the result
  is `not available`, not `passed`.
- Per regression area: the inventory, `areas/*/results.md`, the failed or skipped scenarios and
  tests with their first failing step, and the existing tests changed since `baseline-commit`
  (see Deviations in the sources reference).
- Hook results: from the hook logs declared by `hooks.json`; if no hook is declared or no log
  exists, record `no hook log available`.
- Decisions, hypotheses (the `TODO(<ID>)` markers, `-H` and `A<nn>`, the plan's `hypotheses.md` and
  the run's `decisions.md`, flagging a marker with no hypothesis or decision and the reverse),
  open questions of the evidence log, new dependencies of the diff.
- Run cost, duration and human interventions: read `.zapper/run/metrics.md` row by row, with the
  source of each figure; a missing file, row or figure is `not available`. The `report` row is this
  operation's own: it is closed in Step 4 of [../flows/generate.md](../flows/generate.md).
- Commit history: `git log --reverse <default-branch>..HEAD` with the trailers and `--name-only`;
  map each commit to its plan block and story, check the order against the plan's **Building
  blocks** table, and read the build result of each commit in `.zapper/run/report.md`.
- Out-of-scope changes: the files of the diff that no block's touchpoints name, and the behaviours
  that `.zapper/input/scope.md` excludes.
- Follow-ups outside the code: the sources listed for them in the sources reference.
- The changes made in the `critical-areas` and `protected-paths` of `.zapper/config.md` (read the
  diff): each critical-area change must be covered by a decision, and a protected-path change is a
  known risk.
- The architecture constraints of `.zapper/input/architecture.md` and the conventions of the
  project's repository instructions, and for each the code or decision that bears on it.

## 4. Attribute to stories

Apply the attribution rules of [../references/sources.md](../references/sources.md): story first,
cross-cutting otherwise. Never guess.

## Output

The working notes for the next steps, per story and for the summary. Nothing is written to disk
here.
