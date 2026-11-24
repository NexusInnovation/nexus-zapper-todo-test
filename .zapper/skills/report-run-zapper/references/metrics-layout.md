# Run metrics ledger

The contract of `.zapper/run/metrics.md`: the only source of the cost, the duration and the human
interventions of each stage of a run. The report reads it; it never reconstructs these figures from
memory or estimates them.

## Who writes it

Each stage records its own row when it finishes (the last checklist item of `refine-input-zapper`,
`generate-bdd-zapper`, `regression-baseline-zapper` and `plan-implementation-zapper`, for the first
run and for every update), and the `/goal` run records the `goal` row (see `.zapper/goal.md`). A
**Review** operation of a stage adds its session to that stage's row, like an update does. The
**Generate** operation of this skill reads the ledger and writes only its own `report` row: it
starts the row before collecting the evidence, and closes it just before the check-report step,
with the figures of its own session (it re-runs the suites and validations, so that work is not in
the `goal` row). The checking and the fixes that follow are not in the row; the report says so in
**Known risks**. A human may correct a figure; the **Source** column then says so.

The `/goal` run starts its `goal` row when it starts and, before generating the report, records the
end, the active time, the cost the CLI reports and where it comes from, and the human interventions
(questions answered, re-prompts, resumes). The row covers the implementation and the validation
only. On a resume, it adds to the same row.

In the Azure runner (`.zapper/runner/`), the CLI prints the cost of the goal session only when it
exits, after the row is written: the row says `not available` for what the agent could not read,
and the human completes it from the `runner.log` of the run outputs (`Get-ZapperRun.ps1 -Download`),
with `human (runner.log)` in **Source**.

Create the file from [../assets/metrics.md](../assets/metrics.md) when it does not exist.

## Rows

One row per stage, with these exact IDs: `refine`, `bdd`, `regression`, `plan`, `goal`, `report`. A stage
that was not run for this run has no row; the report writes `not available` for it.

| Column        | Content                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `Started`     | ISO date and time the stage started (first start when cumulative).                                                                          |
| `Ended`       | ISO date and time the stage ended (last end when cumulative).                                                                               |
| `Active time` | Duration the stage worked, summed over its sessions. Equal to `Ended` minus `Started` only when it ran in one session without a pause.      |
| `Cost`        | Spend of the stage with its unit (AI credits or currency), exactly as the CLI reports it. `not available` when the CLI exposes no usage.    |
| `Answers`     | Number of questions the human answered, with the ask-the-user tool, including each walkthrough question.                                    |
| `Re-prompts`  | Number of human messages that corrected, redirected or completed the work after the launching prompt.                                       |
| `Resumes`     | Number of times the stage continued in a new session or after a stop (spend cap, crash), from `.zapper/run/` or from the stage's own files. |
| `Source`      | Where the cost and the duration come from: the CLI command or screen (for example `/usage`), the session log path, or `human`.              |

A stage whose output a run reuses (the refined input, the BDD suite, the regression baseline) is not
run again: its row is carried over from the run that produced it, with `carried over` in `Source`,
so the report shows what the reused artifacts cost. The `plan`, `goal` and `report` rows belong to
the run: start them empty for a new run. Generating the report again adds to the `report` row. A stage that runs again (an update) adds its figures to its row and
keeps the earlier ones: the row is cumulative.

Never estimate a figure. A figure the agent cannot read is written `not available`, never `0`: a
zero is a claim. The human-intervention counters are counted by the agent from its own session:
`0` is allowed when the agent counted none. The `goal` row of a single pass has `Answers` and
`Re-prompts` at `0`; a value above `0` is a finding of the report.

## Agent activity

Below the table, an optional **Agent activity** list: one line per agent or subagent of the `goal`
stage with what it did and, when known, its number of calls or tasks and its cost. Same rule: only
what a source records.
