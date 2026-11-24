# Scope

## Goal

Livrer une application web de gestion de Todos pour un utilisateur anonyme : créer, consulter, modifier (titre et état « fait ») et supprimer des Todos, dans une liste unique partagée et persistée côté serveur. La fonctionnalité vient de la Feature 77077 « Gestion des Todos » et du prototype `prototype/index.html`.

## In scope

- Créer un Todo avec un titre obligatoire (« fait » à faux par défaut, Id GUID généré par le système).
- Consulter la liste des Todos (titre et case « fait »), avec un état vide.
- Modifier le titre d'un Todo.
- Cocher et décocher l'état « fait » d'un Todo.
- Supprimer un Todo.
- Identification d'un Todo par son Id interne uniquement; les doublons de titre sont permis.
- Interface en français et en anglais.

## Out of scope

- Authentification, connexion et listes par utilisateur : une seule liste partagée, sans connexion.
- Filtrage, recherche, tri ou réorganisation des Todos.
- Échéances, priorités, catégories, étiquettes.
- Actions groupées (tout cocher, effacer les Todos faits).
- Migration des données `localStorage` du prototype.

## Starting point

Prototype HTML à [prototype/index.html](../../prototype/index.html) (comportement de référence, données en `localStorage`) et squelette de code existant dans `src/` : solution backend [Nexus.ZapperTodo.slnx](../../src/backend/Nexus.ZapperTodo.slnx) (aucune logique Todo) et coquille frontend [src/frontend](../../src/frontend) (page d'accueil, navigation, composants de base). L'infrastructure (`infra/`) et les pipelines (`pipelines/`) existent déjà.
