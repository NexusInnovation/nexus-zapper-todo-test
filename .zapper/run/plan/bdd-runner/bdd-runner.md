# BDD runner

## Purpose

Rend la suite BDD de bout en bout exécutable par une seule commande : Playwright démarre le frontend
et l'API sous test, chaque scénario part d'une table `dbo.Todo` vide, et les blocs suivants
disposent des fixtures partagées (base de données, URL de l'API de test) pour écrire leurs étapes.

## Requirements

- Aucune : bloc d'exécution de la suite, il ne couvre ni ne possède aucun ID d'exigence. Il fournit
  le socle dont dépendent tous les blocs qui possèdent des scénarios.

## Depends on

- Aucun bloc : premier bloc du plan.

## Contracts and invariants

- **Runner** : playwright-bdd 9 sur `@playwright/test` (Chromium), déjà configuré; on le réutilise
  sans changer de runner. Les fichiers `.feature` restent en place dans `src/frontend/e2e/features`
  et ne sont jamais modifiés (suite approuvée, lecture seule).
- **Contrat d'exécution** : le frontmatter de
  [README.md](../../../behaviour-driven-development/README.md) reste valide et inchangé
  (`features-path: src/frontend/e2e/features`, `run-command: pnpm --dir src/frontend bdd`,
  `result-format: cucumber-json`, `result-file: results/cucumber.json`). La commande exclut les
  scénarios `@manual` et échoue sur une étape manquante (réglages actuels conservés). Commande d'un
  seul tag, à garder documentée dans ce README :
  `pnpm --dir src/frontend bdd --grep "@<requirement-id>( |$)"`.
- **Serveurs sous test** : la configuration BDD démarre elle-même Vite et l'API (`dotnet run`,
  `ASPNETCORE_ENVIRONMENT=Development`, prête sur `/api/health`), sur le modèle de la configuration
  de régression, avec deux ports dédiés distincts de ceux de la régression (5199/5198) et du
  développement (5173), sans réutiliser un serveur existant. Le `baseURL` de la suite pointe sur ce
  frontend. Les adresses vivent dans un module à côté des étapes, comme
  [servers.ts](../../../../src/frontend/e2e/steps/regression/servers.ts).
- **Câblage frontend → API** : dans les deux configurations (BDD et régression), le frontend sous
  test appelle l'API démarrée par cette configuration : `GlobalConfig.API_URL` vaut
  `<URL de l'API de test>/api`, et l'API autorise en CORS l'origine du frontend de test (par
  `Cors:AllowedOrigins`, fourni en variable d'environnement au démarrage). Le `public/config.js`
  de développement (`https://localhost:7035/api`) reste inchangé; le moyen d'injection (variable au
  démarrage de Vite, interception de `config.js` par Playwright…) est libre.
- **Un seul worker** : la suite BDD s'exécute avec `workers: 1` et sans `fullyParallel`, car tous
  les scénarios partagent la même base ([D06](../decisions.md)).
- **Fixture de base de données** ([D06](../decisions.md)) : une fixture de `fixtures.ts`, sur le
  paquet `mssql` (dépendance de développement du frontend), ouvre un pool sur
  `ConnectionStrings__DefaultConnection` (même chaîne que l'API sous test, qui en hérite) et expose
  un utilitaire d'exécution SQL paramétré que les autres blocs réutilisent (jeu de volume,
  vérifications en base). Le pool est partagé à l'échelle du worker et fermé à la fin. Une chaîne
  absente produit une erreur explicite, pas un échec obscur.
- **Remise à zéro** : un `BeforeScenario` vide `dbo.Todo` (`TRUNCATE`) avant chaque scénario BDD.
  Il tolère que la table n'existe pas encore (schéma pas encore livré par l'API Todos) : il ne fait
  alors rien, sans échouer. Les scénarios de régression (`@regression`) ne sont pas   remis à zéro,
    pour que `pnpm --dir src/frontend regression` garde ses prérequis actuels.
- **URL de l'API de test exportée** : un module des étapes exporte l'URL de base de l'API de test
  (sans `/api`), que les étapes `request` des autres blocs importent; elles ne codent jamais un port
  en dur.
