# Record contract

Writes where the features are and how the suite runs into
`.zapper/behaviour-driven-development/README.md`, which the hooks, `/goal` and the report read.

## Frontmatter

Set these fields, repository-relative, with the exact values the verification will use
(`features-path` is already written by the [move](move-features.md); confirm it):

| Field           | Value                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `features-path` | The features folder of the test project                                                        |
| `run-command`   | The single command, from the repository root, with no argument                                 |
| `result-format` | `cucumber-json` or `junit-xml`                                                                 |
| `result-file`   | The file the command writes, under `results/`, relative to `.zapper/behaviour-driven-development/` |

Change no other field: `status` stays as it is.

## Execution section

Replace the sentence of the **Execution** section about the runner with what a reader needs to run
and read the suite, kept short:

- The runner and the test project (path), and the folder the glue goes in.
- The command that runs a single tag, for example one requirement.
- That `@manual` scenarios are excluded from the command and that scenarios with no step
  definition appear as `undefined` with a non-zero exit code.

Keep the rest of the README as it is.
