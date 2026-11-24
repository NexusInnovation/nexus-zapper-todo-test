# Walkthrough

Guided review of `.zapper/regression-baseline/` with the team. The goal is to confirm that every
area, test verdict and scenario describes what the application does today, and to record the
approval that unlocks the wiring and the baseline run.

## How to ask

- One area at a time, with the ask-the-user tool when available. Offer **Confirm**, **Correct** and
  **Skip** as choices; free text is always allowed for corrections.
- Present a short summary: the area (kind, entry points, behaviour today), what the scope changes
  in it, its existing tests and the coverage verdict, and the scenario names with the path of the
  `.feature`. Show a scenario's steps only when the team asks or when it was flagged. Do not paste
  whole files.
- List items as a Markdown list, one per line. Never run them together in one paragraph.
- Raise every flagged item (behaviour the code does not settle, test that may be flaky or
  disabled, value or label that was assumed) before asking for confirmation. Settle them in the
  session; send what changes a story to `refine-input-zapper`.
- For a regression command that includes slow or infrastructure-bound suites, ask the team to
  confirm which existing suites it runs (see the execution contract).

## Order

Areas in the order of the `README.md` table. For each: the behaviour and the tests first, then the
scenarios.

## Applying answers

Apply each correction right away to `inventory.md` and the `.feature` file, keep the tags in sync,
then update the counts in `README.md`. A correction that changes a story's behaviour rather than
the baseline is a change to the input: record it and send it to `refine-input-zapper`.

## Approval

- Approval is possible only when no area was skipped and no flagged item is unresolved.
- Before asking for approval, run [coverage-check.md](coverage-check.md) and report its findings.
- Ask for an explicit approval of the whole baseline, then set `status: approved` in `README.md`.
  From then on the `.feature` files are read-only to agents.
- If the team stops before the end, leave `status: draft` and tell the user that the **Review**
  operation resumes the walkthrough.
