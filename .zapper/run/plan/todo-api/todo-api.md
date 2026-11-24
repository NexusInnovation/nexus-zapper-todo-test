# API Todos

## Purpose

Livre le module d'API REST `/api/todos` et sa table `dbo.Todo` selon les standards launchpad, ainsi
que les données de test partagées de la suite BDD (étapes par l'API, lecture, jeu de volume).

## Requirements

- 77080-cocher-et-decocher-un-todo-R05, 77080-R06, 77081-R06

## Scenarios

Write the step definitions of these scenarios, reusing the shared steps of the BDD runner block, and
run them by tag until they pass.

- [77080-cocher-et-decocher-un-todo.feature](../../../../src/frontend/e2e/features/77080-cocher-et-decocher-un-todo/77080-cocher-et-decocher-un-todo.feature):
  `@77080-cocher-et-decocher-un-todo-R05`
- [77080-modifier-le-titre-d-un-todo.feature](../../../../src/frontend/e2e/features/77080-modifier-le-titre-d-un-todo/77080-modifier-le-titre-d-un-todo.feature):
  `@77080-R06`
- [77081-supprimer-un-todo.feature](../../../../src/frontend/e2e/features/77081-supprimer-un-todo/77081-supprimer-un-todo.feature):
  `@77081-R06`

## Depends on

- [BDD runner](../bdd-runner/bdd-runner.md) : serveurs de test, URL de l'API de test, fixture
  `mssql` et remise à zéro de `dbo.Todo` avant chaque scénario, consommés sans redéfinition.

## Contracts and invariants

- **Contrat HTTP** ([D02](../decisions.md), défini ici, consommé par
  [Page Mes Todos](../todo-page/todo-page.md), [Édition](../todo-item-edit/todo-item-edit.md) et
  [Suppression](../todo-item-delete/todo-item-delete.md)) : routes, codes et formes du tableau des
  points d'API ci-dessous. `TodoDto = { id, title, isDone, createdAt }` en JSON camelCase. Toute
  réponse de liste porte `items` et `totalCount`; `totalCount` compte tous les Todos non supprimés.
- **Pagination** : `page` commence à 1, `pageSize` vaut 50 par défaut, au plus 100. Une page au-delà
  de la dernière renvoie `items` vide et le vrai `totalCount`. Le tri est l'ordre de création :
  `CreatedAt` croissant puis `Id`, stable d'une page à l'autre. Une page < 1 ou une taille
  hors de 1…100 est refusée en `422` (`errors.page`, `errors.pageSize`), jamais tronquée en silence.
- **Règles du domaine** : le titre est débarrassé de ses espaces de début et de fin avant toute
  validation et avant d'être stocké; vide après ce retrait → refusé (requis); plus de 200
  caractères après ce retrait → refusé (200 accepté). Le contenu est stocké tel quel, sans encodage
  ni filtrage HTML (le rendu en texte relève du frontend, [D05](../decisions.md)). Les doublons de
  titre sont permis. À la création, `IsDone` est faux, l'`Id` est un GUID généré par le serveur et
  `CreatedAt` vient de `TimeProvider`. Mêmes règles à la création et à la modification.
- **Erreurs** (gestionnaires `IExceptionHandler` globaux du standard, aucun try/catch dans le
  contrôleur; codes déclarés une seule fois dans `DomainErrors`) :
  - `404` `ProblemDetails` avec l'extension `errorCode` = `errors.todo.notFound` pour un Id
    inexistant **ou** supprimé logiquement, en `GET`, `PUT` et `DELETE`. Un `DELETE` répété sur le
    même Id renvoie `404`. Le `DeleteAsync` hérité revient en silence sur un Id absent : le
    traitement de la suppression vérifie donc l'existence avant de supprimer.
  - `422` `ValidationProblemDetails` dont `errors.title` contient `errors.todo.titleRequired` ou
    `errors.todo.titleTooLong`, codes que les blocs frontend associent aux messages « Le titre est
    obligatoire. » et « Le titre ne peut pas dépasser 200 caractères. ». Une requête refusée ne crée
    ni ne modifie aucun Todo.
  - `400` pour un Id non GUID dans la route ou un corps JSON illisible. En `PUT`, la validation du
    corps précède la recherche de l'Id : corps valide sur un Id inexistant → `404`, jamais `422`.
- **Écriture** : `PUT` remplace `title` et `isDone` ensemble et renvoie le Todo mis à jour (sans
  seconde requête); il ne touche ni l'`Id`, ni `CreatedAt`, ni aucun autre Todo. La dernière
  écriture l'emporte : aucun contrôle de concurrence optimiste, aucun jeton de version.
- **Persistance** ([D03](../decisions.md), [D04](../decisions.md)) : table `dbo.Todo` avec les
  colonnes de `BaseEntity`, `Title nvarchar(200) not null`, `IsDone bit not null default 0`, et
  l'index non cluster filtré `(CreatedAt, Id) WHERE IsDeleted = 0 INCLUDE (Title, IsDone)`.
  `ITodoRepository` ajoute à `IRepository<Todo>` une seule lecture paginée (page + total) en SQL
  paramétré `OFFSET/FETCH` trié par `CreatedAt, Id` et un `COUNT` filtré sur `IsDeleted = 0`, tous
  deux servis par cet index. Toutes les lectures excluent les lignes supprimées; la suppression est
  logique; aucune procédure stockée. `CreatedAt` en `datetime2` ordonne des créations successives.
- **Utilisateur anonyme** ([D05](../decisions.md)) : `IAuthenticatedUserService` renvoie
  `anonymous`; aucune authentification ni autorisation. CORS reste piloté par `Cors:AllowedOrigins`
  et expose l'en-tête `Location` (`Access-Control-Expose-Headers`) pour la lecture cross-origin de l'Id créé.
- **Contrat de performance consommé par la page** : jamais la liste entière; chaque appel lit une
  page et le total par l'index ci-dessus. nfr-performance-R01 et sa mesure appartiennent à
  [Page Mes Todos](../todo-page/todo-page.md).
- **Jeu de volume** ([D06](../decisions.md)) : un chargeur ensembliste (`INSERT … SELECT`, ni boucle
  ligne à ligne ni appels d'API) écrit 100 000 Todos non supprimés aux `CreatedAt` strictement
  croissants, titres distincts, une partie faits, audit à `anonymous`. Il vide d'abord `dbo.Todo` :
  il est idempotent. Il lit `ConnectionStrings__DefaultConnection` par la fixture du BDD runner et
  il est exposé deux fois : par le script de paquet `seed:volume` du frontend
  (`pnpm --dir src/frontend seed:volume`, le `load-command` du `performance-dataset` de
  `.zapper/config.md`, lancé par `runner.setup` après le déploiement du schéma) et par l'étape
  partagée « le jeu de données de volume réaliste est chargé », qui le relance après la remise à
  zéro du scénario.
- **Étapes de données de test partagées** (définies ici une seule fois, par la fixture `request`
  de Playwright sur l'URL de l'API de test, jamais par l'interface) : « un Todo existant « X » »,
  « un Todo fait « X » », « un Todo non fait « X » », « deux Todos existants « X » », « les Todos
  suivants, créés dans cet ordre : » (table titre / fait, créations attendues une à une), « aucun
  Todo » et « c'est le seul Todo » (vérifient l'état réel par l'API). Un assistant de test exporté
  lit les Todos de l'API (id, titre, état) dans l'ordre de création, pour les assertions d'Id des
  autres blocs.
- **Étapes des scénarios « introuvable »** (définies ici) : les trois actions envoient `PUT` (corps
  valide, état « fait » ou titre changé) ou `DELETE` sur un GUID neuf jamais créé; « une erreur
  « introuvable » est retournée » vérifie `404`, un corps `ProblemDetails` et
  `errorCode` = `errors.todo.notFound`.

## Touchpoints

### Modules and components

- Domaine : entité `Todo` sur [BaseEntity](../../../../src/backend/Nexus.ZapperTodo.Domain/Entities/BaseEntity.cs),
  `ITodoRepository` à côté de [IRepository](../../../../src/backend/Nexus.ZapperTodo.Domain/Repositories/IRepository.cs),
  `DomainErrors` et hiérarchie d'exceptions du standard (absentes aujourd'hui).
- Application : commandes List/Find/Create/Update/Delete du module `Todos` sur
  [CommandHandling/Core](../../../../src/backend/Nexus.ZapperTodo.Application/CommandHandling/Core),
  validation du titre et de la pagination.
- Infrastructure : `TodoRepository` sur
  [DapperRepository](../../../../src/backend/Nexus.ZapperTodo.Infrastructure/Data/DapperRepository.cs),
  enregistré dans [ConfigureServices](../../../../src/backend/Nexus.ZapperTodo.Infrastructure/ConfigureServices.cs).
- API : `TodosController`, gestionnaires d'exceptions et `ProblemDetails` dans
  [ConfigureServices](../../../../src/backend/Nexus.ZapperTodo.Api/ConfigureServices.cs) et
  [Program.cs](../../../../src/backend/Nexus.ZapperTodo.Api/Program.cs) (ordre du standard),
  utilisateur anonyme pour
  [IAuthenticatedUserService](../../../../src/backend/Nexus.ZapperTodo.Application/Authentication/IAuthenticatedUserService.cs).
- Glue BDD sous `src/frontend/e2e/steps/` et script `seed:volume` de `src/frontend/package.json`.

### API endpoints

| Method | Route                  | Parameters                                    | Response                                    | Purpose                       |
| ------ | ---------------------- | --------------------------------------------- | ------------------------------------------- | ----------------------------- |
| GET    | `/api/todos`           | query : `page: int` (1), `pageSize: int` (50) | `200 { items: TodoDto[], totalCount }`; 422 | Page dans l'ordre de création |
| GET    | `/api/todos/{id:guid}` | route : `id`                                  | `200 TodoDto`; 404; 400                     | Lire un Todo                  |
| POST   | `/api/todos`           | body : `title: string`                        | `201`, `Location` = Id, sans corps; 422     | Créer un Todo                 |
| PUT    | `/api/todos/{id:guid}` | route : `id`; body : `title`, `isDone: bool`  | `200 TodoDto`; 404; 422; 400                | Modifier titre et état        |
| DELETE | `/api/todos/{id:guid}` | route : `id`                                  | `204`; 404; 400                             | Suppression logique           |

### Data

| Entity or table | Access                            | Source system                                              |
| --------------- | --------------------------------- | ---------------------------------------------------------- |
| `dbo.Todo`      | created, read, write, soft delete | new, projet SSDT `Nexus.ZapperTodo.Database` (`dbo/Tables`) |

## Conventions and references

- Skill `nexus-launchpad-standards` : `backend-api.md` (matrice des points d'API, `DomainErrors`,
  exceptions, `IExceptionHandler`, statuts, service d'utilisateur authentifié), `backend-cqrs.md`
  (commandes de module, validateurs, tests de gestionnaires), `backend-data-access.md` (dépôts
  typés, suppression logique, table SSDT), `module-operations.md` (contrat de bout en bout).
- [Projet SSDT](../../../../src/backend/Nexus.ZapperTodo.Database) : publié par `runner.setup`, à
  la main en local, par aucun pipeline ([D09](../decisions.md)); [D02](../decisions.md) à
  [D06](../decisions.md) s'appliquent ici.

## Completion evidence

- `@77080-cocher-et-decocher-un-todo-R05`, `@77080-R06` et `@77081-R06` passent par la commande à
  une balise du BDD runner; les scénarios d'autres blocs qui utilisent les étapes de données
  partagées et le jeu de volume s'exécutent sans étape manquante ni définition en double.
- Tests unitaires dans
  [Nexus.ZapperTodo.UnitTests](../../../../src/backend/tests/Nexus.ZapperTodo.UnitTests) : règles du
  titre (retrait des espaces, 200 accepté, 201 et vide refusés), bornes de pagination, `404` en
  modification et en suppression d'un Id absent ou supprimé, correspondance des exceptions en
  `ProblemDetails`, enregistrement des services. `seed:volume` charge 100 000 lignes;
  `pnpm --dir src/frontend regression` passe toujours.
