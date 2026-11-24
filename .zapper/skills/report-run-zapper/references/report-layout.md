# Report layout

The contract of `.zapper/run/output-report/`, the output of a Zapper run. It is hierarchical: a
summary to judge the run in minutes, and one file per story to drill down.

## Folder

```text
.zapper/run/output-report/
├── summary.md                      # verdict, decisions, hypotheses, risks, cost, sign-off
└── stories/
    └── <story-slug>.md             # same slug as .zapper/input/stories/<story-slug>/
```

Create no other file in this folder. One story file per story of `.zapper/input/stories/`, even
when the story has no failure (the non-functional requirements are reported in `summary.md`, with
no story file).

## Language

Write the whole report in the `language` of `.zapper/config.md`, read at every run: headings,
labels, table headers, sentences and the fixed phrases of the templates (such as "No finding
attributed to this story."). Never take the language from the conversation, from the previous
report or from the stories, so that two runs of a project always read the same. Keep in English what
other stages and tools parse or quote: the frontmatter keys and values, requirement, area and
decision IDs, commands, file paths, commit messages and the status words `passed`, `failed`,
`not run`, `not available`, `manual`, `waived by configuration`, `pending`, `blocked` and
`signed-off`. If `language` is missing from the configuration, stop and say so; do not guess.

`.zapper/run/report.md` is a different file: the evidence log kept up to date by the implementation
agents during the run. It is an input of this report, never its output. `.zapper/run/metrics.md` is
another input: the ledger of cost, duration and human interventions, defined in
[metrics-layout.md](metrics-layout.md).

## Templates

| Output file               | Template                                     |
| ------------------------- | -------------------------------------------- |
| `summary.md`              | [../assets/summary.md](../assets/summary.md) |
| `stories/<story-slug>.md` | [../assets/story.md](../assets/story.md)     |
| `.zapper/run/metrics.md` (input, written by the stages) | [../assets/metrics.md](../assets/metrics.md) |

Replace every `<placeholder>`. Remove a section only where this file allows it. In `story.md`,
`<features-path>/<story-slug>.feature` is the path of the story's `.feature` file, found through
the `features-path` of `.zapper/behaviour-driven-development/README.md` and written relative to the
story file.

## Files that do not invalidate the evidence

Generating the report writes the report and, through the Run operations, the results of the BDD
suite and of the regression suite. These changes are not code: `.zapper/run/output-report/`,
`.zapper/behaviour-driven-development/results/`,
`.zapper/behaviour-driven-development/stories/*/results.md`, the **Last run** column of
`.zapper/behaviour-driven-development/README.md`, `.zapper/regression-baseline/results/`,
`.zapper/regression-baseline/areas/*/results.md` and the **Last run** column of
`.zapper/regression-baseline/README.md`, and the evidence log and the metrics ledger of the run,
`.zapper/run/report.md` and `.zapper/run/metrics.md`, as long as their content is the one the
Generate operation read (committing them unchanged is not a change). The review outcome that
**Sign off** writes in `.zapper/run/decisions.md` (the `Status`, approver and date of an entry) does
not invalidate it either; any change to the other fields of an entry, or a new or removed entry,
does. Any other change to code, tests or `.zapper/`
since the recorded `commit` makes the report stale. The Generate, Sign off and Package operations
all apply this rule.

## summary.md

YAML frontmatter, the only signals later stages and humans check:

| Field              | Values                                                                        |
| ------------------ | ----------------------------------------------------------------------------- |
| `generated-at`     | ISO date and time of the Generate operation                                   |
| `commit`           | Full SHA of `HEAD` the evidence was collected at                              |
| `branch`           | Branch the run worked on                                                      |
| `hard-validations` | `passed` only when rows 1 to 6 of the verdict table pass, otherwise `failed`  |
| `sign-off`         | `pending`, `signed-off` or `blocked`                                          |
| `signed-off-by`    | Name of the human, empty until signed off                                     |
| `signed-off-on`    | ISO date, empty until signed off                                              |

Sections, in this order:

| Section                     | Content                                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict                     | Every success criterion of the Feature, each with its command, its computed status, its detail and the time of its fresh run (see below). The six hard validations of the [sources reference](sources.md), plus the human sign-off and the output report. Pass or fail, no score. |
| Stories                     | One row per story: requirements passed, failed, skipped, findings, deviations, link to its file. Non-functional requirements are not stories: they have their own section. |
| Non-functional requirements | One row per non-functional requirement (`nfr-<category>-R<nn>`), see below.                                                             |
| Regression baseline         | One row per protected area (`RG-<nn>`): its existing tests, its regression scenarios, its result, its failures; plus the existing tests changed during the run. Remove when the baseline has no area. |
| Commits                     | One row per commit of the branch, against the plan's order, see below.                                                                  |
| Decisions                   | Two tables. **Approved in the plan**: every major decision (category, reasoning, approver and date). **Deviations from the plan**: every decision assumed during the run (`A<nn>`, category, context, assumed choice, new information, `TODO` location) with its review status at sign-off (`assumed`, `approved at sign-off`, `rejected`). |
| Deviations and out-of-scope changes | Every difference from the plan or the refined input, every change outside the scope or outside any block, each with its decision or `unrecorded`. |
| Open hypotheses             | Every `TODO(<ID>)` marker still in the code: assumed answer, where, who must confirm.                                                   |
| Known risks                 | Failed validations, waivers, unrecorded deviations, decisions neither approved in the plan nor logged as a deviation, deviations not yet reviewed, out-of-scope work, missing evidence, open questions. |
| Follow-ups outside the code | What the team must still do outside the code for the result to work or to be approved, see below.                                       |
| Cross-cutting findings      | Findings and hook results that cannot be attributed to a single story. Remove when empty.                                               |
| Run cost, duration and human interventions | The cost, the duration and the number of answers, re-prompts and resumes of each stage, from the metrics ledger, plus the agent activity as far as the sources record it. |
| Architecture review         | The qualitative checklist the human judges (see below).                                                                                 |
| Sign-off                    | The state and the human's name and date.                                                                                                |
| Pull request                | Suggested branch, title and description for the human to open the PR into the default branch.                                           |

### Verdict statuses

The Verdict computes a status for every success criterion; none is omitted, shortened or left to
the narrative.

- `passed`: established by a fresh run (or by the evidence, for decisions and plan) at the recorded
  `commit`.
- `failed`: the run ran and the criterion does not hold.
- `not run`: the command exists but was not executed, or a result is missing.
- `not available`: the command or the evidence does not exist or cannot run.
- `waived by configuration`: the category is `none` in `.zapper/config.md`.

Only `passed` and `waived by configuration` satisfy a hard validation; `failed`, `not run` and
`not available` fail it and are each a known risk with the reason. The **Detail** column carries the
measured figures (scenarios, tests, errors, findings by severity) so a failed or not-run criterion
is visible at a glance. Row 7 (human sign-off) is `pending`, `blocked` or `signed-off`, from the
frontmatter. Row 8 (output report) is `complete` only when [check-report.md](../steps/check-report.md)
passes with no `not available` figure left unexplained, `incomplete` otherwise.

### Sign-off rules

- **Hard validations first.** `hard-validations: passed` requires all six validations of the
  [sources reference](sources.md) to pass in a fresh run at the recorded `commit`. Otherwise `sign-off` is
  `blocked`: a human cannot sign off a failing run.
- **Then the human judges the architecture.** This is the qualitative part (roughly the last
  "20%" of the effort that a computed score cannot capture): does the generated code meet the
  architecture standards of the project? The report prepares the judgement (checklist and
  evidence), it never answers it.
- Only the [Sign off](../flows/sign-off.md) operation, with the human answering, sets
  `signed-off`, with their name and the date. Regenerating the report sets `sign-off` back to
  `pending` (or `blocked`) because the evidence changed.

### Architecture review checklist

One line per constraint stated in `.zapper/input/architecture.md` and per applicable convention of
the project's repository instructions: the constraint, what the code does (with a link to the
evidence: file, decision ID), and a proposed reading (`respected`, `deviation`, `unclear`). The
human confirms or corrects each line at sign-off. A `deviation` must point to an approved decision;
otherwise it is also a known risk.

