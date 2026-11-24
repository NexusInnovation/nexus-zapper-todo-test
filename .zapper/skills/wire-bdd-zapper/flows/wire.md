# Wire

First run: makes the approved suite executable in the project's test setup, with an empty shell,
and gives the `.feature` files their single home in the test project.

## Before Starting

1. Read [../references/wiring-contract.md](../references/wiring-contract.md) and, from
   `generate-bdd-zapper`, `references/execution-contract.md`.
2. Read `.zapper/behaviour-driven-development/README.md`. If `status` is not `approved`, stop and
   send the user to the **Review** operation of `generate-bdd-zapper`: only an approved suite is
   wired. If `run-command` is set and `features-path` is in the test project, the suite is already
   wired: switch to [update.md](update.md).
3. Read `.zapper/config.md` for the stack, the `build`, `unit-test` and `e2e` commands, the language
   and the `protected-paths`. Never create or change a file in a protected path.
4. List the `.feature` files of `features-path`. None → stop and tell the user to run
   `generate-bdd-zapper`.
5. Check the working tree with `git status`: note what is already uncommitted so the wiring's own
   changes can be told apart.

## Step 1: Detect the stack and the test infrastructure

Read-only. Look at the repository itself:

- The languages and build files (manifests, solution and project files, lock files, the package
  manager in use) and the test projects and frameworks already present, with where they live and
  how they are named.
- Any Gherkin tooling already there (a runner, its configuration, `.feature` files outside
  `.zapper/`, step definitions).
- How the existing tests are run (the commands of `.zapper/config.md`, scripts, CI) and what they
  need (browser, database, container, running application).
- The `# language:` header of the features, and the tags they use (`@manual`, requirement tags).

Summarise in a few lines: stack, test locations, existing Gherkin tooling, conventions.

## Step 2: Decide the runner

Follow the case that applies:

- **A Gherkin runner already exists** and can read the suite: reuse it. Confirm with the user; no
  new dependency.
- **A test project exists but no Gherkin runner**: propose the runner that plugs into the same
  language and test host.
- **No test infrastructure**: propose a runner and the minimal test project that hosts it.

For a proposal, fetch the candidate's documentation live (documentation tools or the web) and check
it against the contract: tag filters, the feature language, Cucumber JSON or JUnit XML with tags,
and reporting missing steps as undefined instead of failing before the result file (see
[Zero step definitions](../references/wiring-contract.md#zero-step-definitions)).

Present the recommended option first, with the alternatives, and for each: the dependency it adds,
where the test project and the features folder will live, and the trade-offs. With a human present
ask with the ask-the-user tool and wait for approval; if the team declines, stop with no change.
In an unattended run, follow the Decision rule of the contract.

## Step 3: Build the shell

Create only what [the contract](../references/wiring-contract.md#the-shell) lists, in this order:

1. The test project or the location inside the existing one, with its dependencies added through
   the package manager.
2. The runner configuration, bound to the folder the features will be moved to (choose the folder
   with the project's conventions, for example a `features` folder in the test project) and to
   `.zapper/behaviour-driven-development/results/` for the result file.
3. The empty hooks and the reporting.
4. The single run command, its `@manual` exclusion and its single-tag variant.
5. The Git ignore rules.

Write no step definition, no fixture and no application code, and change no existing test.

## Step 4: Move the features

Follow [../steps/move-features.md](../steps/move-features.md).

## Step 5: Record the contract

Follow [../steps/record-contract.md](../steps/record-contract.md).

## Step 6: Verify

Follow [../steps/verify-run.md](../steps/verify-run.md). If it fails, fix the shell and run it
again; never edit a `.feature` file to make it pass. If it still fails, stop and report the output.

## Step 7: Hand over

Tell the user what was created (project, runner, run command, features location), that the wiring
is left uncommitted for them to commit on the feature branch (the `.feature` move and the shell may
go in one commit), and that the step definitions are written by the implementation run. Never
commit on the default or a protected branch.

## Checklist

- [ ] The suite was `approved` and its `status` is unchanged.
- [ ] The runner choice was approved (or reuse confirmed), and is recorded in the README.
- [ ] No `.feature` file is left under `.zapper/behaviour-driven-development/`; the files are
      byte-identical at their new place and `features-path` names it.
- [ ] The shell has no step definition, no fixture and no project behaviour; no existing test or
      protected path was changed.
- [ ] `run-command`, `result-format` and `result-file` are recorded and the verification passed.
