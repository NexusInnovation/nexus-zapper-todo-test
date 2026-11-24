# Coverage check

Mechanical pass over the whole suite, run after writing or changing it and before the walkthrough.
Fix what you find, then report what changed.

## 1. Traceability

The requirements are the current acceptance criteria of `.zapper/input/stories/` and the current
statements of `.zapper/input/non-functional-requirements.md`; their IDs are the
`@<requirement-id>` tags of the `.feature` files.

- Every current acceptance criterion and non-functional statement is verified by at least one
  scenario tagged with its ID. One with no scenario is a gap: list it as unresolved (it blocks
  approval).
- Every scenario has at least one `@<requirement-id>` tag, and every tag matches a current
  criterion of the same story. A tag that matches none is an orphan: its criterion was removed, so
  remove the tag and delete the scenario if it verifies nothing else.
- Requirement IDs are unique across the suite, follow the ID rule of the layout reference, and use
  the story key of their story. Two criteria never share an ID.

## 2. Input alignment

- Every story folder of `.zapper/input/stories/` that has acceptance criteria has a story folder
  here, with the same slug, and no folder lacks its story, except the `nfr-<category>` folders
  (see section 3).
- Each tagged requirement matches one current acceptance criterion by meaning; each current
  criterion has its requirement.

## 3. Non-functional requirements

- Every category of `.zapper/input/non-functional-requirements.md` with at least one requirement
  has its `nfr-<category>` folder, and no such folder exists for a category without requirement.
  Every statement of the file has a requirement ID in its folder, matched by meaning, with at
  least one scenario: an automated one, or a `@manual` one. A statement with neither is a gap that
  blocks approval; none is silently left out.
- Every `@manual` scenario states, in its description, why no automated check is possible and what
  a human verifies.
- Every performance scenario starts with the realistic-volume dataset step, every timing check
  states a threshold (number and unit), and every screen or query flagged by the requirement has a
  timing check and a server-side processing check (page and total for a paginated list; the
  server-side filtering, grouping or aggregation with the expected result unchanged for the
  others). `.zapper/config.md` has a
  `performance-dataset` without placeholder when the suite has a performance requirement; if not,
  list it as unresolved (it blocks approval).

## 4. Gherkin validity

- Each file has one `Feature`, scenario names are unique within it, every scenario has at least
  one `Given`/`When`/`Then` triple in that order, and every `Scenario Outline` has `Examples` whose
  columns match its placeholders.
- Keywords follow the reference for the file's language.

## 5. Contract fields

- `README.md` has `status: draft` unless the team just approved, the **Stories** table lists every
  story and every non-functional category with correct requirement and scenario counts, and no
  file exists outside the layout.

## 6. Report

Tell the user what the pass changed and anything it could not settle.
