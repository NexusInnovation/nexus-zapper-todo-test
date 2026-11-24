# Decisions

Major decisions of this plan: architecture and dependencies, schema and contract changes, data access
paths, security-relevant choices, required infrastructure, and the scope boundaries. The plan proposes
each choice; only the team approves or rejects it. Approving the plan is the human approval of these
decisions: nothing is approved during the run.

## D01: Périmètre : une page « Mes Todos » à la racine

- **Status**: approved
- **Category**: scope
- **Decision**: **Dans le périmètre** : la page « Mes Todos » sur la route `/` (route index, à la
  place de `DashboardPage`), avec création, liste paginée, case « Fait », édition du titre en ligne
  et suppression confirmée; l'entrée de navigation « Mes Todos » (`/`) remplace « Dashboard »; le
  module frontend `src/modules/todos/` et l'espace de noms i18n `todos` (fr, en); le français comme
  langue par défaut; le module d'API `/api/todos` (List, Find, Create, Update, Delete); la table
  `dbo.Todo` du projet `Nexus.ZapperTodo.Database`; le câblage de la suite BDD et son jeu de volume.
  **Hors périmètre** : le tableau de bord comme page (plus routé), les pages standard
  `/todos/create` et `/todos/:id` (l'édition est en ligne), l'authentification et les listes par
  utilisateur, le filtrage, la recherche, le tri, la réorganisation, les actions groupées, les
  échéances, priorités et étiquettes, la migration du `localStorage` du prototype, `infra/` et
  `pipelines/`. Les pages `/404` et `/healthcheck` restent inchangées.
- **Alternatives**: Route `/todos` à côté du tableau de bord (contredit la décision d'équipe notée à
  l'inventaire de régression RG-01); pages de création et de modification séparées du standard
  launchpad (contredit les maquettes et le prototype).
- **Reasoning**: Reprend `.zapper/input/scope.md`, les maquettes et la décision d'équipe « la liste
  remplace le tableau de bord à `/` ».
- **Affected blocks**: [Page Mes Todos](todo-page/todo-page.md),
  [Édition d'un Todo](todo-item-edit/todo-item-edit.md),
  [Suppression d'un Todo](todo-item-delete/todo-item-delete.md),
  [Qualité transverse](todo-quality/todo-quality.md)
- **Approval**: Eric De Carufel, 2026-11-24

## D02: Contrat HTTP de `/api/todos`, liste paginée

- **Status**: approved
- **Category**: schema-contract
- **Decision**: Module `todos` selon la matrice launchpad, sauf la liste :
  `GET /api/todos?page={n}&pageSize={m}` (page à partir de 1, taille par défaut 50, maximum 100)
  renvoie `200 { items: TodoDto[], totalCount }`, trié par ordre de création croissant.
  `GET /api/todos/{id:guid}` → `200 TodoDto` ou `404`; `POST /api/todos { title }` → `201`, en-tête
  `Location` = Id, sans corps; `PUT /api/todos/{id:guid} { title, isDone }` → `200 TodoDto`;
  `DELETE /api/todos/{id:guid}` → `204`. `TodoDto = { id, title, isDone, createdAt }`. Erreurs :
  `404` `ProblemDetails` avec `errorCode` pour un Id absent ou supprimé, `422`
  `ValidationProblemDetails` (`errors.title`) pour un titre vide ou de plus de 200 caractères après
  retrait des espaces, `400` pour un Id mal formé.
- **Alternatives**: Liste en tableau nu du standard (charge 100 000 lignes, viole
  nfr-performance-R01); pagination par curseur (plus complexe, inutile à ce volume); `PATCH` séparés
  pour le titre et l'état (s'écarte du standard sans besoin).
- **Reasoning**: Seul écart au standard : la page et le total exigés par le scénario de performance.
- **Affected blocks**: [API Todos](todo-api/todo-api.md), [Page Mes Todos](todo-page/todo-page.md),
  [Édition d'un Todo](todo-item-edit/todo-item-edit.md),
  [Suppression d'un Todo](todo-item-delete/todo-item-delete.md)
- **Approval**: Eric De Carufel, 2026-11-24

## D03: Table `dbo.Todo` et index de l'ordre de création

- **Status**: approved
- **Category**: schema-contract
- **Decision**: Nouvelle table `dbo.Todo` dans le projet SSDT : colonnes de `BaseEntity` (Id
  `uniqueidentifier` clé primaire, audit, trio de suppression logique), `Title nvarchar(200) not
  null`, `IsDone bit not null default 0`; index non cluster filtré `(CreatedAt, Id) WHERE IsDeleted
  = 0 INCLUDE (Title, IsDone)` qui sert la page et le décompte.
- **Alternatives**: Colonne `IDENTITY` de séquence pour l'ordre (ajoute une colonne hors standard);
  aucun index (balayage de 100 000 lignes à chaque page).
- **Reasoning**: Zone critique « schéma de base de données »; l'index rend la page et le total
  rapides sur le jeu de volume.
- **Affected blocks**: [API Todos](todo-api/todo-api.md)
- **Approval**: Eric De Carufel, 2026-11-24

## D04: Accès aux données par un dépôt Dapper typé, suppression logique

- **Status**: approved
- **Category**: data-access
- **Decision**: `ITodoRepository` (Domain) étend `IRepository<Todo>` d'une lecture paginée;
  `TodoRepository` (Infrastructure) hérite de `DapperRepository<Todo>` et exécute une requête SQL
  `OFFSET/FETCH` triée par `CreatedAt, Id` et un `COUNT` filtré sur `IsDeleted = 0`. Écritures par
  les méthodes héritées; la suppression est logique (`DeleteAsync` existant). Aucune procédure
  stockée, aucun système hérité.
- **Alternatives**: Procédure stockée pour la page (hors conventions); suppression physique
  (contredit le standard de suppression logique).
- **Reasoning**: Suit `backend-data-access.md`; seule la lecture paginée est écrite à la main.
- **Affected blocks**: [API Todos](todo-api/todo-api.md)
- **Approval**: Eric De Carufel, 2026-11-24

## D05: Application anonyme et utilisateur d'audit fixe

- **Status**: approved
- **Category**: security
- **Decision**: Aucune authentification ni politique d'autorisation. L'API enregistre une
  implémentation de `IAuthenticatedUserService` qui renvoie la valeur fixe `anonymous` pour les
  champs d'audit. CORS reste piloté par `Cors:AllowedOrigins`. Les titres sont stockés tels quels et
  rendus comme du texte par React (aucun `dangerouslySetInnerHTML`, aucun encodage côté serveur).
- **Alternatives**: Brancher Entra ID (hors périmètre, confirmé par l'équipe); laisser les champs
  d'audit vides (le dépôt générique exige le service).
- **Reasoning**: Zone critique `Application/Authentication`; la dépendance manquante empêche
  aujourd'hui de résoudre tout dépôt.
- **Affected blocks**: [API Todos](todo-api/todo-api.md), [Page Mes Todos](todo-page/todo-page.md)
- **Approval**: Eric De Carufel, 2026-11-24

## D06: Accès direct à la base de test par `mssql`

- **Status**: approved
- **Category**: dependency
- **Decision**: Ajouter le paquet npm `mssql` en dépendance de développement du frontend. Les
  fixtures BDD l'utilisent pour remettre `dbo.Todo` à zéro avant chaque scénario et pour charger le
  jeu de 100 000 Todos par un `INSERT … SELECT` ensembliste; la suite s'exécute avec un seul worker.
- **Alternatives**: Points d'API réservés aux tests (surface de production à protéger); outil
  console .NET lancé à chaque scénario (lent); `sqlcmd` (absent de l'image du runner).
- **Reasoning**: Isolation des scénarios (« aucun Todo ») et chargement rapide du volume sans code
  de production.
- **Affected blocks**: [BDD runner](bdd-runner/bdd-runner.md), [API Todos](todo-api/todo-api.md)
- **Approval**: Eric De Carufel, 2026-11-24

## D07: Analyse d'accessibilité automatique par axe

- **Status**: approved
- **Category**: dependency
- **Decision**: Ajouter `@axe-core/playwright` en dépendance de développement du frontend pour le
  scénario « aucune violation WCAG 2.1 AA détectable automatiquement » (balises `wcag2a`, `wcag2aa`,
  `wcag21a`, `wcag21aa`).
- **Alternatives**: Injecter `axe-core` à la main (même dépendance, plus de code); seul audit manuel
  (le scénario exige une analyse automatique).
- **Reasoning**: Outil de référence pour Playwright, sans code applicatif.
- **Affected blocks**: [Qualité transverse](todo-quality/todo-quality.md)
- **Approval**: Eric De Carufel, 2026-11-24

## D08: Liste paginée par « Afficher plus » sur une liste MUI simple

- **Status**: approved
- **Category**: architecture
- **Decision**: La page charge la première page (50 Todos) et le total, puis ajoute la page suivante
  sur le bouton « Afficher plus » (`useInfiniteQuery` de React Query), tant qu'il reste des Todos.
  Les lignes sont rendues par une liste MUI simple (`List`), fidèle aux maquettes, sans
  `AppDataGrid`.
- **Alternatives**: `AppDataGrid` en pagination serveur (s'écarte des maquettes, édition en ligne
  difficile); défilement infini (moins prévisible au clavier); virtualisation seule (exige quand
  même la pagination serveur).
- **Reasoning**: Satisfait le seuil de 2 secondes sans contredire « chaque Todo s'affiche, du plus
  ancien au plus récent » : tous restent accessibles, page après page.
- **Affected blocks**: [Page Mes Todos](todo-page/todo-page.md)
- **Approval**: Eric De Carufel, 2026-11-24

## D09: Aucune infrastructure nouvelle

- **Status**: approved
- **Category**: infra
- **Decision**: Aucun changement à `infra/` ni à `pipelines/` (chemins protégés). La table vit dans
  le projet SSDT, publié par `runner.setup` dans le runner et à la main en local. Le déploiement du
  dacpac vers dev, uat et prod, qu'aucun pipeline ne fait aujourd'hui, est un suivi hors du run.
- **Alternatives**: Ajouter une étape de publication du dacpac aux pipelines (chemin protégé, hors
  périmètre).
- **Reasoning**: Le run n'a besoin que de la base du runner; l'écart de déploiement est signalé.
- **Affected blocks**: [BDD runner](bdd-runner/bdd-runner.md), [API Todos](todo-api/todo-api.md)
- **Approval**: Eric De Carufel, 2026-11-24
