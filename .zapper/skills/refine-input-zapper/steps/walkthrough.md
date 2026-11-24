# Walkthrough

Guided review of `.zapper/input/` with the team. The goal is to confirm every part, settle as many
hypotheses as possible, and record the approval.

## How to ask

- One item at a time, with the ask-the-user tool when available. Offer **Confirm**, **Correct** and
  **Skip** as choices; free text is always allowed for corrections.
- Present a short summary of the item and the path of its file. Do not paste whole files.
- Settle hypotheses one by one: a confirmed hypothesis becomes a fact (move it into the description
  or a criterion and remove it from **Hypotheses**); a corrected one is rewritten the same way.

## Order

1. **Scope.** Gaps here cannot be skipped: the team defines the scope.
2. **Architecture** and **non-functional requirements.** NFR gaps cannot be skipped either; the
   team may answer "no requirement". Architecture gaps the team cannot answer go to **Open questions
   for the plan stage**.
3. **Stories**, in the order of the `README.md` table: description, hypotheses, then acceptance
   criteria. For a story with more than about 10 criteria, propose a split.

## Applying answers

Apply each correction to the file right away, then update the open hypotheses counts in
`README.md`.

## Approval

- Approval is possible only when no item was skipped.
- Before asking for approval, run the final pass in [sanity-check.md](sanity-check.md) and report
  its findings.
- Ask for an explicit approval of the whole input, then set `status: approved` in `README.md`.
- If the team stops before the end, leave `status: draft` and tell the user that running the
  **Review** operation resumes the walkthrough.
