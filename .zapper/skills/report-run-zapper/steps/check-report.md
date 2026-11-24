# Check report

Verifies the written report before it is shown. Fix what fails; never fix by hiding evidence.

## 1. Completeness

- `summary.md` has every section of [../references/report-layout.md](../references/report-layout.md)
  in order (except **Cross-cutting findings** when empty), and its frontmatter is complete. No
  `<placeholder>` is left.
- The **Verdict** has its eight rows, each with a computed status: no success criterion is missing,
  and a failed, `not run` or `not available` one is listed with its reason, never dropped.
- The **Commits**, **Deviations and out-of-scope changes**, **Follow-ups outside the code** and
  **Run cost, duration and human interventions** sections are present and filled from their sources:
  a stage with no cost, duration or intervention count says `not available` and is a known risk.
- There is one file in `stories/` per story of `.zapper/input/stories/`, and nothing else in
  `.zapper/run/output-report/`.
- The report is written in the `language` of `.zapper/config.md` (headings and prose), with the
  parsed tokens left in English as the layout says.

## 2. Consistency

- Totals in the **Stories** table of the summary equal the totals of each story file; the BDD part of
  the **Verdict** row 1 agrees with them and with the **Non-functional requirements** table, and its
  regression part agrees with the **Regression baseline** table.
- The **Non-functional requirements** table has one row per requirement tagged in the
  `nfr-<category>` folders of the suite, none missing; every `manual` row states its reason and is
  repeated in **Known risks**; every performance row has a threshold and states the dataset it
  ran on (or is `not available`).
- Every failed or skipped regression scenario or test names an area that exists in the inventory.
- `hard-validations` is `passed` only if rows 1 to 6 of the verdict pass; `sign-off` is `blocked` if
  it is not, and never `signed-off` after a generation.
- The **Commits** table has one row per commit of the branch, in the order of `git log --reverse`,
  and every block of the plan has a commit, a passed check recorded in `.zapper/run/report.md` (a
  block that changes nothing), or is named as a defect.
- Every deviation, out-of-scope change and unrecorded item of the other sections is in
  **Deviations and out-of-scope changes** and, when unrecorded, in **Known risks**.
- The figures of **Run cost, duration and human interventions** equal the rows of
  `.zapper/run/metrics.md`, the `report` row included, and the total adds exactly those rows.
- Every failed or skipped scenario names a requirement ID that exists in the suite.
- Every `D<nn>` cited in a story file or in the summary exists in a decision log.
- Every `TODO(<ID>)` marker found in the code is in **Open hypotheses**.

## 3. Honesty

- Every figure has a source; a missing source reads `not available`, and each missing source is in
  **Known risks**.
- No pass was stated that was not established by a fresh run at the recorded `commit`.
- No secret (connection string, key, token, password) was copied from a log or an output into the
  report: findings cite the file and line, never the value.
- Each unrecorded deviation, decision neither approved in the plan nor logged as a deviation,
  out-of-scope change (a screen, route or module outside `.zapper/input/scope.md` and the plan's
  `scope` decision), or `deviation` of the architecture review without an approved decision appears
  in **Known risks**.
- Every entry of `.zapper/run/decisions.md` appears in the **Decisions** section, flagged as a
  deviation from the plan, and every `A<nn>` decision has its `TODO(A<nn>)` in the code.

## 4. Links

Intra-report and outward links (summary ↔ stories ↔ input ↔ feature file) resolve to existing
files.
