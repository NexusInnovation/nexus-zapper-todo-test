# Generate

Writes `.zapper/run/output-report/`: the summary and one file per story, from fresh evidence.
Format: [../references/report-layout.md](../references/report-layout.md). Sources and attribution:
[../references/sources.md](../references/sources.md).

## Before Starting

1. Read [../references/report-layout.md](../references/report-layout.md),
   [../references/sources.md](../references/sources.md) and
   [../references/metrics-layout.md](../references/metrics-layout.md).
2. Read `.zapper/goal.md`, `.zapper/config.md` (its `language` is the language of the whole
   report), `.zapper/input/README.md` and the `README.md` of
   `.zapper/behaviour-driven-development/` and `.zapper/regression-baseline/`. If the
   configuration, the input, the suite or the baseline does not show `status: approved`, or
   `.zapper/run/plan/` holds no plan, stop and tell the user: there is nothing valid to report on.
3. Check the current branch. The report is about a feature branch: if it is the `default-branch`
   of the configuration or a protected branch, stop and ask. Nothing in this operation commits or
   pushes.
## Step 1: Collect the evidence

Start the `report` row of `.zapper/run/metrics.md` (see
[../references/metrics-layout.md](../references/metrics-layout.md)), then follow [../steps/collect-evidence.md](../steps/collect-evidence.md). It runs the hard validations
fresh and returns the evidence, attributed to stories, in the working notes of this operation.

## Step 2: Write the story files

For every story of `.zapper/input/stories/`, write `stories/<story-slug>.md` from
[../assets/story.md](../assets/story.md) with the evidence attributed to it. Overwrite the previous
file. Remove a story file whose story no longer exists.

## Step 3: Write the summary

Write `summary.md` from [../assets/summary.md](../assets/summary.md), overwriting the previous one:

1. **Frontmatter**: `commit` and `branch` of the evidence, `hard-validations` from rows 1 to 6,
   `sign-off: blocked` when a row fails, otherwise `pending`. Leave `signed-off-by` and
   `signed-off-on` empty: this operation never signs off, even when the previous report was.
2. **Verdict** (all eight rows, each with a computed status), **Stories**, **Non-functional
   requirements** (every requirement of the `nfr-*` folders with its result, `manual` ones included),
   **Regression baseline**, **Commits**, **Open hypotheses**, **Cross-cutting findings**,
   **Run cost, duration and human interventions**: from the evidence.
3. **Decisions**: two tables. The decisions of the plan with their category, reasoning and approval
   (name and date). The decisions of the run (`.zapper/run/decisions.md`) as deviations from the
   plan, with their review status; add each new dependency of the diff that has no decision, marked
   `unrecorded`. Then **Deviations and out-of-scope changes**.
4. **Known risks**: everything that failed, is `not run`, is `not available`, is unrecorded or not
   yet reviewed, is out of scope, plus the open questions of the evidence log, orphan scenarios,
   unmapped results, commit defects and each `manual` non-functional requirement. Then
   **Follow-ups outside the code**.
5. **Architecture review**: one line per architecture constraint, with a proposed reading. Leave the
   human column empty.
6. **Pull request**: suggested title and description from the summary; the branch and the default
   branch it targets.

## Step 4: Check the report

Close the `report` row of `.zapper/run/metrics.md` (end, active time, cost, interventions of this
operation) and put its figures in the **Run cost** table, so the total includes this operation.
Then follow [../steps/check-report.md](../steps/check-report.md) and fix the report until it passes, then
set row 8 of the **Verdict** (`complete` or `incomplete`) from its result.

## Step 5: Report to the user

Tell the user the verdict (which hard validations fail), the number of deviations from the plan to
review at sign-off, open hypotheses and unrecorded deviations, and the next step: `blocked` means
the run must continue or be corrected; `pending` means a human can run [sign-off.md](sign-off.md).

## Checklist

- [ ] The six hard validations come from a fresh run at the recorded `commit`; none of the eight
      success criteria is missing from the Verdict.
- [ ] Every story has a file; every failure or skip names its requirement ID.
- [ ] Commits, deviations and out-of-scope changes, follow-ups outside the code, and the cost,
      duration and human interventions of each stage are in the summary, from their sources.
- [ ] The report is in the `language` of the configuration.
- [ ] Every non-functional requirement is in the summary with its result; manual ones are listed
      with their reason, never skipped.
- [ ] Evidence that was missing is reported as `not available`, not as passed.
- [ ] `sign-off` is `pending` or `blocked`, never `signed-off`.
- [ ] The `report` row of the ledger covers this operation, and the summary's totals match the ledger.
- [ ] No code, `.feature` file, plan, input or lint configuration was modified (only the `report`
      row of the ledger was written), and nothing was committed or pushed.
