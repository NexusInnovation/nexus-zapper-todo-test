---
name: wire-bdd-zapper
description: "Wires the approved BDD suite of .zapper/behaviour-driven-development/ into the target project's own test setup: detects the stack, reuses its Gherkin runner or proposes one for human approval, moves the .feature files into the test project (single copy), creates the empty shell only (project, runner, hooks, reporting, no step definitions), records the run contract in the BDD README, and proves one command runs the suite with machine-readable results. Re-runnable without losing glue. Stack-agnostic.
  USE FOR: zapper wire BDD, make the BDD suite runnable, set up a Gherkin runner (Reqnroll, playwright-bdd, Cucumber...), move the features into the test project, re-sync the wiring after a BDD update.
  DO NOT USE FOR: writing or editing .feature files (use `generate-bdd-zapper`), step definitions or application code, the project's own unit or end-to-end tests."
---

# Wire BDD (Zapper)

Makes the approved suite of `.zapper/behaviour-driven-development/` executable with the project's
own tooling, and gives its `.feature` files one home inside the test project. It delivers the
**empty shell** only: the step definitions (glue) stay the job of the implementation run. The rules
of the shell, the single copy and the glue ownership are in
[references/wiring-contract.md](references/wiring-contract.md); the run and result contract it must
satisfy is the one of `generate-bdd-zapper` (`references/execution-contract.md`).

The sources of truth are the BDD README, `.zapper/config.md` and the target codebase: read them
live on every run. Runner configuration, versions and options come from the runner's own
documentation, fetched live; never copy them into this skill.

## Available Operations

| Operation | Description                                                                                                    | Flow                               |
| --------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Wire      | First run: detect the stack, decide the runner, build the shell, move the features, record the contract, verify | [flows/wire.md](flows/wire.md)     |
| Update    | Re-run after an approved BDD update: re-sync the features and the shell, keep the glue, verify again           | [flows/update.md](flows/update.md) |

## Shared Steps

| Step            | Description                                                              | File                                                 |
| --------------- | ------------------------------------------------------------------------ | ---------------------------------------------------- |
| Move features   | Move the `.feature` files into the test project, byte-identical, no copy | [steps/move-features.md](steps/move-features.md)     |
| Record contract | Write the location and run contract into the BDD README                  | [steps/record-contract.md](steps/record-contract.md) |
| Verify run      | Prove one command runs the suite and writes machine-readable results     | [steps/verify-run.md](steps/verify-run.md)           |

## Routing

If the intent is not clear from the request, read the frontmatter of
`.zapper/behaviour-driven-development/README.md`:

- `run-command` empty, or `features-path` still under `.zapper/` → **Wire**.
- `run-command` set and `features-path` in the test project → **Update**.

When still ambiguous, ask: "Do you want to **wire** the suite for the first time, or **update** an
existing wiring?"
