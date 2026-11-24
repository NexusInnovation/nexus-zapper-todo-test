# Édition d'un Todo

## Purpose

Rend chaque ligne de la page « Mes Todos » modifiable : la case « Fait » devient interactive et le
titre s'édite en ligne, chaque changement étant enregistré par `PUT /api/todos/{id}` et reflété
dans le cache de la liste.

## Requirements

- 77080-R01, 77080-R02, 77080-R03, 77080-R04, 77080-R05, 77080-R07, 77080-R08
- 77080-cocher-et-decocher-un-todo-R01, 77080-cocher-et-decocher-un-todo-R02,
  77080-cocher-et-decocher-un-todo-R03, 77080-cocher-et-decocher-un-todo-R04

## Scenarios

Write the step definitions of these scenarios, reusing the shared steps of the BDD runner block, and
run them by tag until they pass.

- [77080-modifier-le-titre-d-un-todo.feature](../../../../src/frontend/e2e/features/77080-modifier-le-titre-d-un-todo/77080-modifier-le-titre-d-un-todo.feature):
  `@77080-R01`, `@77080-R02`, `@77080-R03`, `@77080-R04`, `@77080-R05`, `@77080-R07`, `@77080-R08`
- [77080-cocher-et-decocher-un-todo.feature](../../../../src/frontend/e2e/features/77080-cocher-et-decocher-un-todo/77080-cocher-et-decocher-un-todo.feature):
  `@77080-cocher-et-decocher-un-todo-R01`, `@77080-cocher-et-decocher-un-todo-R02`,
  `@77080-cocher-et-decocher-un-todo-R03`, `@77080-cocher-et-decocher-un-todo-R04`

## Depends on

- [BDD runner](../bdd-runner/bdd-runner.md) : serveurs de test, remise à zéro de `dbo.Todo`, URL de
  l'API de test, un seul worker.
- [API Todos](../todo-api/todo-api.md) : `PUT` de [D02](../decisions.md), règles du titre, `404` et
  `422`, étapes de données de test et aide de lecture des Todos.
- [Page Mes Todos](../todo-page/todo-page.md) : contrat de ligne, contrat de cache `['todos']`,
  schéma et messages de validation du titre, étapes partagées et aide de localisation de ligne.

Les scénarios « introuvable » des deux fichiers ci-dessus appartiennent à l'
[API Todos](../todo-api/todo-api.md); ce bloc n'en redéfinit aucune étape.

## Contracts and invariants

- **Mutation de mise à jour** (définie ici) : un hook du module `todos` envoie `PUT { title, isDone }`
  par le client d'API de la page; les deux champs partent toujours ensemble (le `PUT` remplace les
  deux, la dernière écriture l'emporte, sans jeton de version). Cocher envoie le titre enregistré et
  le nouvel état; enregistrer un titre envoie le titre saisi et l'état courant de la ligne.
- **Une mise à jour à la fois par ligne** : les envois de la case et du titre d'une même ligne sont
  sérialisés; chaque charge utile est construite à partir du dernier Todo confirmé par le serveur,
  jamais d'une valeur en cache périmée, pour qu'un enregistrement ne défasse pas un changement
  d'état concurrent (et inversement). Pendant un enregistrement en cours, la case et
  « Enregistrer »/« Annuler » sont désactivés; un envoi parti n'est pas annulé.
- **Cache** : le contrat `['todos']` de la [Page Mes Todos](../todo-page/todo-page.md) s'applique
  sans redéfinition. Sur succès, le `TodoDto` renvoyé remplace la ligne de même `id` en place, dans
  la page où elle se trouve : ni réordonnancement, ni perte des pages chargées, ni doublon, total
  inchangé. Aucune mise à jour optimiste : l'interface reflète la réponse du serveur.
- **Case « Fait »** : la case de la ligne (nom accessible contenant « Fait », contrat de ligne)
  devient interactive à la souris et au clavier (Espace). Elle reflète `isDone` du cache, est
  désactivée pendant sa requête, et le style barré et grisé suit l'état renvoyé. Changer l'état ne
  touche ni le titre, ni l'`Id`, ni les autres lignes.
- **Mode édition** : chaque ligne porte un bouton « Modifier » dans sa zone d'actions; ce bouton ou
  un double-clic sur le titre remplace le titre par un champ étiqueté « Modifier le titre »,
  prérempli avec le titre enregistré et focalisé, suivi des boutons « Enregistrer » et « Annuler ».
  Une seule ligne est en édition à la fois; en ouvrir une autre annule la première. La case
  « Fait » et l'attribut `data-todo-id` de la ligne restent en place.
- **Enregistrer** (« Enregistrer » ou Entrée dans le champ) : la valeur passe par le schéma zod
  partagé de la page (retrait des espaces, obligatoire, 200 caractères au plus après retrait), puis
  le titre débarrassé de ses espaces est envoyé. Succès : le mode édition se ferme, la ligne affiche
  le titre du serveur, le focus revient au bouton « Modifier » de la ligne.
