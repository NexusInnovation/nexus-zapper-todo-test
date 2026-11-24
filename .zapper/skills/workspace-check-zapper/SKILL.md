---
name: workspace-check-zapper
description: "Read-only preflight of a Zapper workspace: checks that the project configuration (.zapper/config.md), the refined input, the BDD suite, the regression baseline and the implementation plan are present and approved, and that the branch is safe, so a run can start with /goal without extra prompting. Reports each item as ready or missing with the next action. USE FOR: validate a Zapper setup, check before a Zapper run, before /goal, set up Zapper in a new project. DO NOT USE FOR: producing the input, BDD suite or plan (use `refine-input-zapper`, `generate-bdd-zapper` or `plan-implementation-zapper`), running the goal itself."
---

# Zapper workspace check

Preflight before `/goal`. It only reads: it never creates or edits a file. The conditions and the
report format are in [flows/check.md](flows/check.md). The template of the project configuration is
[assets/config.md](assets/config.md).

## Available Operations

| Operation | Description                                                   | Flow                             |
| --------- | ------------------------------------------------------------- | -------------------------------- |
| Check     | Verify every prerequisite of a run and report what is missing | [flows/check.md](flows/check.md) |

## Routing

There is one operation: run **Check**.
