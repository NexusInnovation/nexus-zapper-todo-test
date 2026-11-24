# Verify run

Proves the contract holds: one command runs the whole suite and writes machine-readable results,
even with no step definition. Contract: `generate-bdd-zapper`'s
`references/execution-contract.md`.

## Steps

1. Read `run-command`, `result-format` and `result-file` from the README. Remove the previous
   `result-file`, so that an old report is never read as the new one.
2. Run `run-command` once from the repository root, with no argument. A non-zero exit code is
   expected while scenarios are undefined or failing; only a command that stops without a result
   file is a failure.
3. Check the result file:
   - It exists, is in the declared format and parses (Cucumber JSON, or well-formed JUnit XML).
   - Each scenario of the `.feature` files appears in it, `Scenario Outline` examples included,
     except the `@manual` scenarios, which must be absent. Compare the counts and the names.
   - Each scenario carries its requirement tags in the result (Cucumber JSON `tags`; for JUnit XML,
     in the name or a `properties` entry), so the results map to the requirements.
   - With no step definition, every scenario is reported `undefined` (or the runner's equivalent)
     and the exit code is non-zero: nothing passes by default, nothing is skipped, nothing aborts.
     With existing glue, only the completeness of the file is checked; when the glue needs
     infrastructure the user must start (database, browser, application), report what is missing
     instead of changing the shell or the glue.
4. Run the single-tag variant recorded in the README once, with a tag of the suite, and check that
   only the scenarios of that tag are in its result.
5. Report the totals (scenarios found, per status), the exit code and the paths. Do not write
   `results.md` or the **Last run** column: the Run operation of `generate-bdd-zapper` records the
   results.

## On failure

Show the output and the check that failed. Fix the shell, never a `.feature` file, and run the
steps again.
