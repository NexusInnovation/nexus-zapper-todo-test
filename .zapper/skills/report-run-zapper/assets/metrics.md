# Run metrics

Ledger of the cost, the duration and the human interventions of each stage of this run. Each stage
writes its own row; the `report-run-zapper` skill reads it. Format:
`report-run-zapper/references/metrics-layout.md`.

| Stage        | Started | Ended | Active time | Cost | Answers | Re-prompts | Resumes | Source |
| ------------ | ------- | ----- | ----------- | ---- | ------- | ---------- | ------- | ------ |
| `refine`     |         |       |             |      |         |            |         |        |
| `bdd`        |         |       |             |      |         |            |         |        |
| `regression` |         |       |             |      |         |            |         |        |
| `plan`       |         |       |             |      |         |            |         |        |
| `goal`       |         |       |             |      |         |            |         |        |
| `report`     |         |       |             |      |         |            |         |        |

## Agent activity

- <agent: what it did, number of calls or tasks, cost; only what a source records>
