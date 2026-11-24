# Coverage check

Mechanical pass over the whole baseline, run after writing or changing it and before the
walkthrough. Fix what you find, then report what changed.

## 1. Traceability

- Every area of `inventory.md` has a unique `RG-<nn>` ID, a coverage verdict and a slug, and its
  existing test paths exist in the repository.
- Every `partial` or `uncovered` area has at least one scenario in its `.feature`; a gap blocks
  approval. A `covered` area has no `.feature` and says `none: covered by existing tests`.
- Every scenario has the `@regression` tag and exactly one `@<area-id>` tag that matches an area of
  the inventory. A tag that matches no area is an orphan: fix the tag or delete the scenario.
- No scenario carries a requirement tag.
- No area is empty: each has at least one existing test or one scenario. A gap is reported, never
  papered over.

## 2. Input alignment

- No scenario describes behaviour that a story of `.zapper/input/stories/` changes or removes, and
  none duplicates a scenario of the BDD suite. When one does, it belongs to the BDD suite or to
  **Changed by the scope**: remove it from the baseline.
- Each **Touched by** story key and each requirement ID of **Changed by the scope** exists in the
  input.

## 3. Gherkin validity

- Each file has one `Feature`, scenario names are unique within it, every scenario has at least one
  `Given`/`When`/`Then` triple in that order, and every `Scenario Outline` has `Examples` whose
  columns match its placeholders.
- Keywords follow the reference for the file's language.

## 4. Contract fields

- `README.md` has `status: draft` unless the team just approved, the **Areas** table lists every
  area with correct counts, and no file exists outside the layout.
- The existing test paths of the inventory are the ones the run command executes (once it is set).

## 5. Report

Tell the user what the pass changed and anything it could not settle.
