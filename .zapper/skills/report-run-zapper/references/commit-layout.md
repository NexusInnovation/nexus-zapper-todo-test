# Commit layout

How the `/goal` run writes the commit messages of the feature branch, so that **Generate** can trace
each commit to its plan block, its stories and its decisions
([sources.md](sources.md), **Commit history**).

## Message

Conventional, following `.zapper/config.md` and the repository (`docs/04-Branches-Et-PR.md`):
`{type}({scope}): {what and why}`, then these trailers in the body, one per line. Each trailer is
`Key: value` with nothing after the value, no parenthesis or comment:

```text
Block: <block-slug>
Stories: <story-key>[, <story-key>]
Decisions: <D<nn> or TODO(<ID>)>[, <D<nn> or TODO(<ID>)>]
```

- `Block` is the plan block the commit belongs to, or `none` for a commit that belongs to no block.
- `Stories` lists the stories whose requirements the block covers; omit it when there is none.
- `Decisions` is present only when a decision or an open hypothesis applies.

## Units and kinds

- One block after the other, in the order of the **Building blocks** table of
  `.zapper/run/plan/README.md` (the `bdd-runner` block first). A block is finished and committed
  before the next one is committed; when blocks are implemented in parallel, commit them one at a
  time in table order. Never one commit at the end and never one commit per file.
- Inside a block, one commit per kind, in this order: the production code (`feat` or `fix`), the
  test glue (`test`: step definitions, fixtures, unit and e2e tests), the documentation and ADRs
  (`docs`: `docs/` and decision records). The shared glue of the `bdd-runner` block is its own `test`
  commit. A kind with no change has no commit; two kinds are never mixed in one commit, and two
  blocks are never mixed either.
- Each commit builds: commit only when the `build` commands succeed and the tests touched by the
  change pass, and record that result in `.zapper/run/report.md` (SHA, command, result).

## Out-of-plan changes

A change no block's touchpoints name, or a fix to the code of an earlier block, gets its own commit,
with `Block: none` (or the earlier block's slug) and the assumed decision marked `deviation` in
`.zapper/run/decisions.md`. Never fold it into the commit of the block being worked on. The log keeps
reading in the plan's order: the report judges the order on the first commit of each block, and
lists a later fix of an earlier block as a fix of that block, not as an order defect.

## History and evidence

- Never rewrite history (no `--amend` of a pushed commit, no squash, no rebase, no force-push). Fix
  forward with a new commit.
- Stage by explicit path, never `git add -A`; check `git status` before each commit so no file of
  another block or kind slips in.
- Push the feature branch after each commit, or at least at each completed block.
- Never commit `.zapper/run/` evidence files in the same commit as code: use a separate `chore:`
  commit (`Block: none`), or leave them uncommitted if the config says so. Make that commit before
  generating the output report, so the report's `commit` is the last commit of the run.
