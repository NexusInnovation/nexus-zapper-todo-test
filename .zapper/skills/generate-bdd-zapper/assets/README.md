---
status: draft
features-path:
run-command:
result-format:
result-file:
---

# BDD suite

Executable definition of "done" for this Zapper generation, maintained by the
`generate-bdd-zapper` skill. Once the suite is approved, the `.feature` files are read-only to
agents: change them through the skill, which sets the status back to `draft` first.

## Execution

The features location, run command, result format and result file are the frontmatter fields
above. An empty `run-command` means the project has no runner yet: the suite runs once the glue
exists.

## Stories

| Story                                                                       | Requirements | Scenarios | Last run |
| --------------------------------------------------------------------------- | ------------ | --------- | -------- |
| [<Story title>](stories/<story-slug>/<story-slug>.feature)                  | <n>          | <n>       | not run  |
| [Non-functional: <Category>](stories/nfr-<category>/nfr-<category>.feature) | <n>          | <n>       | not run  |
