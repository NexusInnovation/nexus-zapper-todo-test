# Sign off

Walks the human through the report and records the architecture sign-off. Only a human can run this
operation: if the request comes from an autonomous run, stop and say so.

## Before Starting

1. Read [../references/report-layout.md](../references/report-layout.md) (Sign-off rules).
2. Read `.zapper/run/output-report/summary.md`. If it is missing, switch to
   [generate.md](generate.md).
3. Check that `commit` is the current `HEAD` and that nothing changed since except the
   [files that do not invalidate the evidence](../references/report-layout.md#files-that-do-not-invalidate-the-evidence).
   If it did, the report is stale: regenerate it first.
4. If `sign-off: blocked` (a hard validation fails), stop and tell the user which one. A failing run
   is not signed off: it goes back to the run.

## Step 1: Present the verdict

Show the verdict (the six hard validations and the other two success criteria) and the known risks.
Hard validations are at 100% by construction here; say so.

## Step 2: Walk through the architecture review

First, the **deviations from the plan** (the decisions of `.zapper/run/decisions.md`), one at a
time: their category, context, assumed choice and the `TODO(A<nn>)` location. This is the only
approval of these decisions: ask with the ask-the-user tool whether to **Approve** or **Reject**
each one. Record the outcome (`approved at sign-off` with the human's name and date, or `rejected`
with the reason) in the **Decisions** section and in the entry's status of
`.zapper/run/decisions.md`. A rejected deviation, or any out-of-scope work, blocks the sign-off
(see Step 3): the run goes back to the plan.

Then present the **Architecture review** table line by line, and the open hypotheses.
For each line ask the human, with the ask-the-user tool, whether the proposed reading is right:

- `respected` confirmed, or corrected to `deviation`.
- `deviation`: ask whether an approved decision covers it; if the human finds it unacceptable,
  record why and do not sign off.
- `unclear`: show the evidence and ask for a reading.

Write the human's reading in the **Human reading** column right away. Ask for the story files only
when the human wants to drill down. Never answer a line on the human's behalf.

## Step 3: Record the outcome

Ask: "Do you sign off this run as meeting the architecture standards?"

- **Yes**: ask for their name. Set `sign-off: signed-off`, `signed-off-by` and `signed-off-on`
  (today's date) in the frontmatter, and the matching lines of the **Sign-off** section. Update row
  7 of the **Verdict** with it too: result `signed-off`, detail `signed off by <name>`, and the
  date and time as its last run.
- **No**: keep `sign-off: pending`, write the reasons in **Known risks**, and tell the user the
  run must be corrected and the report regenerated. Update row 7 of the **Verdict**: detail with the
  reasons, and the date and time as its last run; its result stays `pending`. A rejected deviation
  or out-of-scope work always ends here: fold the decision into the plan (**Update** of
  `plan-implementation-zapper`) before the next run.

## Checklist

- [ ] The report was fresh (`commit` equals `HEAD`) and not `blocked`.
- [ ] Every deviation from the plan was approved or rejected by the human, and recorded.
- [ ] Every architecture line has a human reading.
- [ ] `signed-off` was written only after an explicit yes, with the human's name and the date, and
      row 7 of the **Verdict** agrees with the frontmatter and the **Sign-off** section.
