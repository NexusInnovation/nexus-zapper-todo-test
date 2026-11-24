---
status: approved
baseline: passed
baseline-commit: 8452f4117dc95f1ca64930938dc68eaea77816cf
run-command: pnpm --dir src/frontend test:regression
result-format: junit-xml
result-file: .zapper/regression-baseline/results/regression.junit.xml
---

# Regression baseline

Executable description of the existing behaviour this Zapper generation must not break, maintained
by the `regression-baseline-zapper` skill. Once the baseline is approved, the `.feature` files are
read-only to agents: change them through the skill, which sets the status back to `draft` first. The
existing project tests listed in [inventory.md](inventory.md) are not locked: an agent may update
one when the refined input changes the behaviour it checks, and reports it as a deviation.

## Execution

The run command, result format and result file are the frontmatter fields above. The regression
suite is the regression scenarios plus the existing tests of the inventory. An empty `run-command`
means the suite is not wired yet; `baseline` must be `passed` before `/goal` starts.

Existing suites confirmed for the regression command (whole suites, from the repository root):
`pnpm run test:run` and `pnpm run test:e2e` in `src/frontend` (the e2e needs the E2E backend), and
`dotnet test` of `src/backend/tests/LibrairieMartinSlim.AllTests` (needs SQL Server).

## Areas

| Area                                                                                                                    | Coverage  | Existing tests | Scenarios | Last run |
| ----------------------------------------------------------------------------------------------------------------------- | --------- | -------------- | --------- | -------- |
| [RG-01 Coquille applicative et succursale active](inventory.md#rg-01--coquille-applicative-et-succursale-active)        | partial   | 8              | 2         | not run  |
| [RG-02 Tableaux et recherches enregistrées partagés](inventory.md#rg-02--tableaux-et-recherches-enregistrées-partagés)  | covered   | 5              | 0         | not run  |
| [RG-03 Liste des achats](inventory.md#rg-03--liste-des-achats)                                                          | partial   | 3              | 3         | not run  |
| [RG-04 Débuter un achat : sélection des fournisseurs](inventory.md#rg-04--débuter-un-achat--sélection-des-fournisseurs) | covered   | 4              | 0         | not run  |
| [RG-05 Composition du brouillon d'achat](inventory.md#rg-05--composition-du-brouillon-dachat)                           | partial   | 4              | 4         | not run  |
| [RG-06 Confirmation et envoi du brouillon](inventory.md#rg-06--confirmation-et-envoi-du-brouillon)                      | covered   | 4              | 0         | not run  |
| [RG-07 Fiche d'un achat](inventory.md#rg-07--fiche-dun-achat)                                                           | uncovered | 2              | 3         | not run  |
| [RG-08 Téléchargement du PDF d'un achat](inventory.md#rg-08--téléchargement-du-pdf-dun-achat)                           | covered   | 3              | 0         | not run  |
| [RG-09 Consultation des fournisseurs et des clients](inventory.md#rg-09--consultation-des-fournisseurs-et-des-clients)  | covered   | 2              | 0         | not run  |
| [RG-10 Totaux et taxes d'un achat](inventory.md#rg-10--totaux-et-taxes-dun-achat)                                       | covered   | 3              | 0         | not run  |
| [RG-11 Administration : modules par succursale](inventory.md#rg-11--administration--modules-par-succursale)             | partial   | 3              | 2         | not run  |
