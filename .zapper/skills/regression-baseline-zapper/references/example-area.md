# Example: filled-in area

Shortened. Written in French because the stories of the example are. The area ID exists only in
`inventory.md` and in the scenario tags.

## inventory.md (one section)

```markdown
## RG-02 — Liste des titres à commander

- **Slug**: `titres-a-commander`
- **Kind**: screen
- **Touched by**: 76025 (extended: new tab next to the existing list), 76267 (shared code consumed:
  the supplier grouping component)
- **Entry points**: `src/modules/achats/pages/TitresACommander.tsx`, `GET /api/purchases/titles`
- **Behaviour today**: la liste regroupe les titres par fournisseur et affiche, par groupe, le
  nombre de titres et le total.
- **Changed by the scope**: l'ajout de l'onglet « À paraître » (76025-R01); the list itself is not
  changed.
- **Existing tests**:
  - `src/frontend/e2e/titres-a-commander.spec.ts`: lists the titles of a supplier
  - `src/backend/tests/.../TitlesApiTests.cs`: the endpoint returns titles of the branch only
- **Coverage**: partial: the grouping totals and the empty state are asserted nowhere
- **Regression scenarios**: [titres-a-commander.feature](areas/titres-a-commander/titres-a-commander.feature)
```

## areas/titres-a-commander/titres-a-commander.feature

```gherkin
# language: fr
Fonctionnalité: Liste des titres à commander (comportement existant)

  Contexte:
    Soit une acheteuse qui débute un achat

  @regression @RG-02
  Scénario: Afficher le total d'un groupe fournisseur
    Soit le fournisseur "Hachette" offre deux titres à commander
    Quand elle ouvre la liste des titres à commander
    Alors le groupe "Hachette" affiche son nombre de titres et son total

  @regression @RG-02
  Scénario: Afficher l'état vide
    Soit aucun titre n'est à commander
    Quand elle ouvre la liste des titres à commander
    Alors un message indique qu'il n'y a aucun titre à commander
```

Points to copy: both tags on the line above `Scénario`, only the behaviour no existing test
asserts (the first existing test already covers the listing), wording taken from what the screen
shows today, no requirement ID.
