# Suppression d'un Todo

## Purpose

Ajoute à chaque ligne de la page « Mes Todos » un bouton « Supprimer » qui demande une confirmation
par le `ConfirmDialog` existant, puis supprime le Todo ciblé par son Id et le retire de la liste,
jusqu'au retour de l'état vide quand il n'en reste aucun.

## Requirements

- 77081-R01, 77081-R02, 77081-R03, 77081-R04, 77081-R05, 77081-R07

## Scenarios

Write the step definitions of these scenarios, reusing the shared steps of the BDD runner block, and
run them by tag until they pass.

- [77081-supprimer-un-todo.feature](../../../../src/frontend/e2e/features/77081-supprimer-un-todo/77081-supprimer-un-todo.feature):
  `@77081-R01`, `@77081-R02`, `@77081-R03`, `@77081-R04`, `@77081-R05`, `@77081-R07`

## Depends on

- [BDD runner](../bdd-runner/bdd-runner.md) : serveurs de test, remise à zéro de `dbo.Todo` avant
  chaque scénario, un seul worker.
- [API Todos](../todo-api/todo-api.md) : `DELETE /api/todos/{id:guid}` (`204`, `404` avec
  `errorCode`), étapes de données de test et assistant de lecture des Todos par l'API.
- [Page Mes Todos](../todo-page/todo-page.md) : contrat de ligne et zone d'actions, contrat de cache
  `['todos']`, état vide, client d'API du module, étapes partagées et aide de localisation de ligne.

Le scénario `@77081-R06` du même fichier (suppression d'un Id inexistant par l'API) appartient à
[API Todos](../todo-api/todo-api.md), qui en définit les étapes.

## Contracts and invariants

- **Contrats consommés, non redéfinis** : la route, les codes et la sémantique de `DELETE`
  (suppression logique, `404` pour un Id absent ou déjà supprimé, existence vérifiée avant de
  supprimer) sont ceux de l'[API Todos](../todo-api/todo-api.md); le contrat de ligne, de cache et
  d'état vide est celui de la [Page Mes Todos](../todo-page/todo-page.md).
- **Mutation de suppression** (produite ici) : hook de suppression du module `todos` selon
  `module-operations` et `frontend-data-and-ui` (`DELETE` sur l'Id, réponse `204` sans corps,
  erreur levée sur une réponse non OK). La cible est toujours l'`id` de la ligne, jamais son titre :
  deux Todos de même titre restent distincts de bout en bout.
- **Cache après suppression** (applique le contrat de cache de la page) : sur succès, la ligne
  disparaît de toutes les pages chargées et `totalCount` baisse d'un; aucune ligne n'est dupliquée.
  La pagination étant par décalage, une suppression décale les pages suivantes : un
  « Afficher plus » ultérieur ne doit **jamais** sauter un Todo (par exemple en invalidant
  `['todos']` après le retrait, ce qui recharge les pages déjà affichées). Sur échec, `['todos']`
  est aussi invalidé pour refléter le serveur : un `404` (Todo supprimé ailleurs) fait disparaître
  la ligne, une autre erreur la conserve. Toute recharge suit la règle de fusion de la
  [Page Mes Todos](../todo-page/todo-page.md) : un Todo créé et ajouté en fin de liste, hors des
  pages chargées, ne disparaît pas (test ciblé : créer → supprimer un Todo plus ancien →
  « Afficher plus », sans perte ni doublon). L'erreur suit le pipeline global du standard
  (`MutationCache` → toast traduit), sans gestion locale ni texte brut du serveur.
