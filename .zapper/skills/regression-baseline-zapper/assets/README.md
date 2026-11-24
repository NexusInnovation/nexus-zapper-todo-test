---
status: draft
baseline: not-run
baseline-commit:
run-command:
result-format:
result-file:
---

# Regression baseline

Executable description of the existing behaviour this Zapper generation must not break, maintained
by the `regression-baseline-zapper` skill. Once the baseline is approved, the `.feature` files are
read-only to agents: change them through the skill, which sets the status back to `draft` first.
The existing project tests listed in [inventory.md](inventory.md) are not locked: an agent may
update one when the refined input changes the behaviour it checks, and reports it as a deviation.

## Execution

The run command, result format and result file are the frontmatter fields above. The regression
suite is the regression scenarios plus the existing tests of the inventory. An empty `run-command`
means the suite is not wired yet; `baseline` must be `passed` before `/goal` starts.

## Areas

| Area                                                      | Coverage                         | Existing tests | Scenarios | Last run |
| --------------------------------------------------------- | -------------------------------- | -------------- | --------- | -------- |
| [<RG-nn> <Area name>](inventory.md#<anchor of the area>)  | <covered / partial / uncovered>  | <n>            | <n>       | not run  |
