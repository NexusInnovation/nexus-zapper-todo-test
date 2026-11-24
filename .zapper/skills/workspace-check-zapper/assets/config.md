---
status: draft
language: <code of the language of the generated artifacts, for example en>
default-branch: <name>
stack:
  - "<Backend: language, framework, data access, test framework>"
  - "<Frontend: language, framework, package manager, test frameworks>"
  - "<Infrastructure and pipelines>"
instructions:
  - "<Repository instruction file or skill the run must follow>"
commands:
  build:
    - "<command>"
  lint:
    - "<command>"
  unit-test:
    - "<command>"
  e2e:
    - "<command>"
  security:
    - "<command>"
protected-environments:
  - "<environment a run must never touch, for example prod>"
protected-paths:
  - "<path a run must never modify>"
critical-areas:
  - "<area where a change is a major decision, with where it lives>"
performance-dataset:
  kind: "<anonymized-copy | volume-seeder>"
  volumes:
    - "<table or entity: order of magnitude of rows>"
  load-command: "<command or documented procedure that loads the dataset into the test environment>"
runner:
  azure:
    subscription: "<subscription ID or name of the runner>"
    resource-group: "<resource group of the runner, never a protected environment>"
    location: "<Azure region>"
    name-prefix: "<short lowercase prefix of the runner resources>"
  repository: "<HTTPS clone URL of the repository>"
  image:
    base: "<Playwright image matching the project's Playwright version, for example mcr.microsoft.com/playwright:v1.57.0-noble>"
    dotnet-channel: "<.NET SDK channel, or none>"
    dotnet-tools: "<space-separated .NET global tools, or none>"
    pnpm-version: "<pnpm version, or none>"
    copilot-version: "<Copilot CLI version, or latest>"
    apt-packages: "<space-separated extra apt packages, or none>"
  cpu: "<vCPU of the runner container>"
  memory-gb: "<memory of the runner container, in GB>"
  model: "<model of the goal run, or auto>"
  max-ai-credits: "<soft AI credit cap of the goal run>"
  env:
    EXAMPLE_VARIABLE: "<non-secret environment variable of the runner>"
  secrets:
    COPILOT_GITHUB_TOKEN: "<Key Vault secret: fine-grained PAT with the Copilot Requests permission>"
    GIT_TOKEN: "<Key Vault secret: fine-grained PAT with Contents read and write on this repository only>"
  sidecars:
    - name: "<sidecar name, for example a database>"
      image: "<image>"
      cpu: "<vCPU>"
      memory-gb: "<memory, in GB>"
      env:
        EXAMPLE_VARIABLE: "<non-secret environment variable of the sidecar>"
      secrets:
        EXAMPLE_SECRET: "<Key Vault secret name>"
  ready: "<command that exits 0 once the sidecars accept connections, or none>"
  setup:
    - "<command run after the clone and before the goal: restore, schema deployment, performance dataset>"
---

# Zapper project configuration

The project-specific facts of Zapper runs. It is the only file of `.zapper/` that names the host
project: the skills and `goal.md` never do. It is read by `workspace-check-zapper` (before a run),
by `.zapper/goal.md` (during it) and by `report-run-zapper` (after it).

Set `status: approved` once the team has reviewed it. Until then no run starts.

| Field                    | Content                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `language`               | Language of the artifacts Zapper writes: Gherkin, plan, reports. Required: the output report is written in it on every run, whatever the language of the conversation.                                                                                                                                                                                                                                                                                      |
| `default-branch`         | Branch a run never touches and the pull request targets.                                                                                                                                                                                                                                                                                                                                                                                                    |
| `stack`                  | One line per part of the project: language, framework, data access, test frameworks.                                                                                                                                                                                                                                                                                                                                                                        |
| `instructions`           | Repository instruction files and skills the run follows (conventions, validation rules).                                                                                                                                                                                                                                                                                                                                                                    |
| `commands`               | Run from the repository root; each category is a list of commands, or `none` when the team deliberately waives it. An empty list is not valid.                                                                                                                                                                                                                                                                                                              |
| `protected-environments` | Environments a run never touches. Deploying to any other environment is allowed only as the goal says.                                                                                                                                                                                                                                                                                                                                                      |
| `protected-paths`        | Files and folders a run never modifies (tooling state, source documents).                                                                                                                                                                                                                                                                                                                                                                                   |
| `critical-areas`         | Areas where any change is a major decision for the team (tenant isolation, security, data writes, shared infrastructure).                                                                                                                                                                                                                                                                                                                                   |
| `performance-dataset`    | The realistic-volume data the performance checks run on: `kind` (an anonymized copy of real data, or a volume seeder), `volumes` (order of magnitude of rows of the main tables or entities) and `load-command` (what loads it). `none` only when the non-functional requirements have no performance requirement. A seeder that does not exist yet is written by the plan's runner block.                                                                  |
| `runner`                 | Where an unattended run executes in Azure Container Instances (`.zapper/runner/`): Azure location of the runner resources, toolchain of the image, size of the container, model and soft credit cap, environment variables, Key Vault secret names (`COPILOT_GITHUB_TOKEN` and `GIT_TOKEN` are required), sidecars (services the tests need, reached on `127.0.0.1`), the readiness command and the setup commands. `none` when runs stay on a workstation. |

The command that runs the BDD suite is not set here: the plan's `bdd-runner` block records it in
`.zapper/behaviour-driven-development/README.md`, the single place the goal and the report read it.
The thresholds of the performance checks are not set here either: they are in the scenarios and
approved with the BDD suite.

The runner container has no Docker: every service a command needs (database, storage emulator) is a
`runner.sidecars` entry, and the `commands` reach it through the variables of `runner.env` and
`runner.secrets`. The secret values stay in the Key Vault of the runner; this file only names them.
The sizes of the runner and its sidecars add up to at most 4 vCPU and 16 GB in most regions.
