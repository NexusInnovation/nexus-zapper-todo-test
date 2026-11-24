---
status: approved
features-path: src/frontend/e2e/features
run-command: pnpm --dir src/frontend bdd
result-format: cucumber-json
result-file: results/cucumber.json
---

# BDD suite

Executable definition of "done" for this Zapper generation, maintained by the
`generate-bdd-zapper` skill. Once the suite is approved, the `.feature` files are read-only to
agents: change them through the skill, which sets the status back to `draft` first.

## Execution

The features location, run command, result format and result file are the frontmatter fields
above. Run the command from the repository root.

- **Runner**: [playwright-bdd](https://vitalets.github.io/playwright-bdd/) on `@playwright/test`
  (Chromium), configured in `src/frontend/playwright.config.ts` (`language: 'fr'`).
- **Test project**: `src/frontend` (`pnpm bdd` = `bddgen && playwright test`); the features live in
  `src/frontend/e2e/features/<story>/<story>.feature`, and the generated specs in
  `src/frontend/.features-gen/` are ignored by git.
- **Glue**: step definitions and hooks go in `src/frontend/e2e/steps/`, importing `Given`, `When`,
  `Then`, `BeforeScenario` and `AfterScenario` from `e2e/steps/fixtures.ts`.
- **Excluded**: scenarios tagged `@manual` (`tags: 'not @manual'` in the config).
- **Single requirement**: `pnpm --dir src/frontend bdd --grep "@77078-R02( |$)"` (replace the tag).
- **Missing steps**: `missingSteps: 'fail-on-run'` reports each scenario with an undefined step as
  failed on `Missing step: …` (the runner's `undefined`) and the command exits non-zero.
- **Results**: Cucumber JSON written to `results/cucumber.json` (ignored by git); the previous file
  is overwritten on each run.

## Stories

| Story                                                                                                                    | Requirements | Scenarios | Last run |
| ------------------------------------------------------------------------------------------------------------------------ | ------------ | --------- | -------- |
| [Créer un Todo](../../src/frontend/e2e/features/77078-creer-un-todo/77078-creer-un-todo.feature)                                                 | 8            | 10        | not run  |
| [Consulter la liste des Todos](../../src/frontend/e2e/features/77079-consulter-la-liste-des-todos/77079-consulter-la-liste-des-todos.feature)    | 6            | 7         | not run  |
| [Modifier le titre d'un Todo](../../src/frontend/e2e/features/77080-modifier-le-titre-d-un-todo/77080-modifier-le-titre-d-un-todo.feature)       | 8            | 9         | not run  |
| [Cocher et décocher un Todo](../../src/frontend/e2e/features/77080-cocher-et-decocher-un-todo/77080-cocher-et-decocher-un-todo.feature)          | 5            | 7         | not run  |
| [Supprimer un Todo](../../src/frontend/e2e/features/77081-supprimer-un-todo/77081-supprimer-un-todo.feature)                                     | 7            | 8         | not run  |
| [Non-functional: Security](../../src/frontend/e2e/features/nfr-security/nfr-security.feature)                                                    | 2            | 3         | not run  |
| [Non-functional: Performance](../../src/frontend/e2e/features/nfr-performance/nfr-performance.feature)                                           | 1            | 2         | not run  |
| [Non-functional: Accessibility](../../src/frontend/e2e/features/nfr-accessibility/nfr-accessibility.feature)                                     | 1            | 6         | not run  |
| [Non-functional: Localization](../../src/frontend/e2e/features/nfr-localization/nfr-localization.feature)                                        | 1            | 4         | not run  |
| [Non-functional: Other](../../src/frontend/e2e/features/nfr-other/nfr-other.feature)                                                             | 1            | 1         | not run  |
