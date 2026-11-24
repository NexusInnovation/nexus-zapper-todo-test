# Zapper

Zapper is a local [Agent Plugins 1.0](https://agent-plugins.org/) plugin for running
project-agnostic generation stages with GitHub Copilot CLI.

## Prerequisites

- GitHub Copilot CLI with access to plugins, or VS Code with GitHub Copilot and agent plugins
  available
- A trusted working directory

## Load the plugin

### Copilot CLI

From the repository root, start Copilot CLI with:

```powershell
copilot --plugin-dir .zapper
```

In the interactive session, run `/skills list` and confirm that `workspace-check-zapper` is
available.

### VS Code

1. Open the Command Palette and run **Chat: Install Plugin from Source**, or open **Chat: Open
   Customizations**, select **Plugins**, and select **+** next to **Workspace** (or **User**).
2. Enter the absolute path of the `.zapper` folder, for example `C:\path\to\repository\.zapper`.
3. Select the **Copilot** agent harness and confirm that `workspace-check-zapper` appears in
   **Configure Skills**.

If you change the plugin after installing it, install it again to pick up the changes.

## Set up a project

Everything a run needs is in `.zapper/`: no personal skill and no extra prompt. Project-specific
facts live in one file, [`config.md`](config.md) (stack, build, lint, test, e2e and security
commands, language, protected environments and paths, critical areas, the realistic-volume
performance dataset); the skills and `goal.md`
never name the host project.

1. Copy [the template](skills/workspace-check-zapper/assets/config.md) to `.zapper/config.md`, fill
   it in and have the team set `status: approved`. Skip this when the file already exists.
2. Run the stages in order, each one approved by the team before the next:

| Stage                | Skill                         | Output                                  |
| -------------------- | ----------------------------- | --------------------------------------- |
| Refine input         | `refine-input-zapper`         | `.zapper/input/`                        |
| Generate BDD         | `generate-bdd-zapper`         | `.zapper/behaviour-driven-development/` |
| Wire BDD             | `wire-bdd-zapper`             | Test project shell, `features-path` and run contract in the BDD `README.md` |
| Regression baseline  | `regression-baseline-zapper`  | `.zapper/regression-baseline/`          |
| Plan implementation  | `plan-implementation-zapper`  | `.zapper/run/plan/`                     |
| Report run           | `report-run-zapper`           | `.zapper/run/output-report/`            |

The BDD suite is derived from the stories and from `non-functional-requirements.md`: each
non-functional requirement has an ID and an executable check (performance checks run on the
configured dataset, with thresholds approved with the suite), or a `@manual` check listed in the
report.

## Check the workspace

Ask Copilot to run the preflight (read-only):

```text
Run the workspace-check-zapper stage.
```

It checks the configuration, the input, the BDD suite and the plan (all approved) and the branch,
and tells you what is missing. A repository that holds all of them reaches `/goal` right away.

## Layout

```text
.zapper/
├── plugin.json
├── skills/                         # Portable Zapper stages
├── scripts/                        # Tool checks and hooks (skill description and goal length, goal gate)
├── com.github.copilot/
│   ├── agents/                     # Copilot CLI agent definitions
│   └── hooks/
│       └── hooks.json              # Copilot CLI lifecycle hooks
├── goal.md                         # General goal of every run, launched with /goal
├── config.md                       # The project: commands, language, protected areas
├── input/                          # Reusable refined input
├── behaviour-driven-development/   # Requirements, run command and last results (README.md)
├── regression-baseline/            # Reusable inventory of the existing behaviour touched, regression features, and results
└── run/                            # The active run
    ├── plan/                       # Approved plan; its decisions.md holds the decisions approved before the run
    ├── decisions.md                # The one log of the decisions assumed during the run (deviations from the plan)
    ├── hooks.log.jsonl             # Result of the goal gate (written by the hook)
    ├── report.md                   # Evidence log kept up to date during the run
    ├── metrics.md                  # Cost, duration and human interventions of each stage
    └── output-report/              # Final report: summary.md and one file per story
```

`plugin.json`, `skills/`, `scripts/`, `com.github.copilot/` and `goal.md` are Zapper tool files. They must
remain project-agnostic. These paths are the only ones every stage reads and writes.

The `.feature` files have one copy. Their folder is the `features-path` of
`behaviour-driven-development/README.md`: first the `stories/` folder next to it, then the test
project once the runner is wired (the files are moved, never copied).

Stages write their results back: the BDD run command, result file and last results in the
`behaviour-driven-development/README.md`, the regression run command and `baseline` markers in
`regression-baseline/README.md`, the plan's approval in `run/plan/README.md`, the final verdict in
`run/output-report/`.

Copilot CLI limits a skill `description` to 1024 characters. Keep the `description` in the
`SKILL.md` frontmatter of every Zapper skill (name, `USE FOR` and `DO NOT USE FOR` included) at
1024 characters or fewer, and aim for 900 or fewer to keep a safety margin. Move detail into the
skill body. Check it with:

```powershell
node .zapper/scripts/check-skill-descriptions.mjs
```

The script fails above 1024 characters and warns above 900. The repository pre-commit hook
(`src/frontend/.husky/pre-commit`) runs it with `--staged` whenever a `.zapper/skills/*/SKILL.md` is
staged, so it checks the indexed content rather than the working-tree files.

The goal condition is limited to 4000 characters. Keep `goal.md` at 4000 characters or fewer (line
breaks count as one), and aim for 3900 or fewer. Move detail into a reference of the skill that
owns it (for example the commit and metrics layouts of `report-run-zapper`) and point to it from the
goal. Check it with:

```powershell
node .zapper/scripts/check-goal-length.mjs
```

The script fails above 4000 characters and warns above 3900. The pre-commit hook runs it with
`--staged` whenever `.zapper/goal.md` is staged.

## Launch a run

Once the configuration, the input, the BDD suite, the regression baseline and the plan are approved,
and the baseline passes (`baseline: passed` in `.zapper/regression-baseline/README.md`), start
Copilot CLI with the plugin (`copilot --plugin-dir .zapper`) on a feature branch and run the goal
with a spend cap:

```text
/goal Achieve the objective of .zapper/goal.md --max-ai-credits <N>
```

The plan is the decision gate. Its decisions cover the architecture and new dependencies, schema and
contract changes, data access paths (for example a write to a legacy system), security-relevant
choices, the infrastructure the run needs, and the scope (screens, routes and modules in and out):
approving the plan is the human approval of those decisions, and the run asks for none. The
`goal-gate` hook (`com.github.copilot/hooks/hooks.json`, `scripts/goal-gate.mjs`, Node) enforces it:
once a session launches `/goal ... .zapper/goal.md`, it denies every tool except the read-only ones
until the configuration, the refined input, the BDD suite, the regression baseline (`baseline:
passed`) and the plan are `status: approved` and no plan decision is `proposed`. Run it from the
repository root, which is where Copilot CLI starts with `--plugin-dir .zapper`. Its tests:
`node --test .zapper/scripts/goal-gate.test.mjs`.

During the run, a choice the plan does not cover is assumed, marked `TODO(A<nn>)` in the code and
logged in `.zapper/run/decisions.md` as a deviation from the plan; the report lists it and the human
approves or rejects it at sign-off. Work outside the scope (a screen, route or module the refined
input does not name) is forbidden, not assumed.

`config.md`, `input/`, `behaviour-driven-development/` and `regression-baseline/` are reusable
across multiple runs. A run's plan and generated outputs belong in `run/`.

## After the run

The run ends by generating the output report (`report-run-zapper`, **Generate**). Open
`.zapper/run/output-report/summary.md`: it lists every success criterion with its computed status,
the commit history against the plan's order, the deviations, the follow-ups outside the code, and
the cost, duration and human interventions of each stage. The report is written in the `language`
of `config.md`. The hard validations must pass at 100%, then you judge
whether the architecture meets the standards and run **Sign off**. **Package** then commits and
pushes the feature branch, ready for you to open as a pull request into the default branch.
