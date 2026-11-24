# Qualité transverse

## Purpose

Vérifie et garantit, une fois toute l'interface de la page « Mes Todos » livrée, les exigences
transverses : accessibilité WCAG 2.1 AA, localisation française par défaut et anglaise, et
persistance des Todos côté serveur entre les sessions. Il comble les écarts relevés dans les blocs
3 à 5 sans redéfinir leurs contrats.

## Requirements

- nfr-accessibility-R01, nfr-localization-R01, nfr-other-R01

## Scenarios

Write the step definitions of these scenarios, reusing the shared steps of the BDD runner block, and
run them by tag until they pass.

- [nfr-accessibility.feature](../../../../src/frontend/e2e/features/nfr-accessibility/nfr-accessibility.feature):
  `@nfr-accessibility-R01`
- [nfr-localization.feature](../../../../src/frontend/e2e/features/nfr-localization/nfr-localization.feature):
  `@nfr-localization-R01`
- [nfr-other.feature](../../../../src/frontend/e2e/features/nfr-other/nfr-other.feature):
  `@nfr-other-R01`

## Depends on

- [BDD runner](../bdd-runner/bdd-runner.md) : serveurs de test, câblage `API_URL`/CORS, remise à
  zéro de `dbo.Todo`, URL de l'API de test, un seul worker, exclusion de `@manual`.
- [API Todos](../todo-api/todo-api.md) : étapes de données de test (« aucun Todo », « un Todo
  existant « X » », « un Todo fait « X » »), aide de lecture des Todos, codes `errors.title`.
- [Page Mes Todos](../todo-page/todo-page.md) : contrat de ligne, formulaire, validation et clés
  partagées, espace de noms `todos`, français par défaut, étapes partagées.
- [Édition d'un Todo](../todo-item-edit/todo-item-edit.md) : case interactive, bouton « Modifier »,
  éditeur en ligne (Entrée, Échap, focus).
- [Suppression d'un Todo](../todo-item-delete/todo-item-delete.md) : bouton « Supprimer »,
  `ConfirmDialog`, focus après suppression.

## Contracts and invariants

- **Contrats consommés, jamais redéfinis** : libellés, rôles, validation, cache et comportements
  clavier des blocs 3 à 5 restent ceux de leurs blocs; ce bloc n'ajoute que des obligations
  transverses et la glue de ses trois fichiers.
- **Écarts comblés ici (obligations de ce bloc)** :
  - `<html lang>` suit la langue i18n courante (`fr` au démarrage, `en` après bascule); il vaut
    aujourd'hui `en` en dur dans [index.html](../../../../src/frontend/index.html), ce qui contredit
    le français par défaut (critère 3.1.1).
  - Indicateur de focus mesurable : une règle globale `:focus-visible` de l'application (thème MUI
    ou styles globaux de la coquille) donne à tout contrôle focalisé au clavier un contour d'au moins
    2 px contrasté, absent sans focus. Les ondulations MUI seules (case, boutons) ne
    suffisent pas.
  - Le gris des lignes faites garde un contraste du texte d'au moins 4,5:1 (règle axe
    `color-contrast`); une teinte « désactivée » ne convient pas.
  - Ordre de tabulation = ordre visuel : formulaire, puis par ligne case « Fait », « Modifier »,
    « Supprimer », puis « Afficher plus »; aucun `tabindex` positif; le double-clic sur le titre a
    son équivalent clavier (« Modifier »).
  - Aucune donnée de Todo dans le stockage du navigateur (`localStorage`, `sessionStorage`,
    IndexedDB) : le serveur est la seule source, contrairement au prototype.
- **Langue par défaut** : sans préférence enregistrée, l'interface s'ouvre en français quelle que
  soit la langue du navigateur (pas de détection par `navigator`). Le choix par le
  [LanguageSwitcher](../../../../src/frontend/src/core/layout/components/LanguageSwitcher.tsx)
  existant est le seul moyen de bascule; son libellé, ses entrées et son comportement ne changent
  pas (la régression s'y appuie).
- **Aucun texte en dur** : tout libellé, texte indicatif, nom accessible, titre d'onglet, entrée de
  navigation et message (y compris les `422` traduits depuis `errors.title`) de la page vient des
  ressources i18n; `todos` a les mêmes clés en `fr` et `en`, l'anglais en traduction directe.
- **Étapes de ce bloc** (définies ici une seule fois, expressions ancrées, sans chevauchement avec
  les autres glues) : « j'ouvre le mode édition du Todo « X » », « le champ « X » a un nom
  accessible », « la case « Fait » a un nom accessible », le parcours clavier complet et ses trois
  vérifications, le parcours Tab et sa vérification de focus, « le message « X » est annoncé comme
  une alerte », l'analyse axe, « un visiteur sans préférence de langue enregistrée », « le bouton
  « Ajouter » est affiché », les deux vérifications de l'anglais, « le message d'erreur est affiché
  en anglais », et les quatre étapes de `nfr-other`. Si une glue existante couvre déjà l'un de ces
  textes par une expression générique, on la réutilise : chaque texte ne correspond qu'à une
  définition.
- **Étapes réutilisées** : données de test et lecture (API Todos); « j'ouvre la liste des Todos »,
  « je crée un Todo avec un titre vide », « le Todo « X » apparaît dans la liste », « la page
  s'intitule « Mes Todos » » et l'aide de ligne (Page Mes Todos); « je choisis l'anglais dans le
  sélecteur de langue » et « je choisis le français dans le sélecteur de langue » de
  [shell.steps.ts](../../../../src/frontend/e2e/steps/regression/shell.steps.ts), jamais redéfinies.
- **Invariants de la glue** : le parcours clavier n'emploie que des frappes (Tab, Maj+Tab, Entrée,
  Espace, Échap, saisie), jamais de clic ni de remplissage direct, attend chaque réponse d'API et
  consigne le résultat de chaque action pour les vérifications, qui relisent aussi l'API. Les
  textes anglais attendus sont lus dans `public/locales/en/*.json`, jamais recopiés dans la glue.
  L'analyse axe s'exécute après la fin du premier chargement.