## stories/\<story-slug\>.md

Sections, in this order:

| Section                         | Content                                                                                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title (`#`)                     | Story title and links to its refined story and its `.feature` file.                                                                                                  |
| BDD results                     | Totals (passed, failed, skipped), a table per requirement, and each failed or skipped scenario with its requirement ID, its first failing step and its feature file. |
| Linters, analyzers and security | Findings attributed to the story: tool, rule, severity, file and line, status. States explicitly when there is none.                                                 |
| Hooks                           | Results of the hooks attributed to the story. States explicitly when there is none or when no hook log exists.                                                       |
| Deviations                      | Differences from the refined input and from the plan, each with its decision ID, or `unrecorded`.                                                                    |

### Counting rules

- A requirement is `passed`, `failed`, `not run` or `manual` as defined by the execution contract of the BDD
  stage (`generate-bdd-zapper`); a scenario is `passed`, `failed` or `skipped` (any non-passing
  status other than failed: skipped, pending, undefined, ambiguous, unknown). Skipped scenarios are
  listed apart from failures but count against the hard validation: the stopping condition accepts
  no skipped scenario.
- Every failed or skipped scenario names its requirement ID (`<story-key>-R<nn>` or
  `nfr-<category>-R<nn>`, from its tag). A
  scenario without a requirement tag is an orphan: list it in the summary risks.
