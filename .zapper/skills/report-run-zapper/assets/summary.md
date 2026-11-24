---
generated-at: <ISO date and time>
commit: <full SHA of HEAD>
branch: <feature branch>
hard-validations: <passed | failed>
sign-off: <pending | signed-off | blocked>
signed-off-by:
signed-off-on:
---

# Run report

<One or two sentences: what this run generated and the verdict, so the report can be judged in a
minute.>

## Verdict

Every success criterion of the Feature has a row, with a status computed from a fresh run or from
the evidence: `passed`, `failed`, `not run`, `not available` or `waived by configuration`. A
criterion is never left out: one that failed, was not run or could not run is listed and explained.
Rows 1 to 6 are the hard validations; rows 7 and 8 are reported alongside them.

| #   | Success criterion            | Command     | Result            | Detail                                   | Last run    |
| --- | ---------------------------- | ----------- | ----------------- | ---------------------------------------- | ----------- |
| 1   | BDD (stories and non-functional) and regression | `<command>` and `<command>` | <passed / failed / not run / not available> | <BDD scenarios <n>/<total>, non-functional <n>/<total>, regression scenarios <n>/<total>, existing tests <n>/<total>> | <ISO time>  |
| 2   | Build and tests              | `<command>` | <passed / failed / not run / not available / waived by configuration> | <build, unit tests <n>/<total>, e2e <n>/<total>> | <ISO time>  |
| 3   | Linters and static analyzers | `<command>` | <passed / failed / not run / not available / waived by configuration> | <errors <n>, warnings <n>> | <ISO time>  |
| 4   | Security                     | `<command>` | <passed / failed / not run / not available / waived by configuration> | <high or critical unresolved <n>, lower severities <n>> | <ISO time>  |
| 5   | Decisions approved           | -           | <passed / failed> | <approved <n>/<total>, unrecorded <n>>   | <ISO time>  |
| 6   | Plan followed                | -           | <passed / failed> | <blocks delivered <n>/<total>, unrecorded deviations <n>> | <ISO time>  |
| 7   | Human sign-off (not a hard validation) | - | <pending / blocked / signed-off> | <what remains for the human>     | <ISO time>  |
| 8   | Output report (not a hard validation)  | - | <complete / incomplete> | <missing or `not available` parts of the report> | <ISO time>  |

<For each row that is not `passed`: one line stating why. Row 8 is set last, from the result of the
check-report step, so it never depends on itself.>

## Stories

| Story                                 | Requirements passed | Failed | Skipped | Open findings | Deviations   |
| ------------------------------------- | ------------------- | ------ | ------- | ------------- | ------------ |
| [<Story title>](stories/<story-slug>.md) | <n>/<total>         | <n>    | <n>     | <n>           | <n> (<m> unrecorded) |

## Non-functional requirements

| Requirement             | Category   | Requirement (short)   | Check                    | Threshold and measured value                  | Result                                    |
| ----------------------- | ---------- | --------------------- | ------------------------ | --------------------------------------------- | ----------------------------------------- |
| <nfr-category-R01>      | <Category> | <Statement in a few words> | <Scenarios, or the manual procedure> | <`<screen or query>`: <threshold> / <measured>; `-` when none> | <passed / failed / not run / manual> |

<For a `manual` requirement, state why no automated check is possible and what the human verifies;
for a performance requirement, state the dataset (kind, volumes) the checks ran on. List each manual
requirement in Known risks. Write `No non-functional requirement.` when the input has none.>

## Regression baseline

