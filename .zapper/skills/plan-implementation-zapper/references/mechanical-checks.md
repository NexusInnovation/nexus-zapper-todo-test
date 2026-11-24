# Mechanical checks

[check_plan.py](../scripts/check_plan.py) uses only the Python 3.10+ standard library. It reads
the workspace's `.zapper/run/plan/` and `.zapper/behaviour-driven-development/stories/`, writes
nothing, prints errors/warnings and exits 1 on invalid or unreadable inputs (0 otherwise).

## Supported conventions

- Keep the English section headings and five-column index table of the templates; prose may use
  the `language` of `.zapper/config.md`. Block dependencies are comma-separated index numbers or `—`.
- Requirement IDs use `<lowercase-kebab-key>-R<two digits>`; active IDs come from Gherkin tag
  lines, not comments, retired notes or a separate requirements file.
- **Requirements** and the index accept explicit IDs or full-ID ranges using `…`, `...`, `–`
  or `to`. **Scenarios** contains only explicit owned `@ID` tags and feature links. Put notes
  mentioning another owner's tags outside that section.
- Every ID has one scenario owner, even when multiple blocks contribute to it. IDs on the same
  consecutive Gherkin tag group must have the same owner.
- A block whose **Requirements** include a non-functional ID (`nfr-<category>-R<nn>`) has a
  **Non-functional strategy** section that names each of those IDs. The checker verifies that the
  ID is named, not that the strategy is sound.
- Hypotheses use `## <key>-H<nn>: <title>`, **Marker** with one matching `TODO(ID): ...`,
  and **Where** with the authoritative code placement. Counts are definitions owned by the
  block, not all references it consumes. Decisions use the decision template's ID/status/approval.
  A decision `Category` (`architecture`, `dependency`, `schema-contract`, `data-access`, `security`,
  `infra`, `scope`) that is present must be one of them (error); a missing one, or no approved
  decision of category `scope`, is a warning. That every category was considered stays a semantic
  check of the [coverage check](../steps/coverage-check.md).
- Local inline Markdown links are checked, including URL-encoded paths and `<angle-wrapped>`
  destinations. Remote URLs and fragment identifiers are not fetched or validated.
- A future-file link is immediately followed by literal `(planned)`, on the same line, and must
  resolve inside the workspace but outside the plan and the input/BDD sources. It produces a warning; never use this to
  excuse a missing plan file or a missing source reference.
- Child files stay directly in their block folder, are listed under **Children**, and link back
  to the principal block. Principal blocks over 150 lines produce warnings, not errors.

## Limits

This is a constrained Markdown/tag checker, not a Markdown, YAML or Gherkin compiler. It does not
interpret inherited feature/rule tags, expand scenario outlines, validate code snippets or check
Markdown reference-style links, images, link titles or heading anchors. Use explicit requirement
tags on each scenario and template-style inline links. Unsupported conventions require manual
inspection and must not be presented as automatically verified.

It cannot establish that a requirement is understood correctly, an assumption is safe, a declared
future file will exist, a library supports a feature, or two blocks agree semantically. It does not
verify that TODOs have been added to implementation code (this is a planning check). It cannot
reconstruct removed historical IDs to prove non-reuse. These remain review/update responsibilities.
It does not replace the human gate or the independent sanity check.

## Maintaining the checker

Run its dependency-free regression tests from any working directory:

```text
python <skill-directory>\scripts\test_check_plan.py
```

Tests create isolated temporary workspaces and remove only their own fixtures. Changes to the
templates or supported syntax must update these tests too.