- **Refus** : une erreur client n'envoie aucune requête; un `422` (`errors.title`) ne modifie pas
  le cache. Dans les deux cas le champ reste ouvert avec la saisie et affiche, dans le champ (texte
  d'aide `role="alert"`, `aria-invalid`, description liée), le message traduit de la règle violée
  avec les clés i18n partagées de la page (« Le titre est obligatoire. », « Le titre ne peut pas
  dépasser 200 caractères. »), jamais le texte brut du serveur.
- **Annuler** (« Annuler » ou Échap dans le champ) : ferme le mode édition sans requête, efface
  l'erreur et réaffiche le titre enregistré; le focus revient au bouton « Modifier ».
- **Autres échecs** : un `404` ou une erreur réseau lors d'un `PUT` affiche un message
  d'erreur traduit sur la ligne (`role="alert"`) et invalide `['todos']` pour se resynchroniser sur
  le serveur; le titre et l'état affichés ne prennent jamais une valeur que le serveur a refusée.
- **Libellés** : « Modifier », « Modifier le titre », « Enregistrer », « Annuler » et le message
  d'échec vivent dans l'espace de noms `todos` (fr, en, traduction directe); aucun libellé en dur.
  Le titre reste du texte, en lecture comme en valeur de champ (jamais de HTML).
- **Étapes de ce bloc** (définies ici une seule fois) : les étapes des scénarios possédés qui ne
  sont pas déjà partagées, dont « le Todo « X » est en mode édition », les actions « Modifier » et
  double-clic, remplacer puis enregistrer, valider ou annuler, les vérifications du champ, de l'Id
  et du titre enregistré, et les étapes de case (« la case « Fait » du Todo « X » est cochée » /
  « n'est pas cochée », « je coche » / « je décoche le Todo « X » », « l'état « fait » du Todo « X »
  est … »). Elles réutilisent sans les redéfinir les étapes de données de test et l'aide de lecture
  de l'[API Todos](../todo-api/todo-api.md), ainsi que les étapes partagées et l'aide de
  localisation de ligne de la [Page Mes Todos](../todo-page/todo-page.md) (« j'ouvre la liste des
  Todos », « je recharge la page », « le titre « X » est barré et grisé », « … n'est ni barré ni
  grisé »).
- **Invariants de la glue** : « le Todo « X » est en mode édition » est autonome (premier pas des
  scénarios) : il crée le Todo par l'API, ouvre la liste, entre en édition et retient l'`Id` de la
  ligne pour « son Id est inchangé ». Les valeurs entre guillemets français sont capturées telles
  quelles, espaces compris (`@77080-R03`). Les actions de case et d'enregistrement attendent la
  réponse du `PUT` (ou le refus visible) avant l'étape suivante; les vérifications d'état, de titre
  enregistré et d'Id lisent l'API, pas seulement l'écran. Le découpage interne est libre.

## Touchpoints

### Modules and components

- Module `todos` (créé par la [Page Mes Todos](../todo-page/todo-page.md)) : hook de mise à jour,
  ligne de Todo étendue (case interactive, bouton « Modifier », éditeur en ligne), clés i18n de
  `public/locales/{fr,en}/todos.json`.
- Atomes existants à réutiliser :
  [Checkbox](../../../../src/frontend/src/components/atoms/checkbox/Checkbox.tsx),
  [TextField](../../../../src/frontend/src/components/atoms/textfield/TextField.tsx).
- Glue BDD sous `src/frontend/e2e/steps/`, à côté des étapes partagées.

### Frontend pages

- Mes Todos (`/`) : chaque ligne gagne la case interactive et l'édition en ligne du titre.

### API endpoints

| Method | Route                  | Parameters                                   | Response                     | Purpose                        |
| ------ | ---------------------- | -------------------------------------------- | ---------------------------- | ------------------------------ |
| PUT    | `/api/todos/{id:guid}` | route : `id`; body : `title`, `isDone: bool` | `200 TodoDto`; 404; 422; 400 | Enregistrer le titre ou l'état |

### Data

| Entity or table | Access            | Source system                              |
| --------------- | ----------------- | ------------------------------------------ |
| `dbo.Todo`      | write (par l'API) | new ([API Todos](../todo-api/todo-api.md)) |

## Conventions and references

- Skill `nexus-launchpad-standards`
  ([SKILL.md](../../../../.github/skills/nexus-launchpad-standards/SKILL.md)) :
  `frontend-data-and-ui` (hook `use{Entity}Update`, atomes, formulaires react-hook-form + zod, clés
  i18n), `module-operations` (contrat de modification de bout en bout). Écart local au modèle du
  standard : remplacement en place dans le cache plutôt qu'une invalidation globale, pour respecter
  le contrat de cache de la page.
- [parseResponse.ts](../../../../src/frontend/src/core/api/parseResponse.ts) : analyse des réponses
  et des `ProblemDetails`.
- [D01](../decisions.md) : édition en ligne, pas de page `/todos/:id`. [D02](../decisions.md) :
  forme du `PUT`. [D08](../decisions.md) : lignes de la liste MUI simple.

## Completion evidence

- Les tags possédés passent par la commande d'un seul tag du BDD runner, sans étape manquante ni
  définition en double; les scénarios « introuvable » de l'API Todos restent verts.
- Les scénarios de la [Page Mes Todos](../todo-page/todo-page.md) restent verts (création, ordre,
  pagination, état vide) et `pnpm --dir src/frontend regression` passe toujours.
- Lint, build et Vitest passent; des tests ciblés couvrent le remplacement en place dans le cache
  (pages conservées, sans doublon) et l'éditeur (Entrée, Échap, refus sans requête).
