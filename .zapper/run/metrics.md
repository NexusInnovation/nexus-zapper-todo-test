# Run metrics

Ledger of the cost, the duration and the human interventions of each stage of this run. Each stage
writes its own row; the `report-run-zapper` skill reads it. Format:
`report-run-zapper/references/metrics-layout.md`.

| Stage        | Started                   | Ended                     | Active time | Cost          | Answers | Re-prompts | Resumes | Source                                             |
| ------------ | ------------------------- | ------------------------- | ----------- | ------------- | ------- | ---------- | ------- | -------------------------------------------------- |
| `refine`     | 2026-11-24T16:47:43-05:00 | 2026-11-24T16:59:12-05:00 | 11 min      | not available | 8       | 0          | 0       | session timestamps; the CLI exposes no usage here |
| `bdd`        |                           |                           |             |               |         |            |         |                                                    |
| `regression` |                           |                           |             |               |         |            |         |                                                    |
| `plan`       |                           |                           |             |               |         |            |         |                                                    |
| `goal`       |                           |                           |             |               |         |            |         |                                                    |
| `report`     |                           |                           |             |               |         |            |         |                                                    |

## Agent activity

- No subagents were used by the refine stage.
