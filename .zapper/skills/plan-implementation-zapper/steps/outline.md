# Outline

Builds the outline of the plan (`README.md` and `decisions.md`) and runs the single human gate.
Block files are written only after the outline is approved. Layout and ID rules:
[../references/plan-layout.md](../references/plan-layout.md).

## 1. Building blocks

From the audit notes ([audit-context.md](audit-context.md)):

1. Cut the solution into building blocks, each one cohesive and deliverable by one implementation
   agent. The structure is free; prefer feature slices over technical layers when the project's
   conventions allow it.
2. Map every active requirement ID from the `.feature` tags, including the non-functional ones
   (`nfr-<category>-R<nn>`), to at least one block. Assign exactly
   one block as the owner of its tagged scenarios; contributors reference that owner instead of
   duplicating ownership. When a requirement is split across blocks, the owner is the block that
   completes it and it depends on every contributor. A non-functional requirement is a design
   constraint on the blocks that build the screens and queries it names: give it to the block that
   completes them, or to a shared block when one component carries it (for example a paging
   contract), and settle its strategy now (paging, indexes, mechanism), as an approved decision when
   it is a major one.
3. Add the BDD runner block (`bdd-runner`) first, and make every block with requirements depend on
   it.
4. Order the blocks so that each comes after every block it depends on. No cycle.
5. Identify shared capabilities and contracts, with one owning block for each. Fix only the
   boundaries consumers need (inputs, outputs, errors, invariants); leave internal design free.

## 2. Decisions and hypotheses

Classify every open question of the audit:

- **Major decision** (see the categories in
  [plan-layout.md](../references/plan-layout.md#decisions): `architecture`, `dependency`,
  `schema-contract`, `data-access`, `security`, `infra`, `scope`): add it to `decisions.md` with
  `status: proposed`, its `Category`, the recommended choice, its alternatives and a one-line
  reasoning. Flag the choices pilot #1 took alone: a write path to a legacy system, a stored
  procedure, a screen or page the stories do not name, infrastructure that is not provisioned yet.
  Always add the `scope` decision (screens, routes and modules in and out, from
  `.zapper/input/scope.md`). For a category with nothing to decide, say so in the gate rather than
  skip it silently.
- **AI-assumed answer not established by the sources or the team**: choose a simple answer that
  satisfies the requirements, give it an ID and keep it explicit in the owning block's compact
  `hypotheses.md`, with its code TODO and placement. Do not silently drop technical assumptions
  that constrain behavior or consumers.
- **Local implementation choice within the constraints**: leave it to the implementer. Do not
  invent a hypothesis merely to prescribe a filename, helper, internal type or configuration name.
- **Confirmed or refuted hypothesis**: adapt the plan to the actual answer, without narrating the
  former hypothesis or keeping it in the active hypotheses file. Do not reuse its ID.
- **Conflict or unmet requirement**: record it explicitly in the working notes with affected
  blocks, evidence and a proposed resolution. Continue independent blocks, then ask the team to
  arbitrate before approving the plan. A TODO cannot authorize omitting a requirement, weakening
  a constraint, bypassing project instructions or reporting a request as a completed operation.

Do not block unrelated work on missing input. Do not claim the plan is ready while a required
behavior or structural conflict remains unresolved.

## 3. Write the outline

Write `README.md` from [../assets/README.md](../assets/README.md) with `status: draft`, the overview
and the building blocks table (hypotheses counts as known so far), and `decisions.md` from
[../assets/decisions.md](../assets/decisions.md).

## 4. Gate

The human gate on the outline. Use the ask-the-user tool when available, one question at a time;
free text is always allowed. Later checks reopen only changed decisions, contracts or unresolved
conflicts, not every block.

1. **Outline.** Present the overview and the building blocks table: each block's purpose in one
   line, its dependencies and the requirements it covers. Ask to **Confirm** or **Correct**. Apply
   each correction to `README.md` right away, then present the outline again until it is confirmed.
   Do not paste whole files.
2. **Decisions.** Each `proposed` decision, grouped by category and one at a time: offer **Approve**
   (the recommended choice), each alternative, and **Reject**. Record the status, the approver (the
   person answering, or the git `user.name`) and the ISO date. A rejected decision gets a
   replacement with the next unused ID, presented in turn. Update the blocks it affects in
   `README.md`. State this is the only approval of these decisions: the run asks for none, and any
   choice the plan does not cover becomes a deviation reviewed at sign-off.
3. **Hypotheses and conflicts.** List remaining AI assumptions grouped by block, one line each.
   The team may confirm or refute any of them; integrate its answer and remove that hypothesis
   from the active register. Do not ask about each harmless assumption. Submit unresolved
   conflicts individually; they must be settled before final plan approval.
4. **Approval.** Ask for an explicit approval of the outline. It is possible only when no decision
   is `proposed`. The status stays `draft` until [coverage-check.md](coverage-check.md) passes on
   the full plan.

If the team stops before the end, leave `status: draft` and tell the user that the **Review**
operation resumes the gate.
