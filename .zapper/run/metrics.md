# Run metrics

Ledger of the cost, the duration and the human interventions of each stage of this run. Each stage
writes its own row; the `report-run-zapper` skill reads it. Format:
`report-run-zapper/references/metrics-layout.md`.

| Stage        | Started                   | Ended                     | Active time | Cost          | Answers | Re-prompts | Resumes | Source                                             |
| ------------ | ------------------------- | ------------------------- | ----------- | ------------- | ------- | ---------- | ------- | -------------------------------------------------- |
| `refine`     | 2026-11-24T16:47:43-05:00 | 2026-11-24T16:59:12-05:00 | 11 min      | not available | 8       | 0          | 0       | session timestamps; the CLI exposes no usage here |
| `bdd`        | 2026-11-24T17:00:41-05:00 | 2026-11-24T17:29:26-05:00 | 29 min      | not available | 11      | 0          | 0       | session timestamps; the CLI exposes no usage here |
| `regression` | 2026-11-24T17:44:57-05:00 | 2026-11-24T18:03:41-05:00 | 19 min      | not available | 6       | 0          | 0       | session timestamps; the CLI exposes no usage here |
| `plan`       | 2026-11-24T18:06:29-05:00 | 2026-11-24T18:37:12-05:00 | 31 min      | not available | 12      | 0          | 0       | session timestamps; the CLI exposes no usage here |
| `goal`       | 2026-11-25T02:40:53Z      | 2026-11-25T04:10:00Z      | 89 min      | not available | 0       | 0          | 0       | session timestamps; the CLI exposes no usage here |
| `report`     |                           |                           |             |               |         |            |         |                                                    |

## Agent activity

- No subagents were used by the refine stage.
- No subagents were used by the regression stage.
- The plan stage used 7 subagents: 6 block writers (one per block, batches of at most 3) and 1 independent cross-block sanity reviewer (2 findings, both integrated).
- No subagents were used by the goal stage.
