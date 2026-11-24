# Regression baseline layout

The contract of `.zapper/regression-baseline/`. Later stages (plan, goal, report, hooks) rely on
it, so follow it exactly.

## Folder

```text
.zapper/regression-baseline/
├── README.md                       # status and baseline markers, run contract, index
├── inventory.md                    # touched areas and the existing tests covering them
├── results/                        # raw machine-readable output of the last run
└── areas/
    └── <area-slug>/                # one folder per area
        ├── <area-slug>.feature     # only when the area needs generated scenarios
        └── results.md              # outcome of the last run for this area
```

Create no other file at the root of `.zapper/regression-baseline/`. The step definitions (glue)
are not part of this folder: they are project-specific and live in the project's own test folder.
The BDD wiring skill creates the empty shell, and the
[wire-and-verify](../steps/wire-and-verify.md) step writes the glue.

## Templates

| Output file                         | Template                                       |
| ----------------------------------- | ---------------------------------------------- |
| `README.md`                         | [../assets/README.md](../assets/README.md)     |
| `inventory.md`                      | [../assets/inventory.md](../assets/inventory.md) |
| `areas/<area-slug>/<area-slug>.feature` | [../assets/area.feature](../assets/area.feature) |

Replace every `<placeholder>`. `results.md` and `results/` are produced only by the
[Run](../flows/run.md) operation, following [execution-contract.md](execution-contract.md).

## README.md and its markers

YAML frontmatter, the only signals later stages and hooks check:

| Field             | Values                                                                              |
| ----------------- | ----------------------------------------------------------------------------------- |
| `status`          | `draft` or `approved`: the team reviewed the inventory and every scenario           |
| `baseline`        | `not-run`, `passed` or `failed`: result of the last baseline run                    |
| `baseline-commit` | Full SHA of `HEAD` when `baseline` last became `passed`, empty otherwise            |
| `run-command`     | The single command that runs the regression suite (see the execution contract)      |
| `result-format`   | `cucumber-json` or `junit-xml`                                                      |
| `result-file`     | Path the command writes its results to, under `results/`                            |

- Any change to `inventory.md` or to a `.feature` file sets `status: draft` and
  `baseline: not-run`. Only the [walkthrough](../steps/walkthrough.md) sets `approved`; only the
  [Run](../flows/run.md) operation sets `baseline`.
- Once `approved`, the `.feature` files are read-only to agents (enforced by a hook, ADO 76648).
  Change them through this skill, which sets the status back to `draft` first. The existing project
  tests listed in the inventory are **not** locked.
- **Areas** table: one row per area with its link, its coverage verdict, its number of existing
  tests and of regression scenarios, and its last run outcome.

## Area

An area is one cohesive piece of existing, user-observable behaviour that the scope touches: a
screen or flow, an endpoint family, a module capability, a scheduled job. It is the unit a failure
is reported against.

- **ID** `RG-<nn>`, a two-digit counter starting at `01`, assigned when the area is first added and
  never changed or reused, even when siblings are removed. A removed area keeps its number retired.
- **Slug** kebab-case name of the area, used for the folder and the file name.
- The ID appears in `inventory.md` and in the tags of the area's scenarios, nowhere else.

## inventory.md

One section per area, from [../assets/inventory.md](../assets/inventory.md):

| Field                | Content                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------- |
| Kind                 | `screen`, `endpoint`, `module`, `job` or the project's own word                              |
| Touched by           | Story keys of `.zapper/input/stories/` and how: modified, extended, or shared code consumed  |
| Entry points         | Principal files, routes or endpoints where the behaviour lives today                         |
| Behaviour today      | One or two sentences, in business language                                                   |
| Changed by the scope | Behaviour the scope intentionally changes, with requirement IDs; not protected by scenarios  |
| Existing tests       | Path and what each asserts, or `none`                                                        |
| Coverage             | `covered`, `partial` or `uncovered` (rules in [../steps/inventory-tests.md](../steps/inventory-tests.md)) |
| Regression scenarios | Link to the area's `.feature`, or `none: covered by existing tests`                          |

The paths in **Existing tests** are what maps the results of the existing tests to their area.

## Feature file

- One `.feature` file per area that has generated scenarios, named `<area-slug>.feature`.
- Gherkin syntax and keywords follow the
  [Cucumber Gherkin reference](https://cucumber.io/docs/gherkin/reference).
- Every scenario carries `@regression` and `@<area-id>` on the line above it. The tags are the only
  link between a scenario and the area it protects. Writing rules:
  [../steps/write-scenarios.md](../steps/write-scenarios.md).
