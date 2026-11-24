# Non-functional requirements

Each requirement is stated by the input or confirmed by the team, and each one becomes an
executable check in the BDD suite (or a manual check, never silently dropped). A category the team
confirmed as having no requirement says `No requirement.`

## Security

- Aucune authentification : l'application est accessible sans connexion (confirmé par l'équipe).
- Un titre est toujours affiché comme du texte, jamais interprété comme du HTML (le prototype utilise `textContent`).

## Performance

- Avec 100 000 Todos en base, la page de liste s'affiche (premier rendu utilisable) en moins de 2 secondes.

## Accessibility

- WCAG 2.1 AA : contrôles étiquetés (champ « Titre du Todo », case « Fait », champ « Modifier le titre »), utilisables au clavier (Entrée, Échap), focus visible, messages d'erreur annoncés via `role="alert"`.

## Localization

- Langues : français (par défaut) et anglais, au choix via le sélecteur de langue existant ([LanguageSwitcher](../../src/frontend/src/core/layout/components/LanguageSwitcher.tsx)). Les libellés et messages anglais sont la traduction directe des libellés français; la formulation exacte est choisie à l'implémentation.

## Observability

- No requirement.

## Other

- Les données d'un Todo (Id, titre, état « fait ») sont conservées côté serveur entre les sessions.
