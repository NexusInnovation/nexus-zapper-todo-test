# Page Mes Todos

## Purpose

Livre la page « Mes Todos » à la racine `/` de la coquille : liste paginée des Todos du serveur,
état vide, « Afficher plus » et formulaire de création. Elle fixe le contrat de ligne, de cache et
de validation du titre que les blocs d'édition, de suppression et de qualité étendent.

## Requirements

- 77078-R01…77078-R08, 77079-R01…77079-R06, nfr-performance-R01, nfr-security-R01,
  nfr-security-R02

## Scenarios

Write the step definitions of these scenarios, reusing the shared steps of the BDD runner block, and
run them by tag until they pass.

- [77078-creer-un-todo.feature](../../../../src/frontend/e2e/features/77078-creer-un-todo/77078-creer-un-todo.feature):
  `@77078-R01`, `@77078-R02`, `@77078-R03`, `@77078-R04`, `@77078-R05`, `@77078-R06`, `@77078-R07`,
  `@77078-R08`
- [77079-consulter-la-liste-des-todos.feature](../../../../src/frontend/e2e/features/77079-consulter-la-liste-des-todos/77079-consulter-la-liste-des-todos.feature):
  `@77079-R01`, `@77079-R02`, `@77079-R03`, `@77079-R04`, `@77079-R05`, `@77079-R06`
- [nfr-performance.feature](../../../../src/frontend/e2e/features/nfr-performance/nfr-performance.feature):
  `@nfr-performance-R01`
- [nfr-security.feature](../../../../src/frontend/e2e/features/nfr-security/nfr-security.feature):
  `@nfr-security-R01`, `@nfr-security-R02`

## Depends on

- [BDD runner](../bdd-runner/bdd-runner.md): serveurs Vite et API, `API_URL` et CORS de test,
  remise à zéro de `dbo.Todo`, URL de base de l'API de test, un seul worker.
- [API Todos](../todo-api/todo-api.md): contrat HTTP de [D02](../decisions.md), règles du titre,
  étapes de données de test par l'API, aide de lecture des Todos, étape du jeu de volume.

## Contracts and invariants

- **Route et coquille** ([D01](../decisions.md)) : la page est la route index `/`, chargée à la
  demande, rendue dans la coquille existante; l'entrée de navigation « Mes Todos » (`/`) remplace
  « Dashboard », dont la page n'est plus routée. Titre principal de niveau 1 « Mes Todos » et
  onglet « Zapper Todo | Mes Todos » (traduits). `/404` et `/healthcheck` ne changent pas.
- **Résilience** : un échec de l'appel à l'API n'empêche jamais le rendu de la coquille ni du
  formulaire; la liste affiche un message d'erreur traduit à la place des lignes, sans passer par la
  limite d'erreur globale (le Contexte de régression ouvre `/` en anglais).
- **Langues** : espace de noms i18n `todos` (fr, en); le français devient la langue par défaut
  (`defaultLanguage` `'fr'`), l'anglais en est la traduction directe; aucun libellé en dur.
- **Module `src/modules/todos/`** selon les standards : type `Todo` = `TodoDto` de D02 et schéma zod
  du titre; client d'API sur `GlobalConfig.API_URL` + `parseResponse`; requête infinie de clé
  `['todos']` (pages de 50 par `page`/`pageSize`, total `totalCount`); mutation de création. Le
  `QueryProvider` des standards est branché dans le point d'entrée; les erreurs de requête restent
  locales à la page.
- **Contrat de cache** (consommé par l'édition et la suppression) : le cache `['todos']` reflète
  l'état du serveur; toute mutation le met à jour en place ou l'invalide, sans jamais perdre les
  pages déjà affichées ni dupliquer une ligne. Les lignes sont uniques par `id` sur l'ensemble des
  pages.
- **Création** : `POST { title }` puis lecture du Todo créé par son Id (`Location`) ; le Todo du
  serveur s'ajoute en fin de liste affichée, même si toutes les pages ne sont pas chargées, et le
  total augmente d'un; un « Afficher plus » ultérieur ne le duplique pas. Règle de fusion (seule
  définition, appliquée à toute invalidation ou recharge de `['todos']`, y compris par l'édition et
  la suppression) : les Todos ajoutés localement au-delà des pages chargées restent affichés en fin
  de liste après un rechargement des pages par décalage, jusqu'à ce qu'une page lue du serveur les
  contienne (dédoublonnage par `id`); un Todo supprimé en sort. Succès : champ vidé, erreur
  effacée, focus conservé dans le champ.