- A finding is attributed to a story only when [sources.md](sources.md) can tie it to that story
  alone. Never split or guess: everything else is cross-cutting.
- A finding is `open` or `resolved`. Only `open` findings of the blocking severities count against
  the hard validations; list resolved ones only as a count.
- A regression scenario carries `@regression` and an area ID (`RG-<nn>`), never a requirement ID:
  it is not an orphan. An area is `passed`, `failed` or `not run` as defined by the execution
  contract of the regression stage (`regression-baseline-zapper`). Every failed or skipped
  scenario or test names its area; a result that maps to no area is unmapped and goes in the
    summary risks (only a failed or skipped one, or a scenario without an area tag, counts against
    the hard validation). Skipped scenarios and tests count against the hard validation, as for the BDD
  suite.

### Non-functional requirements section

In `summary.md`, one row per requirement of the `nfr-<category>` folders of the BDD suite (every
statement of `.zapper/input/non-functional-requirements.md`, none omitted): its ID, category, the
requirement in a few words, its check (the scenarios that verify it), and its result:

- `passed` or `failed` for an automated requirement, as defined by the execution contract of the
  BDD stage; `not run` when a scenario has no result. A failed check names its first failing step.
  For a performance requirement, give the threshold and the measured value of each screen or
  query, and say whether the check ran on the realistic-volume dataset of `.zapper/config.md`
  (kind and volumes); a performance check that did not run on it is not valid evidence: report it
  as `not run` and as a known risk.
- `manual` for a requirement whose checks are all `@manual`: say why no automated check is
  possible and what a human verifies (the reason in the scenario description). It never counts as
  passed. List every manual requirement again in **Known risks** so the human verifies it at
  sign-off. A requirement is never missing from the table or silently skipped: one with neither an
  automated nor a `@manual` scenario is a gap, a known risk and an unrecorded deviation.

Failed or `not run` non-functional requirements count against hard validation 1.

### Regression baseline section

In `summary.md`, one row per area of `.zapper/regression-baseline/inventory.md`: ID and name,
coverage verdict, existing tests and regression scenarios passed out of the total, result, and for
each failure the scenario or test, its first failing step or assertion and its file. Below the
table, **Existing tests changed**: each change found by the comparison described in
[sources.md](sources.md), with its decision ID or `unrecorded`. Areas are not attributed to
stories: a failure is reported against its area only.

### Commits section