| Area                                                  | Coverage                        | Existing tests passed | Scenarios passed | Result            | Failures (scenario or test, first failing step, file) |
| ----------------------------------------------------- | ------------------------------- | --------------------- | ---------------- | ----------------- | ----------------------------------------------------- |
| [<RG-nn> <Area name>](../../regression-baseline/inventory.md#<anchor>) | <covered / partial / uncovered> | <n>/<total>           | <n>/<total>      | <passed / failed / not run> | <Failure or `none`>                       |

**Existing tests changed**

| Test     | Area    | Requirement that changes it | Decision                   |
| -------- | ------- | --------------------------- | -------------------------- |
| `<path>` | <RG-nn> | <requirement ID>            | <D<nn> / unrecorded>       |

<`none` when no existing test changed. A line `not available` when the baseline has no
`baseline-commit`. Remove the section when the baseline has no area.>

## Commits

`git log <default branch>..HEAD`, oldest first, against the **Building blocks** table of the plan.

| #   | Commit            | Message           | Kind                                  | Block / stories      | Files | Builds                         |
| --- | ----------------- | ----------------- | ------------------------------------- | -------------------- | ----- | ------------------------------ |
| <n> | `<short SHA>`     | <type(scope): subject> | <code / test glue / docs / evidence / other> | <block slug, plan order <n> / story keys / `none`> | <n>   | <passed / failed / not available> |

<One line stating whether the log reads in the plan's order and listing each commit that mixes
blocks or kinds, lacks the `Block:` trailer, or has no build result. `No commit.` when the branch has
none.>

## Decisions

**Approved in the plan**

| ID    | Category   | Decision   | Reasoning   | Approved by           | Source                       |
| ----- | ---------- | ---------- | ----------- | --------------------- | ---------------------------- |
| D<nn> | <Category> | <Decision> | <Reasoning> | <Name, ISO date / no> | [plan](<path>)               |

**Deviations from the plan** (assumed during the run, reviewed at sign-off)

| ID    | Category   | Assumed choice | New information   | Marker in the code       | Review                                                             |
| ----- | ---------- | -------------- | ----------------- | ------------------------ | ------------------------------------------------------------------ |
| A<nn> | <Category> | <Choice>       | <Why the plan did not cover it> | `<file>:<line>` | <assumed / approved at sign-off (name, ISO date) / rejected> |

<Includes every new dependency found in the diff of the manifests. A dependency with no decision in
either table is listed with `unrecorded`. `none` when the run took no decision of its own.>

## Deviations and out-of-scope changes

| Kind                                                                 | Deviation or change | Reference                    | Decision             |
| -------------------------------------------------------------------- | ------------------- | ---------------------------- | -------------------- |
| <plan / refined input / out of scope / existing test / protected path / critical area> | <What differs or changed> | <file, block, story, commit> | <D<nn> / unrecorded> |

<Write "No deviation and no out-of-scope change." when there is none. Out of scope: a change no
block names, or a behaviour that `.zapper/input/scope.md` excludes.>

## Open hypotheses

| ID                    | Assumed answer | Where                          | To confirm by |
| --------------------- | -------------- | ------------------------------ | ------------- |
| <key>-H<nn> / A<nn>   | <Assumption>   | `<file>:<line>` (every marker) | <Who>         |

## Known risks

- <Risk: failed validation, waiver, unrecorded deviation, decision neither approved in the plan nor
  logged as a deviation, deviation not yet reviewed, out-of-scope work, orphan scenario,
  evidence not available, open question of the evidence log, each `manual` non-functional
  requirement to verify at sign-off, a performance check not run on the realistic-volume dataset>.

## Follow-ups outside the code

| Follow-up                                                              | Kind                                                          | Why                | Owner to confirm | Source                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------ | ---------------- | ---------------------------- |
| <What must be done, for example provision a resource, approve an ADR> | <infrastructure / ADR / secret or configuration / data / manual check / other> | <What breaks or stays unapproved without it> | <Role or team>   | <decision ID, file, commit> |

<Write "No follow-up outside the code." when there is none.>

## Cross-cutting findings

| Source          | Tool or hook | Rule or check | Severity   | File       | Status            |
| --------------- | ------------ | ------------- | ---------- | ---------- | ----------------- |
| <why not a story> | <Name>     | <Rule>        | <Severity> | `<path>`   | <open / resolved> |

## Run cost, duration and human interventions

Source: `.zapper/run/metrics.md`. A figure with no source is written `not available`, never `0`.

| Stage                           | Cost            | Duration        | Answers | Re-prompts | Resumes | Source        |
| ------------------------------- | --------------- | --------------- | ------- | ---------- | ------- | ------------- |
| Refine input                    | <amount / `not available`> | <duration> | <n>     | <n>        | <n>     | <path or CLI> |
| BDD suite                       | <amount>        | <duration>      | <n>     | <n>        | <n>     | <path or CLI> |
| Regression baseline             | <amount>        | <duration>      | <n>     | <n>        | <n>     | <path or CLI> |
| Plan                            | <amount>        | <duration>      | <n>     | <n>        | <n>     | <path or CLI> |
| `/goal` (implementation and validation) | <amount / cap> | <duration> | <n>     | <n>        | <n>     | <path or CLI> |
| Output report                   | <amount>        | <duration>      | <n>     | <n>        | <n>     | <path or CLI> |
| **Total**                       | <amount>        | <duration>      | <n>     | <n>        | <n>     |               |

A total adds only the figures that exist and says which stage lacks one. A `/goal` row with answers
or re-prompts above `0` is not a single pass: say so in Known risks.

**Agent activity**: <agent: what it did, number of calls or tasks, if known; `not available`>.

## Architecture review

The human judges these lines at sign-off. The reading is a proposal, not a verdict.

| Constraint                                        | What the code does          | Evidence                  | Proposed reading                        | Human reading |
| ------------------------------------------------- | --------------------------- | ------------------------- | --------------------------------------- | ------------- |
| <Constraint of architecture.md or of the project> | <Observed behaviour or lack> | <file, decision ID>       | <respected / deviation / unclear>       |               |

## Sign-off

- **State**: <pending / signed-off / blocked>
- **Reason** (when blocked): <failed hard validation>
- **Signed off by**: <Name, ISO date; empty until the human signs off>

## Pull request

- **Branch**: `<branch>` into `<default branch>`
- **Title**: <Suggested title>
- **Description**: <Suggested description: what was generated, verdict, decisions to know about,
  open hypotheses, link to this report>
