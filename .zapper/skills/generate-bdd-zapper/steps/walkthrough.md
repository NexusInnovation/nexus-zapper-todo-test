# Walkthrough

Guided review of `.zapper/behaviour-driven-development/` with the team. The goal is to confirm
that every requirement and scenario describes the expected behaviour, and to record the approval
that unlocks the next step.

## How to ask

- One story at a time, with the ask-the-user tool when available. Offer **Confirm**, **Correct**
  and **Skip** as choices; free text is always allowed for corrections.
- Present a short summary: the requirements (each criterion with its ID, from the working list,
  rebuilt from the input and the tags when resuming) and, for each, the scenario names and the path
  of the `.feature` file. Show a scenario's steps only when the team asks or when it was flagged.
  Do not paste whole files.
- List the requirements as a Markdown list, one requirement per line (`- R01 …`). Never run them
  together in one paragraph or separate them with `·`, `;` or commas. Apply the same rule to the
  flagged items: one per line, each on its own numbered line.
- Raise every flagged item (non-testable criterion, missing data, assumed value) before asking for
  confirmation. Flagged items are not saved in the suite: settle them in the session, and send what
  changes the story to `refine-input-zapper`.
- Non-functional checks come after the stories, one category at a time. For each, also raise, one
  per line: every proposed **threshold** (with the screen or query it applies to), the
  **realistic-volume dataset** of `.zapper/config.md` (kind, volumes, how it is loaded), and every
  **manual** check with its reason. Approving the suite approves these thresholds and the manual
  list: the team may refuse a manual check and ask for an automated one.

## Order

Stories in the order of the `README.md` table (non-functional categories last). For each: the
requirements first, then the scenarios.

## Applying answers

Apply each correction right away to the `.feature` file, keep the tags in sync, then update the
counts in `README.md`. A correction that changes a
story's behaviour rather than its test is a change to the input: record it and send it to
`refine-input-zapper` instead of diverging from the story.

## Approval

- Approval is possible only when no story or category was skipped and no flagged item is
  unresolved (including every proposed threshold and the performance dataset).
- Before asking for approval, run [coverage-check.md](coverage-check.md) and report its findings.
- Ask for an explicit approval of the whole suite, then set `status: approved` in `README.md`.
  From then on the `.feature` files are read-only to agents.
- If the team stops before the end, leave `status: draft` and tell the user that the **Review**
  operation resumes the walkthrough.