- **Base jetable** : la suite vide `dbo.Todo` et y charge 100 000 lignes; elle ne doit viser qu'une
  base jetable. Dans le runner, c'est le sidecar `mssql` (schéma publié par `runner.setup`); en
  local, `ConnectionStrings__DefaultConnection` doit pointer sur une base de test dédiée, avec le
  dacpac publié à la main ([D09](../decisions.md)). Le README de la suite le dit explicitement.
- **Jeu de volume** : le seeder (`seed:volume`, = `load-command` du `performance-dataset`) et
  l'étape « le jeu de données de volume réaliste est chargé » sont écrits par
  [API Todos](../todo-api/todo-api.md), qui possède la forme de `dbo.Todo`; ils réutilisent la
  fixture de base de données et l'URL exportées ici.
- **Unicité des étapes** : les deux configurations chargent `e2e/steps/**/*.ts`; chaque texte
  d'étape est défini une seule fois. Les étapes de régression existantes (langue, santé de l'API)
  sont réutilisées, jamais redéfinies.

## Touchpoints

### Modules and components

- Configuration Playwright BDD : serveurs web, ports dédiés, `baseURL`, un seul worker; le reporter
  Cucumber JSON et les réglages playwright-bdd actuels sont conservés.
- Configuration Playwright de régression : ajoute seulement le câblage `API_URL` et CORS vers son
  API; ports, tags, rapports et sources inchangés.
- Glue partagée (`e2e/steps/`) : fixture de base de données et utilitaire SQL dans `fixtures.ts`,
  remise à zéro dans `hooks.ts`, module des adresses de la suite BDD.

### Data

| Entity or table | Access                                   | Source system                                     |
| --------------- | ---------------------------------------- | ------------------------------------------------- |
| `dbo.Todo`      | write (`TRUNCATE` avant chaque scénario) | sidecar `mssql` ou base locale jetable            |

### Configuration

- `ConnectionStrings__DefaultConnection` : variable d'environnement lue par la fixture et par l'API
  sous test; secret du runner ([config.md](../../../config.md)).
- `Cors__AllowedOrigins__*` et `API_URL` du frontend : fixés par chaque configuration Playwright
  pour ses propres ports.
- `package.json` du frontend : `mssql` en dépendance de développement ([D06](../decisions.md)); le
  script `bdd` reste la commande d'exécution.

## Conventions and references

- Skill `nexus-launchpad-standards`
  ([SKILL.md](../../../../.github/skills/nexus-launchpad-standards/SKILL.md)) : `dev-environment.md`
  pour l'environnement local et la base, `frontend-architecture.md` pour la configuration
  d'exécution du frontend.
- [playwright.config.ts](../../../../src/frontend/playwright.config.ts) : configuration BDD à
  compléter.
- [playwright.regression.config.ts](../../../../src/frontend/playwright.regression.config.ts) :
  modèle des serveurs web, à garder vert.
- [fixtures.ts](../../../../src/frontend/e2e/steps/fixtures.ts) et
  [hooks.ts](../../../../src/frontend/e2e/steps/hooks.ts) : points d'extension de la glue.
- [config.md](../../../config.md) : sidecar `mssql`, `runner.setup` (publication du dacpac),
  `performance-dataset`.
- [D06](../decisions.md) : `mssql`, remise à zéro, un seul worker. [D09](../decisions.md) : aucune
  infrastructure nouvelle; le schéma n'est publié que dans la base du runner ou à la main en local.

## Completion evidence

- `pnpm --dir src/frontend bdd` démarre les deux serveurs, exécute la suite et écrit
  `results/cucumber.json`; à ce stade, les scénarios échouent uniquement sur `Missing step: …` ou
  sur le comportement non encore livré, jamais sur le démarrage, la connexion à la base ou la
  remise à zéro (y compris quand `dbo.Todo` n'existe pas encore).
- La commande d'un seul tag n'exécute que les scénarios de ce tag.
- `pnpm --dir src/frontend regression` reste vert, et le frontend de régression atteint son API
  (pas d'erreur CORS sur `/`).
- Les vérifications existantes passent : `pnpm --dir src/frontend lint`, `format:check`, `build`.
