# Plan layout

The contract of `.zapper/run/plan/`. Later stages (goal, implementation, hooks, report) rely on it,
so follow it exactly.

## Folder

```text
.zapper/run/plan/
├── README.md                       # status marker, outline, ordered blocks
├── decisions.md                    # major decisions and their approval
└── <block-slug>/
    ├── <block-slug>.md             # the block
    ├── <child-slug>.md             # optional, when the block is split
    └── hypotheses.md               # optional, this block's assumed answers
```

Create no other file at the root of `.zapper/run/plan/`. A block folder holds only its block file,
its child files and its `hypotheses.md`.

## Templates

| Output file                    | Template                                           |
| ------------------------------ | -------------------------------------------------- |
| `README.md`                    | [../assets/README.md](../assets/README.md)         |
| `decisions.md`                 | [../assets/decisions.md](../assets/decisions.md)   |
| `<block-slug>/<block-slug>.md` | [../assets/block.md](../assets/block.md)           |
| `<block-slug>/<child-slug>.md` | [../assets/block.md](../assets/block.md)           |
| `<block-slug>/hypotheses.md`   | [../assets/hypotheses.md](../assets/hypotheses.md) |

Replace every `<placeholder>`. Remove a template section only where this file allows it. Write the plan in the `language` of `.zapper/config.md`.

## Level of detail

The plan is a map, not a recipe. It names **what** changes and **where**, and leaves **how** to the
implementer.

- **Binding**: responsibilities, required outcomes, invariants, requirement ownership, dependencies
  and shared contracts (inputs, outputs, errors, data source and integration semantics). Define
  each shared contract once in its owning block; consumers link to it.
- **Suggested**: principal existing entry points and representative code to reuse, verified by the
  bounded audit. The implementer may choose another local decomposition within the constraints.
- **Out**: inventories of files/DTOs/helpers to create, prescribed internal methods, task lists,
  method bodies, test code and copies of requirements or project conventions.
- The block states its completion evidence, not every test case or test file to write.
- Preserve the section headings in this contract for mechanical checks; write their content in
  the `language` of `.zapper/config.md`. List IDs instead of restating acceptance criteria.

## README.md and the status marker

- YAML frontmatter `status: draft | approved`. It is the only approval signal later stages and hooks
  check.
- `README.md` and `decisions.md` are the **outline**: what the team reviews at the
  [outline gate](../steps/outline.md). Block files are written from the approved outline and are not
  reviewed one by one.
- Any change to the outline sets the status back to `draft`. Only an approved outline followed by a
  clean [coverage check](../steps/coverage-check.md) sets `approved`. Once `approved`, the whole
  plan is read-only to agents (enforced by a hook, ADO 76648).
- **Building blocks** table: one row per block, **in implementation order** (a block comes after
  every block it depends on), with its link, the numbers of the blocks it depends on, the
  requirement IDs it covers (consecutive IDs of one story may be written as a range, for example
  `1234-R01…1234-R07`) and its number of hypotheses.

## Building block

- One cohesive part of the solution that one implementation agent can deliver: a feature slice, a
  shared component, a cross-cutting concern. The structure is free: it does not have to mirror the
  stories.
- Slug: kebab-case name of the block, for example `cart-api`. The folder name and the block file
  name are the same slug.
