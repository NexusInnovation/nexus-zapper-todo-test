# Wiring contract

What the wiring delivers, what it never does, and who owns what. It is stack-agnostic: the runner
is the project's (or the one the team approves), and the contract it must satisfy is
`generate-bdd-zapper`'s `references/execution-contract.md`.

## The shell

The wiring creates the shell below and nothing else.

| Part            | Rule                                                                                                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test project    | The project's existing test project when it can host the runner; otherwise a new one beside the existing tests, following their naming, folder, language and package-manager conventions. The location is part of the decision.                                                                    |
| Runner          | A Gherkin runner that reads the `.feature` files in place, supports tag filters and the language of the features (`# language:` header), and emits Cucumber JSON or JUnit XML with the scenario tags.                                                                                              |
| Feature binding | The runner reads the folder the features were moved to, with the layout `<story-slug>/<story-slug>.feature` (and `nfr-<category>/…`) preserved. It never reads a copy.                                                                                                                            |
| Hooks           | The runner's lifecycle hooks (before or after the run, the scenario, the step) only where it needs them to emit results. Empty of project behaviour: no application start, authentication, data or fixture. They are the extension point of the implementation run. Zapper and Git hooks are not created here. |
| Reporting       | The result file in the declared format, written under `<suite folder>/results/` and overwritten on every run, carrying each scenario's tags.                                                                                                                                                      |
| Run command     | One command, from the repository root, with no argument (a script or task-runner entry when the runner needs several tools). It excludes the `@manual` scenarios by a tag expression, and a documented variant runs a single tag.                                                                  |
| Ignore rules    | Generated sources and `results/` are ignored by Git; the features and the shell files are not.                                                                                                                                                                                                    |

Dependencies are added with the project's package manager (never by hand-editing a lock file).
Shared configuration files get the smallest possible change, next to what they already hold.

## Zero step definitions

The command must run, and produce its result file, with no step definition at all:

- A step with no definition is reported as `undefined` (or the runner's equivalent), never skipped
  silently, never turned into a generation or compile error that prevents the result file.
- The exit code is non-zero, as the contract says for undefined and pending scenarios.
- When the runner's default aborts on missing steps, use its documented option to report them
  instead (read the runner's documentation live). A runner that cannot be configured so is not a
  candidate.

## Glue ownership

The glue is every step definition, fixture and helper, and any hook body beyond the empty shell.
The project and the implementation run own it; the regression baseline stage writes the glue of its
own scenarios, after the wiring.

- The wiring never writes it, and never edits an existing test of the project.
- A re-run creates only the shell files that are missing. It never overwrites, deletes, renames or
  reformats an existing file of the test project: a shell file that was changed counts as glue.
- Glue that no longer matches a scenario (a removed or renamed step) is reported, not removed.

## Single copy of the features

- The `.feature` files are moved, never copied. After the move there is none left under
  `.zapper/behaviour-driven-development/`, and `features-path` names the new folder. Every stage
  locates them through `features-path`.
- A move does not change content: the files are byte-identical before and after, so the move is not
  a change to the suite and the `status` of the README is left untouched. Once `approved`, the
  files stay read-only to agents wherever they live.
- The per-story `results.md` files and `results/` stay under `.zapper/behaviour-driven-development/`:
  they are results of the Zapper stage, not features.

## Decision

Choosing a runner, a framework, a dependency or a new test project is a decision for the team.
With a human present, propose it and wait for approval. In an unattended run (`/goal`), assume the
most reasonable option, preferring what the project already has, mark it `TODO(<ID>)` where it
lands and record it in `.zapper/run/decisions.md`, as `.zapper/goal.md` requires.

## Other suites

The regression baseline (`regression-baseline-zapper`) reuses this skill for its own suite. The
caller then gives the suite's folder and README, the contract to follow and the existing suites to
include in the single command. The rules above apply unchanged, with these differences: the fields
are written to the caller's README, no other field of it changes, and the `.feature` files stay
where the caller keeps them (read in place by the runner, still never copied) unless the caller's
README has a `features-path` of its own.
