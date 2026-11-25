---
status: approved
language: fr
default-branch: main
stack:
  - "Backend: C# .NET 10 Web API, clean architecture (Api, Application, Domain, Infrastructure), custom CQRS, Dapper repositories and unit of work, SQL Server SSDT project (Microsoft.Build.Sql), xUnit tests"
  - "Frontend: React 19 TypeScript with Vite, MUI, React Query, react-hook-form, zod, i18next, pnpm, Vitest and Testing Library; Playwright for end-to-end tests (added by the plan)"
  - "Infrastructure and pipelines: Bicep (infra/Environment), Azure DevOps pipelines (pipelines/), Azure App Service and Azure SQL"
instructions:
  - ".github/skills/nexus-launchpad-standards/SKILL.md"
commands:
  build:
    - "dotnet build src/backend/Nexus.ZapperTodo.slnx"
    - "pnpm --dir src/frontend install --frozen-lockfile"
    - "pnpm --dir src/frontend build"
  lint:
    - "dotnet format src/backend/Nexus.ZapperTodo.slnx --verify-no-changes"
    - "pnpm --dir src/frontend lint"
    - "pnpm --dir src/frontend format:check"
  unit-test:
    - "dotnet test src/backend/Nexus.ZapperTodo.slnx"
    - "pnpm --dir src/frontend test:run"
  e2e:
    - "pnpm --dir src/frontend exec playwright test"
  security:
    - "dotnet list src/backend/Nexus.ZapperTodo.slnx package --vulnerable --include-transitive"
    - "pnpm --dir src/frontend audit --audit-level high"
protected-environments:
  - "uat"
  - "prod"
protected-paths:
  - ".zapper/skills/"
  - ".zapper/scripts/"
  - ".zapper/runner/"
  - ".zapper/goal.md"
  - ".zapper/config.md"
  - "infra/"
  - "pipelines/"
  - "prototype/"
critical-areas:
  - "Authentication and authorization with Microsoft Entra ID (Nexus.ZapperTodo.Api, Nexus.ZapperTodo.Application/Authentication, frontend MSAL)"
  - "Database schema (src/backend/Nexus.ZapperTodo.Database)"
  - "Shared infrastructure and deployment (infra/, pipelines/)"
performance-dataset:
  kind: "volume-seeder"
  volumes:
    - "todo items: 100 000 rows"
  load-command: "pnpm --dir src/frontend seed:volume" # written by the todo-api block; run by runner.setup after the schema deployment
runner:
  azure:
    subscription: "92e93529-faf4-45ba-9496-775973670750"
    resource-group: "rg-zapper-todo-runner"
    location: "canadaeast"
    name-prefix: "zaptodo"
  repository: "https://github.com/NexusInnovation/nexus-zapper-todo-test.git"
  image:
    base: "mcr.microsoft.com/playwright:v1.57.0-noble"
    dotnet-channel: "10.0"
    dotnet-tools: "microsoft.sqlpackage"
    pnpm-version: "12.8.1"
    copilot-version: "latest"
    apt-packages: "none"
  cpu: 3
  memory-gb: 12
  model: "claude-opus-5.5"
  max-ai-credits: 4000
  env:
    ASPNETCORE_ENVIRONMENT: "Development"
  secrets:
    COPILOT_GITHUB_TOKEN: "copilot-github-token"
    GIT_TOKEN: "git-token"
    ConnectionStrings__DefaultConnection: "sql-connection-string"
  sidecars:
    - name: "mssql"
      image: "mcr.microsoft.com/mssql/server:2022-latest"
      cpu: 1
      memory-gb: 4
      env:
        ACCEPT_EULA: "Y"
        MSSQL_PID: "Developer"
      secrets:
        MSSQL_SA_PASSWORD: "sql-sa-password"
  ready: "timeout 2 bash -c '</dev/tcp/127.0.0.1/1433'"
  setup:
    - "pnpm --dir src/frontend install --frozen-lockfile"
    - "dotnet restore src/backend/Nexus.ZapperTodo.slnx"
    - "dotnet build src/backend/Nexus.ZapperTodo.Database/Nexus.ZapperTodo.Database.sqlproj -c Release"
    - 'sqlpackage /Action:Publish /SourceFile:src/backend/Nexus.ZapperTodo.Database/bin/Release/Nexus.ZapperTodo.Database.dacpac /TargetConnectionString:"$ConnectionStrings__DefaultConnection"'
---

# Zapper project configuration

The project-specific facts of Zapper runs. It is the only file of `.zapper/` that names the host
project: the skills and `goal.md` never do. Template and field descriptions:
[skills/workspace-check-zapper/assets/config.md](skills/workspace-check-zapper/assets/config.md).

Draft prepared for the team review. In the Azure runner, SQL Server is the `mssql` sidecar on
`127.0.0.1,1433` (no Docker, so no Testcontainers): system and end-to-end tests read
`ConnectionStrings__DefaultConnection`. Before `status: approved`:

- Set `runner.azure.subscription`, then align `runner.image.base` with the `@playwright/test`
  version the plan adds and `runner.model` with a model of the Copilot plan.
- Confirm the commands (`e2e` exists once the plan's runner block adds Playwright) and the
  performance volumes.
- Store the four Key Vault secrets named in `runner.secrets` and `runner.sidecars` (the connection
  string targets `127.0.0.1,1433` with the `sa` password, `TrustServerCertificate=True`).
