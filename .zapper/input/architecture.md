# Target architecture

Constraints stated by the input or confirmed by the team. This file does not design the solution:
architecture decisions belong to the plan stage.

## Stack

- Backend : C# .NET 10 Web API, architecture en couches (Api, Application, Domain, Infrastructure), CQRS maison, dépôts Dapper et unit of work, base SQL Server décrite par un projet SSDT (`Nexus.ZapperTodo.Database`), tests xUnit. Voir [src/backend](../../src/backend).
- Frontend : React 19 TypeScript avec Vite, MUI, React Query, react-hook-form, zod, i18next, pnpm, Vitest et Testing Library. Voir [src/frontend](../../src/frontend).
- Hébergement : Azure App Service et Azure SQL, Bicep dans [infra/](../../infra), pipelines Azure DevOps dans [pipelines/](../../pipelines).

## Structure and conventions

- Les conventions Nexus launchpad s'appliquent : [.github/skills/nexus-launchpad-standards/SKILL.md](../../.github/skills/nexus-launchpad-standards/SKILL.md).
- Les entités héritent de [BaseEntity](../../src/backend/Nexus.ZapperTodo.Domain/Entities/BaseEntity.cs); l'accès aux données passe par [DapperRepository](../../src/backend/Nexus.ZapperTodo.Infrastructure/Data/DapperRepository.cs) et [DapperUnitOfWork](../../src/backend/Nexus.ZapperTodo.Infrastructure/Data/DapperUnitOfWork.cs); les commandes passent par les handlers de [CommandHandling](../../src/backend/Nexus.ZapperTodo.Application/CommandHandling/Core).
- Frontend : routes dans [router.tsx](../../src/frontend/src/routes/router.tsx), navigation dans [navigation.ts](../../src/frontend/src/core/layout/navigation.ts), composants de base dans `src/components/atoms` et `src/core/components`, traductions dans `public/locales/{en,fr}`.
- L'Id d'un Todo est un GUID généré par le système (le client ne le choisit pas).

## Integrations

- Aucune intégration externe. Pas d'authentification (voir [scope.md](scope.md)).

## Diagrams

Aucun diagramme fourni.

## Open questions for the plan stage

- Le prototype persiste en `localStorage`; la cible persiste en base SQL Server via l'API. La forme exacte des endpoints (routes, codes HTTP, corps d'erreur « introuvable » et de validation) reste à définir par le plan, en suivant les standards launchpad.
- La liste doit s'afficher en moins de 2 secondes avec 100 000 Todos, et la pagination n'est pas exclue du périmètre : le plan décide comment l'atteindre (pagination, virtualisation ou autre) sans contredire les critères de la story « Consulter la liste des Todos ».
