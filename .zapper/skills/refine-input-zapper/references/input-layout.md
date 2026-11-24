# Refined input layout

The contract of `.zapper/input/`. Later stages (BDD, plan, goal, hooks) rely on it, so follow it
exactly.

## Folder

```text
.zapper/input/
├── README.md                       # status marker, index
├── scope.md
├── architecture.md
├── non-functional-requirements.md
├── assets/                         # project-wide material only
└── stories/
    └── <story-slug>/
        ├── <story-slug>.md
        └── assets/                 # this story's mockups and screenshots
```

Create no other file at the root of `.zapper/input/`.

## Templates

| Output file                            | Template                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| `README.md`                            | [../assets/README.md](../assets/README.md)                                           |
| `scope.md`                             | [../assets/scope.md](../assets/scope.md)                                             |
| `architecture.md`                      | [../assets/architecture.md](../assets/architecture.md)                               |
| `non-functional-requirements.md`       | [../assets/non-functional-requirements.md](../assets/non-functional-requirements.md) |
| `stories/<story-slug>/<story-slug>.md` | [../assets/story.md](../assets/story.md)                                             |

Replace every `<placeholder>`. Remove a template section only where this file allows it.

## README.md and the status marker

- YAML frontmatter `status: draft | approved`. It is the only approval signal later stages and
  hooks check.
- Any generated change sets it back to `draft`. Only the walkthrough sets `approved`.
- **Stories** table: one row per story with its link and its number of open hypotheses.

## Story slug

- `<source-id>-<kebab-title>` when the story comes from a tracker work item (Azure DevOps, GitHub
  Issues, Jira…), where `<source-id>` is its numeric or key ID, for example `1234-add-item-to-cart`.
  Otherwise `<kebab-title>`.
- When one source story is split, every resulting story keeps the source ID with its own title,
  for example `1234-add-item-to-cart` and `1234-remove-item-from-cart`.
- When one refined story merges several source stories, use the ID of the main one and list all of
  them in **Origin**.
- The folder name and the file name are the same slug.

## Story file

Sections, in this order:

| Section             | Rule                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| Title (`#`)         | Short, user-facing name of the story.                                                                   |
| Description         | The user story: "As a … I want … so that …", optionally followed by one or two sentences of context.   |
| Hypotheses          | Optional. Remove the section when there is none. Each item states the assumption and why it is open.   |
| Acceptance criteria | The important part. One observable, testable behaviour per bullet. No IDs, no Gherkin.                  |
| Mockups             | Images from this story's `./assets/` only. Remove the section when the story has no visual.            |
| Origin              | One line, traceability only: work item IDs, prototype screens, code paths. Never used as a requirement. |

## Assets

- **Story assets are self-contained.** A mockup needed by two stories is copied into both
  `assets/` folders. A story never links outside its own folder.
- **Global `assets/`** holds project-wide material that is not a story mockup: architecture
  diagrams, PDFs, other miscellaneous sources. Link it from `scope.md`, `architecture.md` or
  `non-functional-requirements.md`.
- File names are kebab-case and describe the content, for example `cart-empty-state.png`.

## Hypotheses and open questions

- Hypotheses live only in story files.
- Scope and non-functional requirement gaps are never left open: the walkthrough settles them.
- Architecture gaps go to the **Open questions for the plan stage** section of `architecture.md`.
