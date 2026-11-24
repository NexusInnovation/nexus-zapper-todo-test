# Update

Re-run after an approved BDD update: re-syncs the features and the shell with the suite, keeps the
glue, and proves the command still runs. Triggers include stories or non-functional categories
added, removed or renamed in the suite, a features folder that moved, and a shell file that went
missing.

## Before Starting

1. Read [../references/wiring-contract.md](../references/wiring-contract.md).
2. Read `.zapper/behaviour-driven-development/README.md`. If `status` is `draft`, stop: the suite
   must be walked through and approved first (**Review** of `generate-bdd-zapper`). If `run-command`
   is empty or `features-path` is still under `.zapper/`, switch to [wire.md](wire.md).
3. Read `.zapper/config.md` for the `protected-paths`.

## Step 1: Find what changed

Compare, without changing anything:

- The `.feature` files in `features-path`, and any `.feature` left under
  `.zapper/behaviour-driven-development/` (stories written there before the move), against the
  **Stories** table of the README.
- A `.feature` file with no row in the table, or a row with no file: report it, never delete.
- The shell: the runner configuration, hooks, reporting, run command and Git ignore rules of the
  [contract](../references/wiring-contract.md#the-shell) are all still present, and the runner's
  dependency is still declared.

## Step 2: Move the stray features

Follow [../steps/move-features.md](../steps/move-features.md) for the `.feature` files found outside
`features-path`. Nothing to move → skip.

## Step 3: Repair the shell

Create only the shell files that are missing, from the existing configuration's conventions.
Never overwrite, delete, rename or reformat an existing file of the test project. If the runner
itself must change (a new decision), follow the Decision rule of the contract and
[wire.md](wire.md#step-2-decide-the-runner).

## Step 4: Report the glue that no longer matches

List the step definitions that match no step of the current scenarios (a removed or renamed
scenario or story) and the scenarios without a step definition. Report them for the implementation
run; do not edit or remove any glue.

## Step 5: Record the contract

Follow [../steps/record-contract.md](../steps/record-contract.md), changing only the fields whose
value changed.

## Step 6: Verify

Follow [../steps/verify-run.md](../steps/verify-run.md). With existing glue, scenarios may pass,
fail or be undefined: the check is that the command runs and writes a complete result file.

## Checklist

- [ ] No `.feature` file is left under `.zapper/behaviour-driven-development/`; the move was
      byte-identical and `status` is unchanged.
- [ ] No existing glue or test file was overwritten, deleted or reformatted.
- [ ] Orphan features, orphan glue and scenarios without glue were reported.
- [ ] The verification passed.
