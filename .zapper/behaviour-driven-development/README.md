---
status: approved
features-path: src/frontend/e2e/bdd/features
run-command: pnpm --dir src/frontend test:bdd
result-format: cucumber-json
result-file: results/cucumber.json
---

# BDD suite

Executable definition of "done" for this Zapper generation, maintained by the
`generate-bdd-zapper` skill. Once the suite is approved, the `.feature` files are read-only to
agents: change them through the skill, which sets the status back to `draft` first.

## Execution

The features location, run command, result format and result file are the frontmatter fields
above (`result-file` is relative to this folder).

- Runner: `playwright-bdd` (decision D01 of the plan) on the frontend Playwright stack, in
  `src/frontend`: configuration `playwright.bdd.config.ts`, one `bdd` project on a single worker,
  features in `e2e/bdd/features/`, glue in `e2e/bdd/` (steps, fixtures; hooks in
  `e2e/bdd/support/hooks.ts`). The existing e2e configuration is untouched.
- One tag (for example one requirement):
  `pnpm --dir src/frontend test:bdd --grep "@<requirement-id>"`.
- `@manual` scenarios are excluded by the command (`not @manual`). A scenario with no step
  definition is reported as failed (`Missing step`) and the exit code is non-zero; the result file
  is written either way.
- The managed servers (Vite, the E2E backend) are not started by the shell: the implementation run
  adds them with the steps.

## Stories

| Story                                                                                                                                                                | Requirements | Scenarios | Last run |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | --------- | -------- |
| [Thème (couleur) distinct par succursale](../../src/frontend/e2e/bdd/features/76439-theme-couleur-distinct-par-succursale/76439-theme-couleur-distinct-par-succursale.feature)                   | 8            | 9         | not run  |
| [Ajouter des produits hors suggestions](../../src/frontend/e2e/bdd/features/74533-ajouter-des-produits-hors-suggestions/74533-ajouter-des-produits-hors-suggestions.feature)                     | 12           | 19        | not run  |
| [Vue d'ensemble de la page d'achat](../../src/frontend/e2e/bdd/features/74536-vue-d-ensemble-de-la-page-d-achat/74536-vue-d-ensemble-de-la-page-d-achat.feature)                                 | 5            | 6         | not run  |
| [Consulter (et modifier) la fiche d'un achat](../../src/frontend/e2e/bdd/features/75596-consulter-et-modifier-la-fiche-d-un-achat/75596-consulter-et-modifier-la-fiche-d-un-achat.feature)       | 13           | 16        | not run  |
| [Titres à paraître](../../src/frontend/e2e/bdd/features/76025-filtre-a-paraitre/76025-filtre-a-paraitre.feature)                                                                                 | 7            | 8         | not run  |
| [Titres en attente d'un fournisseur](../../src/frontend/e2e/bdd/features/76267-titres-en-attente-d-un-fournisseur/76267-titres-en-attente-d-un-fournisseur.feature)                              | 11           | 15        | not run  |
| [Création et conservation du bon d'achat](../../src/frontend/e2e/bdd/features/76269-creation-modification-du-bon-d-achat/76269-creation-modification-du-bon-d-achat.feature)                     | 22           | 28        | not run  |
| [Sécurité](../../src/frontend/e2e/bdd/features/nfr-security/nfr-security.feature)                                                                                                               | 4            | 8         | not run  |
| [Performance](../../src/frontend/e2e/bdd/features/nfr-performance/nfr-performance.feature)                                                                                                      | 1            | 4         | not run  |
| [Accessibilité](../../src/frontend/e2e/bdd/features/nfr-accessibility/nfr-accessibility.feature)                                                                                                | 2            | 2         | not run  |
| [Localisation](../../src/frontend/e2e/bdd/features/nfr-localization/nfr-localization.feature)                                                                                                   | 4            | 6         | not run  |
| [Observabilité](../../src/frontend/e2e/bdd/features/nfr-observability/nfr-observability.feature)                                                                                                | 2            | 3         | not run  |
| [Autres exigences](../../src/frontend/e2e/bdd/features/nfr-other/nfr-other.feature)                                                                                                             | 2            | 2         | not run  |