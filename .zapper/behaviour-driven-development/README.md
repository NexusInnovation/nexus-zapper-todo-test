---
status: approved
features-path: .zapper/behaviour-driven-development/stories
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

| Story                                                                                                                    | Requirements | Scenarios | Last run |
| ------------------------------------------------------------------------------------------------------------------------ | ------------ | --------- | -------- |
| [Créer un Todo](stories/77078-creer-un-todo/77078-creer-un-todo.feature)                                                 | 8            | 10        | not run  |
| [Consulter la liste des Todos](stories/77079-consulter-la-liste-des-todos/77079-consulter-la-liste-des-todos.feature)    | 6            | 7         | not run  |
| [Modifier le titre d'un Todo](stories/77080-modifier-le-titre-d-un-todo/77080-modifier-le-titre-d-un-todo.feature)       | 8            | 9         | not run  |
| [Cocher et décocher un Todo](stories/77080-cocher-et-decocher-un-todo/77080-cocher-et-decocher-un-todo.feature)          | 5            | 7         | not run  |
| [Supprimer un Todo](stories/77081-supprimer-un-todo/77081-supprimer-un-todo.feature)                                     | 7            | 8         | not run  |
| [Non-functional: Security](stories/nfr-security/nfr-security.feature)                                                    | 2            | 3         | not run  |
| [Non-functional: Performance](stories/nfr-performance/nfr-performance.feature)                                           | 1            | 2         | not run  |
| [Non-functional: Accessibility](stories/nfr-accessibility/nfr-accessibility.feature)                                     | 1            | 6         | not run  |
| [Non-functional: Localization](stories/nfr-localization/nfr-localization.feature)                                        | 1            | 4         | not run  |
| [Non-functional: Other](stories/nfr-other/nfr-other.feature)                                                             | 1            | 1         | not run  |
