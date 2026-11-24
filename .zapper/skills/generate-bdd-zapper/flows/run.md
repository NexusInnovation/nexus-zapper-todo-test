# Run

Runs the whole suite with its single command and records the results per story. Contract:
[../references/execution-contract.md](../references/execution-contract.md).

## Before Starting

1. Read [../references/execution-contract.md](../references/execution-contract.md).
2. Read `.zapper/behaviour-driven-development/README.md` for `features-path`, `run-command`,
   `result-format` and `result-file`.
3. If `run-command` is empty, stop and tell the user the suite is not runnable yet: the project
   has no runner until implementation generates the glue. Do not invent results and do not create
   a runner here.

## Step 1: Run the suite

Remove or archive the previous `result-file` before running, so that a report left by an earlier
run can never be read as the current one. Then run `run-command` once from the repository root. A
non-zero exit code is a normal outcome when scenarios fail; only a missing or unreadable
`result-file` is a failure of the run itself: in that case do not update `results.md` or **Last
run**. Never edit a `.feature` file to make the suite pass.

## Step 2: Read the results

Parse `result-file` in `result-format` and map each scenario to its requirement IDs through its
tags, as described in the contract. Scenarios without a requirement tag, or whose tag matches no
current acceptance criterion or non-functional requirement, are reported as orphans. Read the
`@manual` scenarios from the `.feature` files: they are not in the results. A requirement whose
scenarios are all `@manual` gets the status `manual`; for a requirement that also has automated
scenarios, keep the status of its automated results and list its manual scenarios apart.

## Step 3: Record the results

- Keep the raw output in `results/`, overwriting the previous run.
- Write `stories/<story-slug>/results.md` for every story and every non-functional category, using
  the format of the contract.
- Update the **Last run** column of `README.md` with each row's outcome (`passed`, `failed`,
  `not run`; `manual` when every requirement of the row is manual).
- Do not change `status` in `README.md`: running the suite is not a change to the suite.

## Step 4: Report

Tell the user the totals (requirements passed, failed, not run, manual), list the failed
requirements with their first failing step, the manual ones with their reason, and report orphan
scenarios, unmapped results and requirements with no result.

## Checklist

- [ ] The previous `result-file` was removed first, and the command ran once and produced a new
      `result-file` in the declared format.
- [ ] Every story has an up-to-date `results.md`, and `README.md` shows each last run outcome.
- [ ] No `.feature` file or `status` was modified.