- **Bouton « Supprimer »** : un par ligne, dans la zone d'actions de la ligne, que le bloc
  [Édition d'un Todo](../todo-item-edit/todo-item-edit.md) partage pour ses propres contrôles; ce
  bloc n'y ajoute que « Supprimer ». Il réutilise le `DeleteActionButton` existant. Nom accessible
  traduit qui commence par « Supprimer » et identifie le Todo par son titre (en : « Delete »), pour
  distinguer les lignes au lecteur d'écran. Atteignable et activable au clavier, focus visible.
- **Confirmation** : le clic ouvre le `ConfirmDialog` existant (modale MUI, `role="dialog"`), sans
  aucun appel `DELETE` avant la confirmation. Message exact « Supprimer « <titre> » ? » (titre
  interpolé tel quel et rendu en texte; l'interpolation i18next n'échappe déjà pas les valeurs),
  boutons « Supprimer » (confirmer) et « Annuler »; en anglais, traduction directe. Titre de la
  modale : libellé traduit court, distinct du message.
- **Issue de la modale** : « Annuler », Échap ou clic hors de la modale ferment sans rien supprimer
  et rendent le focus au bouton déclencheur; le Todo reste dans le cache et en base. « Supprimer »
  lance la mutation; les boutons sont désactivés pendant l'appel (`isConfirming`) et la modale se
  ferme après la tentative, réussie ou non. Une seule modale à la fois, liée à l'Id en attente.
  Après une suppression réussie, le focus ne retombe jamais sur `body` (cible laissée à
  l'implémenteur : ligne voisine ou champ de création, par exemple).
- **État vide** : quand le dernier Todo est supprimé, `totalCount` vaut 0 et la page affiche
  l'état vide de la [Page Mes Todos](../todo-page/todo-page.md), sans rechargement.
- **Langues** : clés de l'espace de noms `todos` (action, titre et message de la modale, boutons),
  fr et en, sans libellé en dur; les clés standard `list.actions.delete` et `list.confirmDelete.*`
  servent de modèle.
- **Étapes définies ici une seule fois** : « le Todo « X » affiche un bouton « Supprimer » »,
  « je clique sur « Supprimer » pour le Todo « X » », « la confirmation « Supprimer « X » ? » est
  demandée » (compare le message complet de la modale, guillemets imbriqués compris), « le Todo
  « X » n'est pas encore supprimé » (ligne visible, modale encore ouverte, Todo toujours renvoyé
  par l'API), « je supprime le Todo « X » en confirmant » (attend la réponse `204` et la mise à jour
  de la liste), « le Todo « X » n'apparaît plus dans la liste », « je clique sur « Supprimer » pour
  le Todo « X » et que j'annule la confirmation » (attend la fermeture de la modale), « je supprime
  en confirmant le premier des deux Todos « X » » (Id du premier en ordre de création lu par
  l'assistant de l'API, ligne localisée par Id), « un seul Todo « X » reste dans la liste »,
  « c'est le second, dont l'Id n'était pas ciblé » (la ligne restante porte l'Id du second et l'API
  ne renvoie plus l'Id ciblé). Les expressions sont ancrées : « je clique sur « Supprimer » pour le
  Todo « X » » ne correspond pas à la variante « … et que j'annule la confirmation ». L'Id ciblé
  passe d'une étape à l'autre par un état propre au scénario.
- **Étapes réutilisées, jamais redéfinies** : « un Todo existant « X » », « deux Todos existants
  « X » », « c'est le seul Todo » ([API Todos](../todo-api/todo-api.md)); « j'ouvre la liste des
  Todos », « je recharge la page », « le Todo « X » apparaît dans la liste », « le message « Aucun
  Todo pour l'instant. » s'affiche » et l'aide de ligne par titre ou par Id
  ([Page Mes Todos](../todo-page/todo-page.md)).
- Le découpage interne (composant d'action, état de la modale, emplacement du hook) est laissé à
  l'implémenteur.

## Touchpoints

### Modules and components

- Module `todos` (bloc [Page Mes Todos](../todo-page/todo-page.md)) : hook de suppression, action
  de ligne et modale câblées sur la page; traductions `public/locales/{fr,en}/todos.json`.
- Composants partagés existants, réutilisés sans les recréer :
  [ConfirmDialog](../../../../src/frontend/src/core/components/molecules/ConfirmDialog/ConfirmDialog.tsx)
  et [DeleteActionButton](../../../../src/frontend/src/core/components/atoms/DeleteActionButton/DeleteActionButton.tsx).
- Glue BDD de la story sous `src/frontend/e2e/steps/`.

### Frontend pages

- Mes Todos (`/`) : bouton « Supprimer » par ligne, modale de confirmation, retrait de la ligne.

### API endpoints

| Method | Route                  | Parameters   | Response        | Purpose                        |
| ------ | ---------------------- | ------------ | --------------- | ------------------------------ |
| DELETE | `/api/todos/{id:guid}` | route : `id` | `204`; 404; 400 | Suppression logique (consommé) |

### Data

| Entity or table | Access                  | Source system        |
| --------------- | ----------------------- | -------------------- |
| `dbo.Todo`      | soft delete (par l'API) | new (bloc API Todos) |

## Conventions and references

- Skill `nexus-launchpad-standards`
  ([SKILL.md](../../../../.github/skills/nexus-launchpad-standards/SKILL.md)) :
  `frontend-data-and-ui` (hook `use{Entity}Delete`, action de suppression avec `ConfirmDialog` et
  `DeleteActionButton`, erreurs globales par toast, clés i18n), `module-operations` (contrat de
  bout en bout de l'opération Delete). Ici les lignes forment une liste MUI, pas `AppDataGrid`
  ([D08](../decisions.md)).
- [D01](../decisions.md) : suppression confirmée sur la page `/`, sans page dédiée;
  [D02](../decisions.md) : contrat `DELETE`.
- [ConfirmDialog.test.tsx](../../../../src/frontend/src/core/components/molecules/ConfirmDialog/ConfirmDialog.test.tsx) :
  comportement existant de la modale, à conserver.

## Completion evidence

- `@77081-R01`, `@77081-R02`, `@77081-R03`, `@77081-R04`, `@77081-R05` et `@77081-R07` passent par
  la commande à une balise du BDD runner, sans étape manquante ni définition en double; `@77081-R06`
  et les scénarios des autres blocs restent verts.
- Vitest ciblé : retrait du cache par Id (pages et total, homonyme intact), aucun appel `DELETE` à
  l'annulation. Lint, build et `pnpm --dir src/frontend regression` passent.