- Every active requirement ID of the BDD suite is covered by at least one block. A requirement
  shared by several blocks may be listed in each of them, but has exactly one scenario owner. This
  includes the non-functional IDs (`nfr-<category>-R<nn>`): see
  [Non-functional requirements](#non-functional-requirements).
- **Requirements** lists covered IDs. **Scenarios** lists only the IDs owned by this block, as
  explicit `@<requirement-id>` tags (no ranges or incidental references to other owners' tags).
  Put contributor notes and links to the scenario owner outside that section.
- The owning block writes the step definitions of every scenario tagged with its owned IDs,
  reusing shared steps. A scenario bearing multiple requirement tags must have one owner for all
  those tags. Contributors do not duplicate definitions.
- Contributing to a requirement is not owning its scenarios. When several blocks deliver the
  behavior of one requirement (for example an API block and a UI block), the owner is the block
  that completes it and **depends on** every contributing block, so its scenarios can pass as soon
  as it is delivered. A contributor never has to pass a scenario that needs a block after it.

### BDD runner block

The plan always has a block with the slug `bdd-runner`, first in the table, that every block with
requirements depends on. It makes the suite of `.zapper/behaviour-driven-development/` executable,
following the execution contract of the BDD stage (`generate-bdd-zapper`):

- Reuses the project's test runner when it can run Gherkin, or sets one up. Choosing a new runner,
  framework or dependency is a decision.
- Wires the `.feature` files to the runner, without changing them: they are read-only once the suite
  is approved.
- Writes the shared steps (common states and actions reused across stories) and the test fixtures
  they need, such as authentication and the application under test. Supplies the minimal runnable
  foundation, not every future feature's seed or instrumentation. Feature blocks extend those
  fixtures through the agreed contracts when their resources exist.
- Records `features-path`, `run-command`, `result-format` and `result-file` in the frontmatter of
  `.zapper/behaviour-driven-development/README.md`, and states the command that runs a single tag,
  so each block can run its own scenarios. If the runner needs the `.feature` files inside the
  project's test folder, it moves them there (no copy is kept) and updates `features-path`. The plan
  is frozen during the run, so its `.feature` links keep the location of planning time; a later
  plan update re-points them to the current `features-path`, and `check_plan.py` reads that
  field to find the sources.
- Covers no requirement: its **Requirements** section says so. When the suite already has a
  `run-command`, the block only checks that it runs and adds what is missing. The regression
  baseline (`regression-baseline-zapper`) is already wired and passing: the block reuses its
  runner and steps, and keeps the regression `run-command` working next to the BDD one.
- Wires the non-functional checks: the run command excludes the `@manual` scenarios (a tag
  expression such as `not @manual`), and the shared step
  `Given the realistic-volume dataset is loaded` loads the `performance-dataset` of
  `.zapper/config.md`. When the dataset is a volume seeder that does not exist yet, the block (or a
  block it names) writes it; choosing how it is generated or stored is a decision.

### Non-functional requirements

The non-functional requirements are requirements like the others: the BDD suite gives each an ID
`nfr-<category>-R<nn>` and at least one scenario, so each is covered by a block, owned like any
other, and must be **explicitly addressed**. A block that covers one has a **Non-functional
strategy** section that names each ID and states how the design satisfies it, with the choices the
requirement forces, for example:

- Performance: the paging, filtering and sorting strategy (server-side, which contract carries the
  page and the total), the indexes or query shapes the large queries need on the realistic-volume
  dataset, and where the thresholds of the scenarios are verified. A design that loads a whole set
  to cut it on the client does not satisfy the requirement.
- Security, accessibility, localization, observability: the mechanism or the shared component that
  guarantees the property, and where it is enforced.
- A requirement whose scenarios are all `@manual`: say so, and state what the design provides so the
  human check can pass (it still has an owner).

An index or paging contract several blocks depend on is defined once, in its owning block, under
**Contracts and invariants**; the strategy links to it.

### Block file sections

In this order. Remove a section that would be empty, except **Requirements**, and **Scenarios** in a
block that covers requirements.

| Section                    | Rule                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| Title (`#`)                | Name of the block.                                                                            |
| Purpose                    | One or two sentences: the responsibility of the block.                                        |
| Requirements               | Covered BDD IDs only; do not copy criteria. A block with none states why.                     |
| Scenarios                  | Feature links and explicit owned tags only; contributors point to the owner elsewhere.       |
| Depends on                 | Links to the blocks that must exist first.                                                    |
| Contracts and invariants   | Binding behavior and producer/consumer contracts, each defined once by its owner.            |
| Non-functional strategy    | How the block satisfies each `nfr-*` ID it covers. Remove when it covers none.                |
| Touchpoints                | Subsections below. List only what the block adds or changes.                                  |
| Conventions and references | Project skills and instructions to apply, docs, decisions (`D01`) and existing code to reuse. |
| Completion evidence        | Owned scenarios and focused regression/contract checks that demonstrate the outcome.         |
| Children                   | Links to the child files, when the block is split.                                            |
| Hypotheses                 | Link and affected IDs, plus the instruction to add their code TODOs.                         |

Touchpoints subsections, each removed when empty: **Modules and components**, **Frontend pages**,
**API endpoints** (method, route, parameters, response, purpose), **Data** (entity or table, read or
write, source system), **Integrations**, **Configuration**.

### Size and splitting

- Aim for 80-150 lines per principal block file, not a minimum or a hard limit. A longer block
  briefly explains the essential contracts requiring the extra detail. Do not copy conventions,
  requirements or contracts, and do not split merely to meet the target.
- Move a coherent, necessary contract into a linked child file in the same folder only when it
  improves readability. A child needs only its title, parent link and relevant contract sections;
  it does not repeat requirement ownership, the whole block template or hypothesis prose.
- A child file links back to its block. Nest no deeper than one level; split the block into two
  cohesive blocks if responsibilities warrant it, not to satisfy a line quota.

### Links to future files

Prefer existing directories as touchpoints, with proposed names as plain code text. When a link to
a file not yet created is necessary, put it on its own line and immediately follow the link with
the literal annotation `(planned)`. This is allowed only for a
future project file outside the plan folder. Plan documents and source references must exist.
The checker reports these declarations as warnings, not verified evidence.

## Decisions

`decisions.md` holds every **major** decision. The plan is the decision gate of the run: whatever
the implementation needs and is not approved here is a deviation from the plan (see `goal.md`).
Smaller choices are made in the block files, following the project's conventions, without a decision
entry.

Every decision has one `Category`, and the plan covers each of them, with an explicit decision or a
stated "nothing to decide":

| Category          | Covers                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| `architecture`    | Structure, technology, a change to a constraint of `.zapper/input/architecture.md`                                  |
| `dependency`      | A new library, package, tool or service                                                                             |
| `schema-contract` | A database schema change, a new or changed API, message or file contract                                            |
| `data-access`     | Where data is read or written, notably any write to a legacy system or through a stored procedure                   |
| `security`        | Authentication, authorization, tenant isolation, secrets, personal data, anything on the project's `critical-areas` |
| `infra`           | Infrastructure the code needs (storage, queues, identities, pipelines) and how it is provisioned                    |
| `scope`           | The screens, routes and modules that are **in** and **out**, from `.zapper/input/scope.md`                          |

The `scope` decision lists, explicitly, each screen, route and module in scope and each one out of
scope. Work outside it is forbidden during the run, never assumed.

- ID: `D<nn>`, two digits, unique in the plan, never reused or renumbered.
- The model proposes a choice with alternatives and reasoning. Continue independent work while
  awaiting the team's answer; an unresolved decision prevents approval, not unrelated drafting.
- Status: `proposed | approved | rejected`. Only the team changes it, at the outline gate. A
  rejected decision stays with its reason; its replacement takes the next unused ID.
- The plan cannot be `approved` while a decision is `proposed`: `/goal` refuses to start (hook
  `goal-gate`, ADO 76725).

## Hypotheses

A hypothesis is an answer assumed by the AI, not established by the sources or confirmed by the
team. Keep it explicit in the `hypotheses.md` of its owning block; other affected blocks link to
that definition. It must still satisfy every requirement and constraint.

- ID: `<key>-H<nn>`. `<key>` is the BDD story key (as in `<story-key>-R01`) when the question comes
  from a story, otherwise the block slug. `nn` is a two-digit counter per key, unique across the
  whole plan, never reused or renumbered. Examples: `1234-H01`, `cart-api-H01`.
- Fields: ID and short title, a self-contained **Marker** stating the assumed answer and what
  needs confirmation, and **Where** identifying its authoritative code placement. Do not repeat
  the marker in separate question/answer/why/impact paragraphs.
- Sources: open hypotheses still in the refined stories, the **Open questions for the plan stage**
  of `.zapper/input/architecture.md` that are not major decisions, and questions found while
  planning.
- A confirmed or refuted hypothesis disappears from the active hypotheses file. Adapt the plan
  directly to the answer without narrating the old question. Its ID is not reused. Keep major
  decision history in `decisions.md`; do not turn hypotheses into an archive.
- Ordinary local implementation choices need no hypothesis or TODO. Conversely, technical
  assumptions affecting behavior or other blocks must not disappear merely to shorten the plan.
- An unresolved requirement conflict is not a hypothesis. Continue independent work and obtain
  arbitration before approval; never assume permission to omit a requirement or bypass a rule.

### Code marker

The implementer builds as if the assumed answer were true and writes, with the comment syntax of the
file's language, at the authoritative point where the assumed rule is implemented. Add it elsewhere
only when an independent implementation also needs confirmation, not in every consumer or test:

```text
TODO(<ID>): Assumed <assumed answer>. <What needs confirmation, and by whom>.
```

The token is exactly `TODO(<ID>)`: no space, no other prefix. The regular expression
`TODO\([\w-]+-H\d{2}\)` finds every marker, so a human can confirm or reject each assumption after
the run and the report can list them.

Name a role or a team as the party that confirms (for example « l'équipe de développement », « la
responsable produit », « le PO »), never a specific person. Do not name the designer unless the
sources say the designer will be consulted.
