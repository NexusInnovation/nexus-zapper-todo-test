# Sources of evidence

Where each part of the report comes from. Read every source live on each run. A source that is
missing, empty or unreadable is reported as **not available** with the path that was looked for:
that is a known risk, never a pass, and it is never reconstructed from memory.

## Sources

| Evidence                        | Source                                                                                                                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stories and acceptance criteria | `.zapper/input/stories/<story-slug>/` and `.zapper/input/README.md`                                                                                                              |
| Scope and architecture          | `.zapper/input/scope.md`, `.zapper/input/architecture.md`, `.zapper/input/non-functional-requirements.md`                                                                        |
| Requirements and scenarios      | The `.feature` files in the `features-path` of `.zapper/behaviour-driven-development/README.md` (requirement IDs are the `@<story-key>-R<nn>` tags; non-functional ones are `@nfr-<category>-R<nn>`, in the `nfr-<category>` folders, and `@manual` marks a check no automation can make) |
| BDD results                     | The Run operation of `generate-bdd-zapper` rewrites `stories/<story-slug>/results.md` and `results/` (the non-functional categories included); read those, following that skill's execution contract |
| Regression baseline             | `.zapper/regression-baseline/README.md` (`status`, `baseline`, `baseline-commit`, run contract), `inventory.md` (areas `RG-<nn>`, their existing tests), `areas/<area-slug>/<area-slug>.feature` (tags `@regression @RG-<nn>`) |
| Regression results              | The Run operation of `regression-baseline-zapper` (an evidence run) rewrites `areas/<area-slug>/results.md` and `results/`; read those, following that skill's execution contract |
| Project facts                   | `.zapper/config.md`: the commands of each category, `protected-paths`, `protected-environments`, `critical-areas`, `default-branch` and `language`                               |
| Plan                            | `.zapper/run/plan/` (`README.md` blocks table, `decisions.md`, `<block>/hypotheses.md`)                                                                                          |
| Decision log                    | `.zapper/run/decisions.md` (the single log of decisions assumed during the run, each a deviation from the plan, with its `A<nn>` ID) and the plan's own `decisions.md` (approved before the run) |
| Evidence log of the run         | `.zapper/run/report.md`: the commands used for build, tests, linters, analyzers and security, their results, and the open questions                                              |
| Hook results                    | The hooks declared in `.zapper/com.github.copilot/hooks/hooks.json` and the log files they write (read each hook's command to find its log path; the `goal-gate` hook writes `.zapper/run/hooks.log.jsonl`)  |
| Run cost and agent activity     | The cost, duration and human-intervention ledger `.zapper/run/metrics.md` (format: [metrics-layout.md](metrics-layout.md)); when the CLI exposes session usage, the ledger's `Source` says where. Record the source of each figure |
| Commit history                  | `git log --reverse <default-branch>..HEAD` with each commit's message, trailers (`Block:`, `Stories:`, `Decisions:`) and files, against the plan's **Building blocks** order; the build result of each commit in `.zapper/run/report.md` |
| Follow-ups outside the code     | The `Follow-up` field of `.zapper/run/decisions.md`, the diff of `infra/` and `pipelines/`, the plan's **Configuration** and **Integrations** touchpoints, the ADR files of the diff and their status, the `manual` non-functional requirements and the open hypotheses |
| Open hypotheses                 | The code, searched with two regular expressions outside `.zapper/` (the plan's own files quote the markers): `TODO\([\w-]+-H\d{2}\)` for plan hypotheses and `TODO\(A\d{2,}\)` for decisions assumed during the run; cross-checked with the plan's `hypotheses.md` files and the run's `decisions.md` |
| Code changes                    | `git diff --name-status <default-branch>...HEAD` and `git log <default-branch>..HEAD`; the default branch name comes from `git symbolic-ref --short refs/remotes/origin/HEAD`    |
| New dependencies                | The diff of the project's dependency manifests and lock files (package manifests, project files, infrastructure modules), found by looking at what the diff touches              |

## Hard validation commands

The hard validations 1 to 4 are conditions 1 to 4 of `.zapper/goal.md`; 5 and 6 are checks the
report adds. Take the commands of validations 2 to 4 from the `commands` of `.zapper/config.md`
(`build`, `unit-test`, `e2e`, `lint`, `security`). A category set to `none` was waived by the team
in the approved configuration: report it as `waived by configuration`. A category with no command
that is not `none` is reported as `not available` and a known risk: do not waive it, because a
waiver is a major decision that belongs in the decision log with a human approval.

| #   | Condition                    | How it is established                                                                                                                    |
| --- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | BDD and regression           | Fresh run of both suites: the BDD suite through `generate-bdd-zapper` (Run) and the regression suite through `regression-baseline-zapper` (Run, as an evidence run). Every scenario and test passes, none failed, undefined, pending, skipped or ambiguous. The BDD suite includes the non-functional checks (performance thresholds on the realistic-volume dataset, server-side paging, security, accessibility…): one failing check fails the condition. A `manual` non-functional requirement is not a failure: it is listed apart and never counted as passed |
| 2   | Build and tests              | Fresh run of the `build`, `unit-test` and `e2e` commands: they succeed                                                                   |
| 3   | Linters and static analyzers | Fresh run of each command: 0 errors                                                                                                      |
| 4   | Security                     | Fresh run of each command: 0 unresolved high or critical findings                                                                        |
| 5   | Decisions                    | Every major decision of the plan's `decisions.md` has a recorded human approval (name and date) and none is `proposed`; every decision of the run's log is flagged `deviation from plan` with its `TODO(A<nn>)` in the code, and stays `assumed` until the human reviews it at sign-off |
| 6   | Plan                         | Every plan block was delivered; every difference from the plan is a decision (`deviates from the plan`) with its new information         |

Rules for fresh runs: run each command once from the repository root, after the last code change,
and record the exact command, its exit code and the time. Never reuse an earlier result. Never
modify code, a `.feature` file, a lint configuration or a suppression to make a command pass: this
stage observes, it does not repair. A failure is reported as a failure.

## Attributing evidence to a story

1. A story owns its requirement IDs (the tags of its `.feature` file). A non-functional requirement
   (`nfr-<category>-R<nn>`) belongs to no story: it is reported in the **Non-functional
   requirements** section of the summary.
2. The plan's blocks table links each block to the requirement IDs it covers. A block covering the
   requirements of one story only belongs to that story.
3. The files a block adds or changes come from its touchpoints in the plan and from the git diff.
4. A finding or hook event is attributed to a story when its file belongs to blocks of that story
   alone, or when the tool output names the story's requirement ID or scenario.
5. Everything else (shared blocks, shared files, configuration, evidence without a file) goes to
   **Cross-cutting findings** in the summary.

## Deviations

Compare what was delivered with the refined input and the plan:

- **From the input**: a requirement without implementation, or an automated requirement without a
  passing scenario (a requirement whose scenarios are all `@manual` has none by design and is not a
  deviation), behaviour
  outside `.zapper/input/scope.md`, a constraint of `architecture.md` not respected, a
  non-functional requirement with a failing check or with no check (neither automated nor
  `@manual`).
- **From the plan**: a block not delivered, a delivered change that no block mentions (read the
  diff), a technology, structure or dependency different from the plan.
- **Out of scope**: a file of the diff that no block's touchpoints name, or a behaviour or page that
  `.zapper/input/scope.md` excludes or no requirement asks for. It is listed in **Deviations and
  out-of-scope changes** of the summary, whether or not a decision covers it.

A deviation is `recorded` when a decision of the run's decision log covers it (cite its ID), and
`unrecorded` otherwise. An unrecorded deviation is a known risk and fails condition 6.

**Existing tests changed.** The existing tests of the regression baseline are not locked, but each
change is a deviation. Compare the paths listed in `inventory.md` (**Existing tests**) with
`git diff --name-status <baseline-commit>..HEAD`, `baseline-commit` coming from the baseline's
`README.md`: every modified, renamed or deleted test is a change. It is `recorded` when a decision
marked `deviation` names the test, its area and the requirement that changes the behaviour. A new
test file is not a change. Any difference in a `.feature` file of the baseline, or an area ID
missing from it, is an unrecorded deviation too: those files are locked once approved. When
`baseline-commit` is empty, report the comparison as `not available`.
