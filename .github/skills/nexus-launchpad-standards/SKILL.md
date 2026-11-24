---
name: nexus-launchpad-standards
description:
  "Consolidated Nexus launchpad application construction standards (React TypeScript frontend + .NET clean architecture Web API + SQL Server), extracted from the launchpad plugin skills and kept in this repository as a self-contained reference.
  USE FOR: architecture conventions, project structure, naming, YAML input model and type mapping, CQRS command handling, Dapper repositories and unit of work, SQL database project, API endpoints and HTTP semantics, ProblemDetails error handling, Entra ID auth, React file structure, React Query hooks, forms, data grid, i18n, routing, layout, linting, testing, module CRUD operation contracts, local dev environment, checking code against the Nexus standards.
  DO NOT USE FOR: executing a scaffolding workflow (use the matching *-launchpad action skill when enabled), Azure DevOps pipelines (use pipelines-nexus), Bicep (use bicep-nexus)."
---

# Nexus Launchpad Standards

Governs how applications in this repository are built: the conventions, contracts and reference implementations of the Nexus launchpad stack (React TypeScript frontend, .NET clean architecture Web API, SQL Server), extracted from the `launchpad` plugin skills so they remain available even if those skills change or are unavailable.

This skill is not invoked directly — read the files in [`references/`](references/) for the full guidelines.

| Reference                                                       | Covers                                                                                                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [project-input-model.md](references/project-input-model.md)     | YAML input model (project, modules, system fields), type mapping, project and Azure naming                                                  |
| [backend-architecture.md](references/backend-architecture.md)   | .NET solution layout, layers, dependency injection, configuration, CORS, code style                                                         |
| [backend-cqrs.md](references/backend-cqrs.md)                   | Command handling pattern, pipeline behaviors, logging, List/Find/Create/Update/Delete commands                                              |
| [backend-data-access.md](references/backend-data-access.md)     | Dapper repositories, unit of work, soft delete, SQL database project and tables                                                             |
| [backend-api.md](references/backend-api.md)                     | Controllers and endpoints, HTTP semantics, domain exceptions, ProblemDetails, validation, Entra ID backend auth                             |
| [frontend-architecture.md](references/frontend-architecture.md) | Vite React setup, packages, file structure, aliases, linting, testing, runtime config, i18n, routing, layout, error boundary, frontend auth |
| [frontend-data-and-ui.md](references/frontend-data-and-ui.md)   | API parsing, React Query hooks, error toasts, form field atoms, module pages, data grid, dialogs                                            |
| [module-operations.md](references/module-operations.md)         | Cross-layer contract of each module operation (list, find, create, update, delete) and application composition order                        |
| [dev-environment.md](references/dev-environment.md)             | Node/nvm, VS Code launch and tasks, local SQL Server in Docker, first-time environment setup                                                |
