# Move features

Moves the `.feature` files of the suite into the test project, so that they have one copy, at
`features-path`. Used by [wire](../flows/wire.md) and [update](../flows/update.md).

## Rules

- **Sources**: every `.feature` file under `.zapper/behaviour-driven-development/` (the `stories/`
  folder, or any other place the suite wrote them).
- **Target**: the features folder of the test project (the current `features-path` when it is
  already in the test project). Keep the layout `<story-slug>/<story-slug>.feature` and
  `nfr-<category>/nfr-<category>.feature`.
- **Move, never copy.** Use `git mv` for tracked files (the history follows them), the file system
  move otherwise. Never copy and delete, and never leave a duplicate.
- **Byte-identical.** Compute a SHA-256 hash of every source file before the move and compare it
  with the file at its target after: no line-ending, encoding, header or whitespace change. A
  difference stops the step.
- **Never overwrite.** When the target already holds a file at the same relative path: identical
  content → drop the source (it is already moved); different content → stop, show both versions
  and ask the user which one is current. Do not guess.
- The per-story `results.md` files and `results/` stay where they are.

## Steps

1. List the sources and their hashes.
2. Create the target folders and move the files.
3. Verify: every target hash equals its source hash, and no `.feature` file remains under
   `.zapper/behaviour-driven-development/`.
4. Re-point the links of the **Stories** table in the README to the new location (relative to the
   README), without changing the counts, the last run or `status`.
5. Write `features-path` in the README frontmatter right away (the other fields wait for
   [record-contract.md](record-contract.md)), so that an interrupted wiring can be resumed: the
   files are always found through `features-path`.
6. Re-point the plan: when `.zapper/run/plan/` exists, replace in its Markdown files every link to
   a moved `.feature` file (and to the `stories/` folder) with the link to its new place, relative
   to the plan file, changing nothing else. `check_plan.py` compares those links with the exact
   paths of the sources, so a link left on the old location fails the validation of an approved
   plan. Run `check_plan.py` afterwards when the plan was already approved.

If a hook or a protection makes the `.feature` files read-only to agents, the move is blocked: ask
the user to allow or perform it. Never bypass the protection.