## Non-functional strategy

- nfr-accessibility-R01 : noms accessibles par les étiquettes des atomes MUI (contrats des blocs
  3 et 4); parcours complet au clavier grâce à l'ordre de tabulation, au focus conservé ou rendu
  (champ de création, « Modifier », bouton déclencheur, jamais `body`) et au focus initial du
  `ConfirmDialog`; focus visible par la règle `:focus-visible` globale; erreurs en `role="alert"`
  liées au champ. Analyse automatique par `@axe-core/playwright` ([D07](../decisions.md)), balises
  `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, sur toute la page dans la coquille, état vide et
  ligne faite; zéro violation, sans exclusion de règle ni de zone. Le scénario `@manual` est exclu
  de la commande : il est prouvé par l'audit humain (NVDA ou VoiceOver et grille WCAG 2.1 AA, une
  ligne faite et une non faite, auditeur, date, constats par critère) consigné dans le rapport du
  run; le design lui fournit `lang` juste, titre de niveau 1, liste sémantique et alertes.
- nfr-localization-R01 : `defaultLanguage` `'fr'` (bloc 3), bascule par le sélecteur existant,
  ressources `todos` et `common` complètes dans les deux langues. La vérification « rien en
  français » compare le texte, les noms accessibles et les textes indicatifs de la page aux valeurs
  `fr` qui diffèrent de leur valeur `en` (mots identiques tolérés). Les messages d'erreur
  client et `422` passent par les mêmes clés traduites.
- nfr-other-R01 : persistance en `dbo.Todo` par l'[API Todos](../todo-api/todo-api.md), aucun état
  local. Le Todo est créé et coché par l'interface dans un contexte de navigateur secondaire, fermé
  ensuite, son Id lu par l'API dès la création; le scénario reprend dans son propre contexte, sans
  stockage partagé, et compare `data-todo-id`, l'état de la case et l'Id relu. Le contexte
  secondaire reçoit le même câblage `API_URL` que celui du BDD runner, réutilisé tel quel.

## Touchpoints

### Modules and components

- Coquille et i18n : synchronisation de `<html lang>` (initialisation i18n,
  [config.ts](../../../../src/frontend/src/i18n/config.ts)), règle globale de focus visible.
- Module `todos` : corrections ciblées de contraste, d'ordre de focus ou de clé manquante relevées
  par les scénarios, dans le respect des contrats des blocs 3 à 5.
- Glue BDD sous `src/frontend/e2e/steps/`, à côté des étapes partagées.

### Frontend pages

- Mes Todos (`/`) : aucune fonction nouvelle; accessibilité et traduction vérifiées dans tous ses
  états (vide, lignes, ligne faite, édition, modale).

### Configuration

- `package.json` du frontend : `@axe-core/playwright` en dépendance de développement
  ([D07](../decisions.md)).

## Conventions and references

- Skill `nexus-launchpad-standards`
  ([SKILL.md](../../../../.github/skills/nexus-launchpad-standards/SKILL.md)) :
  `frontend-architecture` (i18n, coquille, `LanguageSwitcher`), `frontend-data-and-ui` (atomes,
  formulaires, clés i18n de module).
- [ConfirmDialog.tsx](../../../../src/frontend/src/core/components/molecules/ConfirmDialog/ConfirmDialog.tsx) :
  focus initial sur la confirmation, conservé.
- [D01](../decisions.md) : français par défaut, page à `/`. [D07](../decisions.md) : axe.

## Completion evidence

- `@nfr-accessibility-R01`, `@nfr-localization-R01` et `@nfr-other-R01` passent par la commande à
  une balise du BDD runner, sans étape manquante ni définition en double; toute la suite BDD et
  `pnpm --dir src/frontend regression` restent verts.
- Le même balayage axe, lancé une fois en mode édition et modale ouverte, ne signale aucune
  violation; le résultat est noté dans le rapport du run.
- Vitest : mêmes clés `fr`/`en` pour `todos`; une ligne (case, « Modifier », « Supprimer »,
  éditeur, modale) et les messages `422` s'affichent en anglais sans texte français.
- Audit manuel du scénario `@manual` consigné dans le rapport, avec ses constats.
