---
status: approved
baseline: not-run
baseline-commit:
run-command: pnpm --dir src/frontend regression
result-format: junit-xml
result-file: results/regression.xml
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

| Area                                                                                                        | Coverage  | Existing tests | Scenarios | Last run |
| ----------------------------------------------------------------------------------------------------------- | --------- | -------------- | --------- | -------- |
| [RG-01 Coquille de l'application et navigation](inventory.md#rg-01--coquille-de-lapplication-et-navigation) | partial   | 2              | 3         | not run  |
| [RG-02 Sélecteur de langue](inventory.md#rg-02--sélecteur-de-langue)                                        | uncovered | 0              | 3         | not run  |
| [RG-03 Composants partagés de l'interface](inventory.md#rg-03--composants-partagés-de-linterface)           | covered   | 2              | 0         | not run  |
| [RG-04 Hôte de l'API et accès aux données](inventory.md#rg-04--hôte-de-lapi-et-accès-aux-données)           | partial   | 1              | 1         | not run  |
