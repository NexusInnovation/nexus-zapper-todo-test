# Audit context

Collects enough evidence to define boundaries, shared contracts and feasibility, not to design the
implementation. Nothing is written to `.zapper/` here.

## Working notes

Keep notes in a unique, session-scoped temporary folder, never in the repository.
They hold a compact reuse map, constraints, shared contracts and open questions, and are passed to the block subagents in
[write-blocks.md](write-blocks.md). They are disposable and never referenced from the plan.

## 1. Zapper input

- `.zapper/input/`: `scope.md`, `architecture.md`, `non-functional-requirements.md` and every story.
  The architecture file holds constraints, not decisions: the plan must respect them. The
  non-functional requirements are requirements to satisfy by design, not background: each has an
  `nfr-<category>-R<nn>` ID in the BDD suite.
- `.zapper/behaviour-driven-development/`: `README.md` (status and run contract) and the requirement
  tags and scenario summaries of every `.feature`. Tags are the authoritative active IDs; there
  is no separate requirements file. Read full scenarios when needed to settle a contract or risk.
  Read the non-functional scenarios in full: their thresholds, the screens and queries they name and
  their `@manual` checks drive the design (paging, indexes, shared components).
- `.zapper/regression-baseline/`: `README.md` (status, baseline and run contract) and `inventory.md`.
  The areas are existing behaviour the run must not break: the plan respects their entry points and
  contracts, and a change the plan makes to shared code they consume is a risk to name. The
  regression `.feature` files and existing tests are not requirements to implement.

## 2. Project standards

Read before the code, because they are the authoritative standard: existing code may have drifted
from them.

- `.zapper/config.md`: the stack, the `instructions` the project lists, the `critical-areas`
  (a change there is a major decision), the `commands` and the `performance-dataset` (the data the
  performance checks run on: whether it exists, how it is loaded, its volumes).
- The project's AI instructions and skills: the ones listed in `instructions`, the instruction
  files the harness loads for the workspace (for example `AGENTS.md`,
  `.github/copilot-instructions.md`, `*.instructions.md`) and the project skills available in the
  session. Keep the ones that govern the touchpoints of the scope; the plan names them instead of
  repeating their rules.
- The relevant architecture, decision records and domain guides; do not read all project docs.
- Manifests for versions and existing dependencies. Consult library documentation only to settle
  a feasibility risk or a shared contract, not to pre-validate every future implementation detail.

## 3. Codebase

Locate the principal entry points and one or two representative existing patterns per area:

- The closest existing feature to model each part on.
- Reusable modules, components, pages, endpoints, data access and integrations.
- The test setup the BDD runner block will build on: existing test runners and frameworks, any
  Gherkin support, end-to-end tooling, test data and authentication fixtures, and the suite's
  current `run-command` if it has one.
- For a prototype or a partial codebase: what already exists, and what the input says to keep.

Stop once the boundaries, reusable entry points, shared contracts and major decisions can be
described. Do not enumerate every caller, DTO, helper, procedure or test file. Leave local discovery
and implementation choices to the implementing agent.

Deepen a lookup only when its answer changes a shared contract, a structural decision or the
feasibility of a required behavior. Record the question and stop when it is answered; do not turn
it into another whole-codebase audit. Keep the notes scoped so block agents do not repeat it.

When the repository is empty or nothing is reusable, say so: the plan is then built from the
architecture constraints alone.

## 4. Open questions

List unresolved assumptions and structural risks, not every local design choice:

- Open hypotheses still in the refined stories.
- The **Open questions for the plan stage** of `architecture.md`.
- Gaps found during the audit: a touchpoint the input does not define, a conflict between a standard
  and the input, a missing integration detail.
- For each performance requirement: the existing queries and screens it covers that do not page,
  filter or sort on the server, and the indexes they would need on the dataset's volumes. This is
  evidence for the design, not a reason to postpone the requirement.

For each, note the story key or area and the evidence already checked.
[outline.md](outline.md) distinguishes decisions, assumed answers, implementation freedom and
conflicts that require arbitration.
