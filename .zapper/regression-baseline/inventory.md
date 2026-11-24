# Inventory

Existing behaviour touched by the scope of `.zapper/input/`, and the existing tests that cover it.
Maintained by the `regression-baseline-zapper` skill; edit freely, re-runs keep your changes.

The code at `HEAD` is a skeleton: no Todo behaviour exists yet (the BDD suite covers it). The
existing behaviour the scope touches is the application shell the Todo page plugs into, the
language switcher it reuses, the shared UI components it may consume and the API host its endpoints
are added to.

## RG-01 — Coquille de l'application et navigation

- **Slug**: `coquille-application`
- **Kind**: screen
- **Touched by**: 77079 (modified: the Todo list « Mes Todos » replaces the dashboard at `/`, team
  decision in the walkthrough), 77078, 77080, 77081 (extended: the Todo actions live on that page)
- **Entry points**: `src/frontend/src/routes/router.tsx`, `src/frontend/src/core/layout/navigation.ts`,
  `src/frontend/src/core/layout/AppShell/` (`AppShell.tsx`, `ShellDrawer.tsx`, `ShellTopBar.tsx`),
  `src/frontend/src/core/hooks/useRoutePageTitle.ts`, `src/frontend/src/routes/pages/`
  (`DashboardPage.tsx`, `NotFoundPage.tsx`, `HealthcheckPage.tsx`)
- **Behaviour today**: l'accueil affiche le tableau de bord dans la coquille (navigation principale,
  barre supérieure, titre d'onglet « Zapper Todo | Dashboard »); une adresse inconnue mène à la page
  « 404 »; la page de vérification de disponibilité affiche « alive »; sur écran étroit, la
  navigation s'ouvre par un bouton de menu.
- **Changed by the scope**: the home page `/` shows the Todo list instead of the dashboard, so the
  « Dashboard » heading, its navigation item and the « Zapper Todo | Dashboard » tab title may
  change (77079-R01); not protected by a scenario, and `app.smoke.test.tsx` may be updated.
- **Existing tests**:
  - `src/frontend/src/test/app.smoke.test.tsx`: the default route renders the « Dashboard » heading,
    the « Dashboard » link is the current page, the primary navigation is present and the tab title
    is « Zapper Todo | Dashboard »
  - `src/frontend/src/test/error-boundary.test.tsx`: the application error boundary renders its
    fallback, calls `onError` and resets
- **Coverage**: partial: the 404 redirect, the availability page and the mobile navigation menu
  are asserted nowhere
- **Regression scenarios**: [coquille-application.feature](areas/coquille-application/coquille-application.feature)

## RG-02 — Sélecteur de langue

- **Slug**: `selecteur-de-langue`
- **Kind**: screen
- **Touched by**: nfr-localization (modified: French becomes the default language; the switcher is
  reused to choose English), 77078, 77079, 77080, 77081 (extended: the Todo labels are translated)
- **Entry points**: `src/frontend/src/core/layout/components/LanguageSwitcher.tsx`,
  `src/frontend/src/i18n/config.ts`, `src/frontend/src/i18n/index.ts`,
  `src/frontend/public/locales/{en,fr}/`
- **Behaviour today**: le sélecteur de la barre supérieure propose « English » et « Français »;
  choisir une langue traduit aussitôt les libellés affichés (coquille et pages, par exemple la page
  introuvable).
- **Changed by the scope**: the default language is English today and becomes French
  (nfr-localization-R01); not protected by a scenario.
- **Existing tests**: none
- **Coverage**: uncovered: no test switches the language
- **Regression scenarios**: [selecteur-de-langue.feature](areas/selecteur-de-langue/selecteur-de-langue.feature)

## RG-03 — Composants partagés de l'interface

- **Slug**: `composants-partages`
- **Kind**: module
- **Touched by**: 77081 (shared code consumed: the delete confirmation can reuse `ConfirmDialog`),
  77079 (shared code consumed: the list can reuse `AppDataGrid` and its empty state)
- **Entry points**: `src/frontend/src/core/components/molecules/ConfirmDialog/ConfirmDialog.tsx`,
  `src/frontend/src/core/components/molecules/AppDataGrid/` (`AppDataGrid.tsx`,
  `DataGridEmptyState.tsx`)
- **Behaviour today**: la boîte de confirmation affiche un titre, un message et deux boutons, appelle
  la confirmation ou l'annulation et désactive ses boutons pendant la confirmation; la grille
  affiche ses lignes, ou un message vide quand elle n'a aucune ligne et ne charge pas.
- **Changed by the scope**: none
- **Existing tests**:
  - `src/frontend/src/core/components/molecules/ConfirmDialog/ConfirmDialog.test.tsx`: renders
    title, message and labels when open, nothing when closed, calls `onConfirm` and `onCancel`,
    disables both buttons while confirming
  - `src/frontend/src/core/components/molecules/AppDataGrid/AppDataGrid.test.tsx`: renders the
    rows, the empty message when empty, no empty message while loading
- **Coverage**: covered: the tests assert every observable behaviour of both components
- **Regression scenarios**: none: covered by existing tests

## RG-04 — Hôte de l'API et accès aux données

- **Slug**: `hote-api`
- **Kind**: endpoint
- **Touched by**: 77078, 77079, 77080, 77081 (shared code consumed: the Todo endpoints are added to
  the API host and use the registered Dapper repository and unit of work; the Todo table is added
  to the database project)
- **Entry points**: `src/backend/Nexus.ZapperTodo.Api/Program.cs`,
  `src/backend/Nexus.ZapperTodo.Api/ConfigureServices.cs`,
  `src/backend/Nexus.ZapperTodo.Infrastructure/ConfigureServices.cs`, `GET /api/health`
- **Behaviour today**: l'API expose un point de santé qui répond « Healthy »; l'infrastructure
  enregistre la fabrique de connexions, l'unité de travail et le dépôt générique Dapper.
- **Changed by the scope**: none
- **Existing tests**:
  - `src/backend/tests/Nexus.ZapperTodo.UnitTests/Infrastructure/InfrastructureServiceRegistrationTests.cs`:
    registers the connection factory, the scoped unit of work and the generic repository, and no
    `IDbConnection`
- **Coverage**: partial: the health endpoint is asserted nowhere
- **Regression scenarios**: [hote-api.feature](areas/hote-api/hote-api.feature)
