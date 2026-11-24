# Coverage check

Validation after writing or changing the plan. Mechanical checks are scripted; reserve model
judgment for semantic alignment. Rules: [../references/plan-layout.md](../references/plan-layout.md).

## 1. Run the deterministic checker

Run [../scripts/check_plan.py](../scripts/check_plan.py) with Python 3.10+ and the workspace root:

```text
python <skill-directory>\scripts\check_plan.py --workspace <workspace-root>
```

It is read-only and dependency-free. Exit 0 means no mechanical error; exit 1 means invalid or
unreadable inputs. Do not approve on a failed check. Missing Python is a validation blocker: report
it, do not silently substitute a model checklist or claim the checker passed.

Checks:

- Feature requirement tags versus block coverage and the index, with exactly one scenario owner
  per ID; requirements sharing a scenario must have the same owner.
- Index/block dependencies, topological order, cycles and BDD-runner prerequisite.
- Plan layout, required files, child/parent links and inline local link destinations.
- Unique decision/hypothesis IDs, decision status and approval, hypothesis markers/placement,
  references, per-block counts and remaining `NEW-<n>` placeholders.
- Warnings for principal blocks over 150 lines and explicitly declared future-file links.

Read [../references/mechanical-checks.md](../references/mechanical-checks.md) for the supported
Markdown conventions and limits. Inspect warnings: a planned link is a declaration, not proof;
long blocks require a real contract justification, not automatic splitting.

Fix structural errors in the affected files, preserving IDs and manual edits. Use explicit ID lists
in **Scenarios**, not ranges; requirements/index may use ranges.

## 2. Semantic completion

- For a requirement shared by several blocks, the scenario owner depends on every contributing
  block, so its scenarios can pass when it is delivered.
- The runner block defines executable Gherkin wiring, minimal shared fixtures, the suite's run
  contract and how to run one tag. Feature blocks own their extensions, not duplicate runners.
- Every remaining source assumption is explicit, answered by the team, or intentionally left as a
  local implementation choice. Confirmed/refuted hypotheses are absent from the active register.
- Blocks bind outcomes, invariants and shared contracts, not internal decomposition. They name
  focused completion evidence and reference standards instead of restating them.
- Nothing contradicts scope, architecture, non-functional requirements or approved decisions.
  No hypothesis permits omitted behavior, unauthorized changes or a false success.
- Every decision category (`architecture`, `dependency`, `schema-contract`, `data-access`,
  `security`, `infra`, `scope`) has an approved decision or an explicit "nothing to decide" given
  at the gate. Every block touchpoint that adds a dependency, changes a schema or a contract,
  reads or writes a legacy system, touches a security-relevant area, needs infrastructure, or adds
  a screen, route or module traces to an approved decision, and every block stays within the
  `scope` decision. Anything else is a missing decision: add it as `proposed` and go back to the
  gate.
- Every non-functional requirement is addressed explicitly: its owner's **Non-functional strategy**
  states a concrete design answer (for a performance requirement: server-side paging and filtering,
  the indexes or query shape for the dataset's volumes), not a restatement of the requirement or a
  promise to optimize later. A `@manual` requirement is owned and says what the design provides
  for its human check. The mechanical check only confirms that the ID is named.
- The delegation roster has one writer per affected block. Report unavailable delegation rather
  than claiming this requirement was met.

## 3. Independent sanity check

Follow [sanity-check.md](sanity-check.md) once per operation, on the whole plan's contracts.
For an update, focus on changed blocks and their producers/consumers. Integrate targeted fixes,
resolve arbitrations and rerun the checker; do not loop through another full review.

## 4. Report and approval

Tell the user what changed, the checker error/warning counts, the independent review outcome and
any remaining limitation. Do not equate script success with semantic or human approval.

- A fix changing the outline, shared contracts, scenario ownership or a decision goes back to the
  [outline gate](outline.md#4-gate) for that change only.
- Set `status: approved` only when the outline is approved, mechanical checks pass, warnings have
  been assessed, the independent review's material findings are resolved and no arbitration is
  pending. Otherwise leave `draft` and state what blocks approval.
- On approval, tell the user the plan is read-only to agents and ready for `/goal`. Clean up only
  the session's own temporary audit notes; never remove a shared temporary folder.
