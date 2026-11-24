---
name: report-run-zapper
description: "Produces the output report of a Zapper run in .zapper/run/output-report/ (a summary plus one file per story: BDD results by requirement ID, every success criterion with a computed status, commits, deviations, decisions, follow-ups, cost, duration and human interventions per stage), records the human architecture sign-off, then packages code, tests and report on a clean feature branch ready for a PR into main. Hard validations pass at 100%; the human judges the architecture.
  USE FOR: zapper report, run report, summarize a run, per-story results, sign off a run, validate the architecture, package the final artifact, prepare the PR.
  DO NOT USE FOR: refining stories (use `refine-input-zapper`), generating or running the BDD suite alone (use `generate-bdd-zapper`), planning, implementing code, reviewing a diff outside a run (use `review-nexus`), creating or merging a PR (left to the human)."
---

# Report run (Zapper)

Final stage of a Zapper run. It reads what the run produced, writes the hierarchical report that
lets the team judge the result quickly, records the human sign-off, and packages the final
artifact. The report format is defined in
[references/report-layout.md](references/report-layout.md), where each piece of evidence comes from
in [references/sources.md](references/sources.md), the ledger of cost, duration and human
interventions in [references/metrics-layout.md](references/metrics-layout.md), the commit messages
of the run in [references/commit-layout.md](references/commit-layout.md), and templates live in
[assets/](assets/).

Everything is read live from `.zapper/` and from the repository on every run: never copy input,
plan or decision content into this skill, and never invent evidence that is missing. A missing
source is reported as missing, never as passed.

## Available Operations

| Operation | Description                                                                                     | Flow                                   |
| --------- | ----------------------------------------------------------------------------------------------- | -------------------------------------- |
| Generate  | Collect the evidence, run the hard validations fresh, write the summary and one file per story  | [flows/generate.md](flows/generate.md) |
| Sign off  | Walk the human through the report and record the architecture sign-off (the human only)         | [flows/sign-off.md](flows/sign-off.md) |
| Package   | After sign-off, commit and push the final artifact on the feature branch, ready to open as a PR | [flows/package.md](flows/package.md)   |

## Shared Steps

| Step             | Description                                                                | File                                                   |
| ---------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| Collect evidence | Read every source, run the hard validations fresh and attribute to stories | [steps/collect-evidence.md](steps/collect-evidence.md) |
| Check report     | Consistency and completeness check of the written report                   | [steps/check-report.md](steps/check-report.md)         |

## Routing

If the intent is not clear from the request, look at `.zapper/run/output-report/summary.md`:

- No report yet, or the user wants it refreshed → **Generate**.
- A report exists with `sign-off: pending` and the user wants to review or approve it → **Sign off**.
- A report exists with `sign-off: signed-off` and the user wants the PR-ready branch → **Package**.

When still ambiguous, ask: "Do you want to **generate** the report, **sign off** the run, or
**package** the final artifact?"

An autonomous run (for example under `/goal`) may only run **Generate**. Sign-off is a human
decision: never set it, and never package before it.