In `summary.md`, one row per commit of `git log --reverse <default-branch>..HEAD`, so the reviewer
can read the run in order. For each: the short SHA, the subject, the kind, the plan block (with its
row number in the plan's **Building blocks** table) or the story, the number of files and whether it
builds. Commits are read from their `Block:`, `Stories:` and `Decisions:` trailers (see
`.zapper/goal.md`) and from the files they touch against the blocks' touchpoints.

- **Kind**: `code` (production code of a block), `test glue` (step definitions, fixtures, tests),
  `docs` (`docs/`, ADRs), `evidence` (`.zapper/run/`) or `other`.
- **Builds**: the build result recorded for that commit in `.zapper/run/report.md`; `not available`
  when none is recorded. Never run a build for each commit here: this stage does not check out other
  commits.
- Below the table, state: whether the blocks appear in the plan's order, and each defect found. The
  order is judged on the first commit of each block; a later commit that fixes an earlier block is
  listed as `fix of <block>` and is not an order defect. A defect is a commit that mixes two blocks
  or two kinds, has no `Block:` trailer or a block that does not exist, has a message that is not
  conventional, has no build result or a `failed` one, or a block with neither a commit nor
  evidence of its run (see below).
- A block that changes nothing, such as `bdd-runner` when it only checks an existing runner, has no
  commit by design: it is delivered when `.zapper/run/report.md` records its check (command, result
  and time) as passed. A `Block:` trailer is valid when it is `none` (out-of-plan changes and
  evidence) or the slug of a block of the plan; any other value is a defect.
- Commit defects are deliberately not hard validations: reviewability is not one of the Feature's
  success criteria, so the human weighs them at sign-off, where each one is in **Known risks**. The
  one exception is a block with neither a commit nor a passed check recorded in
  `.zapper/run/report.md`, which is a block not delivered (validation 6).
- A branch with a single commit, or a commit that touches several blocks, is reported as one defect
  with the number of files and the blocks it touches.

### Deviations and out-of-scope changes section

In `summary.md`, one row per item, aggregating what the other sections state in pieces:

- the deviations from the refined input and from the plan (see Deviations in
  [sources.md](sources.md)), with their decision ID or `unrecorded`;
- the **out-of-scope changes**: a file of the diff that no block's touchpoints name, a behaviour or a
  page that `.zapper/input/scope.md` lists as out of scope or that no requirement asks for, found by
  comparing the diff with the plan and the scope. Each is `unrecorded` unless a decision covers it;
- the existing tests changed, the `protected-paths` touched and the `critical-areas` changed.

Each unrecorded row is also a known risk.

### Follow-ups outside the code section

In `summary.md`, what the team must still do outside the code for the delivered result to work or to
be approved, one row each, with its kind, why, who confirms and its source:

- **Infrastructure** to provision or configure: from the `Follow-up` of the run's decisions, the
  infrastructure and pipelines in the diff (`infra/`, `pipelines/`) and the plan's **Configuration**
  and **Integrations** touchpoints that name a resource the diff does not create.
- **ADRs** to approve or to write: records of the diff (for example under
  `docs/Decisions-Architecturales/`) whose status is not accepted, and major decisions with no
  record.
- **Secrets and configuration** to set per environment, and **data** to load or migrate.
- **Manual checks**: every `manual` non-functional requirement and every open hypothesis to confirm.
- Anything an `assumed` decision's `Follow-up` names.

Never invent a follow-up: each row has a source. `No follow-up outside the code.` is written only
after every source was read.

### Run cost, duration and human interventions section

In `summary.md`, one row per stage (refine, BDD, regression, plan, `/goal`, output report) read from the
`.zapper/run/metrics.md` ledger ([metrics-layout.md](metrics-layout.md)): cost with its unit,
duration, answers, re-prompts, resumes and the source. A stage with no row, or a figure the ledger
marks `not available`, is `not available`: never `0`, never an estimate. The total adds the known
figures and names the stages that lack one. The `goal` row of a single pass has no answer and no
re-prompt; if it has, say so in **Known risks**. The `report` row stops before the check-report
step, so it leaves out the checking and the fixes of the report: say so in **Known risks**.