- **Validation du titre** (partagée avec l'édition) : règles du schéma zod identiques au serveur
  (retrait des espaces, obligatoire, 200 caractères au plus après retrait). Clés i18n partagées :
  « Le titre est obligatoire. » et « Le titre ne peut pas dépasser 200 caractères. ». Une réponse
  `422` du serveur (`errors.title`) affiche le message traduit de la règle violée, jamais le texte
  brut du serveur; aucun Todo n'est ajouté au cache sur un refus.
- **Formulaire** : champ étiqueté « Titre du Todo », texte indicatif « Nouveau Todo… », bouton
  « Ajouter »; Entrée soumet; l'erreur s'affiche sous le champ avec `role="alert"` et lie le champ
  (`aria-invalid`, description).
- **Contrat de ligne** (consommé par l'édition, la suppression et la qualité) : liste MUI simple
  ([D08](../decisions.md)); chaque Todo est un élément `role="listitem"` portant `data-todo-id`,
  dans l'ordre de création; le titre est un nœud texte (jamais de HTML), barré et grisé si fait,
  sinon normal, et passe à la ligne sans déborder; une case reflète `isDone`, nom accessible
  contenant « Fait »; une zone d'actions en fin de ligne reçoit les contrôles des blocs 4-5.
- **État vide et suite** : « Aucun Todo pour l'instant. » quand le total vaut 0, retiré dès qu'une
  ligne existe; bouton « Afficher plus » visible seulement tant que les lignes chargées sont moins
  nombreuses que le total, désactivé pendant le chargement de la page suivante.
- **Étapes partagées** (définies ici une seule fois, réutilisées par les blocs 4 à 6) :
  « j'ouvre la liste des Todos », « je recharge la page », « je crée un Todo avec le titre « X » »,
  « je crée un Todo avec un titre vide », « le Todo « X » apparaît dans la liste »,
  « le message « Aucun Todo pour l'instant. » s'affiche », « le titre « X » est barré et grisé »,
  « le titre « X » n'est ni barré ni grisé », « la page s'intitule « Mes Todos » », plus une aide de
  localisation de ligne par titre et par Id. « j'ouvre la liste des Todos » note l'instant de la
  navigation et observe les appels de liste, puis attend la fin du premier chargement (lignes, état
  vide ou erreur). Données de test et lecture des Todos : API Todos; étapes de langue de régression
  réutilisées. Le découpage interne est laissé à l'implémenteur.

## Non-functional strategy

- nfr-performance-R01 : la page ne demande que la première page (50) et le total
  ([D02](../decisions.md)), servie par l'index filtré de [D03](../decisions.md) via le dépôt paginé
  de l'[API Todos](../todo-api/todo-api.md); les pages suivantes ne viennent qu'au clic
  « Afficher plus » ([D08](../decisions.md)). Aucun préchargement ni requête de toute la liste. Le
  seuil de 2 s est mesuré de la navigation à la première ligne visible, sur 100 000 Todos, serveurs
  chauds; le second scénario vérifie un seul appel de liste, une page de taille bornée et le total
  de 100 000.
- nfr-security-R01 : aucune authentification ([D05](../decisions.md)); un contexte neuf ouvre `/`
  sans redirection ni invite de connexion.
- nfr-security-R02 : le titre est rendu uniquement comme texte par React (aucun
  `dangerouslySetInnerHTML`, aucun rendu Markdown ou HTML), stocké tel quel par le serveur; les
  scénarios vérifient le texte littéral, l'absence d'élément mis en forme dans la ligne et l'absence
  de boîte de dialogue ou d'exécution. La validation serveur s'applique quel que soit le client.

## Touchpoints

### Modules and components

- Module `todos` (nouveau) : types, schéma, client d'API, requêtes, page et ses composants.
- Routage, navigation, titre d'onglet et i18n : [router.tsx](../../../../src/frontend/src/routes/router.tsx),
  [navigation.ts](../../../../src/frontend/src/core/layout/navigation.ts),
  [useRoutePageTitle.ts](../../../../src/frontend/src/core/hooks/useRoutePageTitle.ts),
  [config.ts](../../../../src/frontend/src/i18n/config.ts) et `public/locales/{fr,en}/todos.json`.
- [main.tsx](../../../../src/frontend/src/main.tsx) reçoit le `QueryProvider`; atomes existants
  [TextField](../../../../src/frontend/src/components/atoms/textfield/TextField.tsx) et [Form](../../../../src/frontend/src/components/atoms/form/Form.tsx).

### Frontend pages

- Mes Todos (`/`) : formulaire de création, liste, état vide, « Afficher plus ».

### API endpoints

| Method | Route                  | Parameters                          | Response                | Purpose           |
| ------ | ---------------------- | ----------------------------------- | ----------------------- | ----------------- |
| GET    | `/api/todos`           | query: `page: int`, `pageSize: int` | `{ items, totalCount }` | Page de la liste  |
| GET    | `/api/todos/{id:guid}` | path: `id: guid`                    | `TodoDto`               | Lire le Todo créé |
| POST   | `/api/todos`           | body: `title: string`               | `201`, `Location` = Id  | Créer un Todo     |

### Data

| Entity or table | Access            | Source system        |
| --------------- | ----------------- | -------------------- |
| `dbo.Todo`      | read, write (API) | new (bloc API Todos) |

## Conventions and references

- Skill `nexus-launchpad-standards` ([SKILL.md](../../../../.github/skills/nexus-launchpad-standards/SKILL.md)) :
  `frontend-architecture` (structure, i18n, routage, coquille), `frontend-data-and-ui` (hooks React
  Query, `QueryProvider`, atomes, clés i18n de module), `module-operations` (conventions frontend).
- [parseResponse.ts](../../../../src/frontend/src/core/api/parseResponse.ts) et
  [config.ts](../../../../src/frontend/src/core/config/config.ts) : analyse des réponses et URL d'API.
- La case « Fait » est rendue ici en lecture de l'état (exigée par `@77079-R02`); le
  bloc [Édition d'un Todo](../todo-item-edit/todo-item-edit.md) la rend interactive.
- La création lit l'Id dans `Location`, que l'[API Todos](../todo-api/todo-api.md) expose en CORS.

## Completion evidence

- Les scénarios des tags possédés passent par la commande d'un seul tag; la régression
  (`pnpm --dir src/frontend regression`) reste verte avec `/` affichant la page en anglais.
- Lint, build et Vitest passent; des tests ciblés couvrent le schéma du titre et la fusion du cache
  (ajout en fin, sans doublon); [app.smoke.test.tsx](../../../../src/frontend/src/test/app.smoke.test.tsx)
  est adapté à « Mes Todos » (écart signalé).
