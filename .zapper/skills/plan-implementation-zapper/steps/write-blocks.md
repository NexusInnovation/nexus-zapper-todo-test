# Write blocks

Writes the files of every building block from the approved outline. Layout, level of detail, size
and ID rules: [../references/plan-layout.md](../references/plan-layout.md). Quality bar:
[../references/example-block.md](../references/example-block.md).

## Rules

- **Follow the approved outline.** Blocks, their order, dependencies, requirement mapping and
  decisions are settled; do not change them here.
- **Contracts, not an implementation recipe.** Specify outcomes, invariants and shared contracts;
  suggest existing entry points and reuse. Leave internal files, types, methods and decomposition
  to the implementer unless another block genuinely needs that contract.
- **Be concise.** Aim for 80-150 lines in the principal block file. Exceed this only for essential
  contracts, not to inventory changes; do not move verbosity into child files to meet the target.
- **Assumptions are explicit.** Follow the classification in [outline.md](outline.md). A local
  implementation choice is free; an AI-assumed answer has a compact hypothesis and TODO; a
  requirement conflict needs arbitration, not a success-shaped fallback.
- **Reference, do not repeat.** Name the project skills and instructions that govern the block, and
  link the code to model on, instead of copying their rules or their code.
- **Scenarios are owned.** A block with requirements lists, under **Scenarios**, the `.feature`
  files and the tags of its requirement IDs: its implementer writes their step definitions and runs
  them by tag. The `bdd-runner` block follows the
  [BDD runner block](../references/plan-layout.md#bdd-runner-block) rules.
- **Non-functional requirements are addressed.** A block that covers an `nfr-<category>-R<nn>` ID
  gets a **Non-functional strategy** section that names the ID and states the design answer (see
  [Non-functional requirements](../references/plan-layout.md#non-functional-requirements)); never
  leave it to the implementer to discover it from the scenario.
- **A new major decision pauses the affected work only.** If writing a block reveals a major decision the outline
  did not have, do not take it: add it to `decisions.md` as `proposed`, set `README.md` to
  `status: draft`, and run the **Decisions** part of the [outline gate](outline.md#4-gate) for it
  before finishing that block. Continue independent blocks. Report conflicts the same way and
  leave the plan in `draft` until they are resolved.

## Per block

1. Write `<block-slug>/<block-slug>.md` from [../assets/block.md](../assets/block.md).
2. Remove repetition first; use a child file only for a coherent, necessary shared contract.
3. Write `<block-slug>/hypotheses.md` from [../assets/hypotheses.md](../assets/hypotheses.md) with
   the hypotheses assigned to the block, each with its ready-to-copy marker. List under
   **Hypotheses** of the block file the IDs that affect it, including those kept by another block.

## Delegation (subagent)

Use exactly one writing subagent per block being generated or updated, including a single-block
run. Do not silently fall back to writing blocks in the coordinator; if delegation is unavailable,
report it and ask how to proceed. Keep a session-local roster of block, agent and outcome.

The coordinator alone edits `README.md` and `decisions.md`, assigns final hypothesis IDs and
integrates cross-block changes. An agent writes only inside its assigned block folder.

Schedule ready blocks in bounded parallel batches (at most three writing agents). Planning may
proceed once the upstream contracts needed for drafting are fixed; upstream code need not exist.
Wait for an unresolved producer contract before drafting its consumers.

**Subagent prompt:**

> Write or update only `<block-slug>` from the approved outline. Read the supplied layout,
> block/hypothesis templates, compact global constraints, applicable decisions, this block's
> requirement tags and relevant scenarios, source story, scoped audit notes and producer contracts.
> For a block covering a `nfr-*` ID, also read its non-functional scenarios (thresholds, screens,
> `@manual` checks) and write the **Non-functional strategy** section.
> Existing entry points are suggestions; shared contracts and invariants are binding. Do not
> reread unrelated blocks, repeat the global audit or enumerate implementation files.
> Use compact explicit assumptions with `NEW-<n>` IDs for new ones. Never weaken a requirement
> to avoid a conflict. Report SUCCESS or BLOCKED, files written, covered and owned IDs, shared
> contracts produced/consumed, new assumptions, decisions/conflicts and any uncovered requirement.

Provide exact source paths and the required ID lists in each prompt, not the whole plan or every
story. Supply the example only when needed. A blocked agent reports evidence; continue independent
blocks and obtain arbitration rather than repeatedly relaunching the same investigation.

## After every block

- Give each `NEW-<n>` hypothesis its final ID, following the ID rule, and replace the placeholder in
  its files and markers.
- Update the hypotheses counts of the building blocks table in `README.md`.
- Integrate producer contracts before starting consumers. Each shared contract has one
  authoritative definition; consumers link to it.
- Before review, verify the roster has one completed writer per affected block, no missing report
  and no unresolved decision or conflict hidden behind a TODO.
