# Local Developer Environment Standards

Conventions for the local developer environment of a Nexus launchpad application: Node.js, package manager, VS Code debugging, ports, local SQL Server in Docker, dacpac deployment and first-time setup.

## Contents

- [Repository layout and output location](#repository-layout-and-output-location)
- [Node.js via nvm](#nodejs-via-nvm)
- [.nvmrc pinning](#nvmrc-pinning)
- [Package manager](#package-manager)
- [Ports and URLs](#ports-and-urls)
- [VS Code launch and tasks](#vs-code-launch-and-tasks)
- [Local SQL Server in Docker](#local-sql-server-in-docker)
- [Connection strings and secrets](#connection-strings-and-secrets)
- [SQL Database Project and local dacpac deployment](#sql-database-project-and-local-dacpac-deployment)
- [Entra ID prerequisites for local setup](#entra-id-prerequisites-for-local-setup)
- [First environment setup document](#first-environment-setup-document)
- [Conflicts and gaps](#conflicts-and-gaps)
- [Sources](#sources)

## Repository layout and output location

| Rule                                       | Value                                                                                                                                                                            |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default generated root (`<target-folder>`) | `<repo>/output.local/`, unless the user specifies another location                                                                                                               |
| Backend folder                             | `<target-folder>/backend/`                                                                                                                                                       |
| Frontend folder                            | `<target-folder>/frontend/`                                                                                                                                                      |
| VS Code config                             | `<target-folder>/.vscode/` (the folder the developer opens as workspace root, one level above `backend/` and `frontend/`)                                                        |
| Project instructions file                  | `<target-folder>/.github/copilot-instructions.md` (may name the target folder; derive the workspace root from it, e.g. backend at `output.local/backend` → root `output.local/`) |
| Documentation                              | `<target-folder>/Documentation/` (only when documentation is enabled)                                                                                                            |
| Infrastructure / pipeline                  | `<target-folder>/infra/`, `<target-folder>/pipelines/` (only when Azure is enabled)                                                                                              |
| Input model                                | `input/project.yaml` and `input/modules/{module}.yaml` at the repository root are the single source of truth for generation                                                      |
| README in output subfolders                | Do not create `README.md` files in generated subfolders; update the central project documentation instead                                                                        |
| Plugin repository rule                     | The repository-root `readme.md` is updated whenever skills are added or significantly changed                                                                                    |

> In this repository the generated code lives under `src/backend/` and `src/frontend/`, not `output.local/`. Paths in the canonical VS Code templates (`${workspaceFolder}/backend/...`) must be adjusted to the actual layout.

## Node.js via nvm

| Rule                                 | Detail                                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| Node is always installed through nvm | Never install Node.js directly without a version manager                                      |
| Version policy                       | Latest Node.js **LTS** release; never a hardcoded version number                              |
| Release discovery                    | nvm itself is resolved from the latest GitHub release at install time (no pinned nvm version) |
| Idempotency                          | If `nvm` is already on the PATH, skip its installation and only install/activate LTS          |
| npm                                  | Comes bundled with the Node LTS release (no separate npm install)                             |

### Windows vs macOS/Linux

| Aspect          | Windows                                                                                    | macOS / Linux                                                                           |
| --------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Implementation  | **nvm-windows** (`coreybutler/nvm-windows`)                                                | **nvm-sh** (`nvm-sh/nvm`)                                                               |
| Installer       | `nvm-setup.exe` release asset, run silently (`/SILENT`); a UAC elevation prompt may appear | Official `install.sh` of the latest tag (via `curl` or `wget`; one of them is required) |
| Install LTS     | `nvm install lts`                                                                          | `nvm install --lts`                                                                     |
| Activate LTS    | `nvm use lts`                                                                              | `nvm use --lts`                                                                         |
| Persist default | (activation is global in nvm-windows)                                                      | `nvm alias default lts`                                                                 |
| `NVM_DIR`       | n/a                                                                                        | `$NVM_DIR`, default `~/.nvm`; source `$NVM_DIR/nvm.sh`                                  |
| New session     | PATH changes may not be visible in the current terminal: open a new terminal and rerun     | Open a new terminal, or `source ~/.bashrc` / `source ~/.zshrc`                          |

Verification: `nvm --version`, `node --version` (current LTS) and the bundled package manager version must all resolve. If `node` is not found after setup, run `nvm use lts` in a new terminal.

## .nvmrc pinning

| Rule                | Detail                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Location            | Root of the frontend project (the folder containing `package.json`), unless another target folder is given                    |
| Content             | The bare version number only, on a single line, e.g. `22.14.0` — **no `v` prefix**, no trailing whitespace beyond one newline |
| Source of the value | Read at runtime from `node --version` (strip the leading `v`); never hardcode                                                 |
| Existing file       | Show current vs new pinned version and get confirmation before overwriting                                                    |
| Required by CI/CD   | The pipeline fails setup when `<frontend>/.nvmrc` is missing                                                                  |

Values derived from `.nvmrc` (major version, e.g. `24.15.0` → `24`):

| Consumer                                              | Derived value                                                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Azure App Service frontend runtime (`linuxFxVersion`) | `NODE\|<major>-lts` (e.g. `NODE\|24-lts`)                                                              |
| Azure DevOps pipeline `nodeVersion` fallback          | `'<major>.x'` — only a fallback; the build template resolves the real version from `.nvmrc` at runtime |

## Package manager

| Source statement    | Detail                                                                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Launchpad sources   | Assume **npm** (bundled with Node LTS): validation commands `npm run build`, `npm test`, `npm run test:run`; VS Code task `"type": "npm"`                               |
| **This repository** | **pnpm is mandatory. Never use npm.** Use `pnpm install`, `pnpm run <script>`, `pnpm dlx` instead of `npx`. The lockfile is `pnpm-lock.yaml`, never `package-lock.json` |

Translation table for this repository:

| Launchpad command               | Required here                                     |
| ------------------------------- | ------------------------------------------------- |
| `npm install`                   | `pnpm install`                                    |
| `npm run build`                 | `pnpm run build`                                  |
| `npm test` / `npm run test:run` | `pnpm test` / `pnpm run test:run`                 |
| `npx <tool>`                    | `pnpm dlx <tool>`                                 |
| VS Code task `"type": "npm"`    | A `shell` task running `pnpm run dev` (see below) |

## Ports and URLs

| Endpoint                                   | Value                                     | Notes                                                                                                                                           |
| ------------------------------------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend API (launch profile `https`)       | `https://localhost:7035`                  | `launchSettings.json` keeps **only** the `https` profile (`commandName: Project`, `launchBrowser: false`, `ASPNETCORE_ENVIRONMENT=Development`) |
| Backend API base path                      | `https://localhost:7035/api`              | Default local `API_URL` of the frontend runtime config                                                                                          |
| Fallback API URL (backend not yet created) | `https://localhost:5001/api`              | Used only when no `launchSettings.json` exists yet                                                                                              |
| Health check                               | `GET /api/health`                         | Also the App Service health check path of the backend                                                                                           |
| OpenAPI document                           | Mapped only in Development (`MapOpenApi`) |                                                                                                                                                 |
| Frontend dev server (Vite)                 | `http://localhost:5173`                   | Plain HTTP; use `https` only if TLS is explicitly enabled (e.g. `@vitejs/plugin-basic-ssl`)                                                     |
| CORS `AllowedOrigins` (Development)        | `http://localhost:5173`                   | Must list the frontend dev server origin(s)                                                                                                     |
| Local SQL Server                           | `localhost,1433`                          | Docker port mapping `1433:1433`                                                                                                                 |

Canonical `Properties/launchSettings.json` (replace the generated file wholesale):

```json
{
  "$schema": "https://json.schemastore.org/launchsettings.json",
  "profiles": {
    "https": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "https://localhost:7035",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

## VS Code launch and tasks

### Rules

| Rule                | Detail                                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Files               | `<target-folder>/.vscode/launch.json` and `<target-folder>/.vscode/tasks.json`                                                         |
| Modes               | **API** (backend only), **Frontend** (dev server only), **Full Stack** (both + compound). Generated full-stack apps use **Full Stack** |
| Configuration names | `Launch API`, `Launch Frontend (Chrome)`; compound `Full Stack` with `stopAll: true`                                                   |
| Task labels         | `build-backend` (preLaunchTask of `Launch API`), `start-frontend` (preLaunchTask of `Launch Frontend (Chrome)`)                        |
| HTTPS               | `launchSettingsFilePath` + `launchSettingsProfile: "https"` are hardcoded so VS Code always launches with HTTPS                        |
| Environment         | `ASPNETCORE_ENVIRONMENT=Development`                                                                                                   |
| Frontend browser    | Chrome (`type: chrome`), `webRoot` = frontend folder, `sourceMapPathOverrides` `"/@fs/*": "/*"`                                        |
| Frontend task       | Background task; Vite problem matcher begins on `VITE`, ends on `ready in`                                                             |
| Overwrite           | Show a diff and confirm before overwriting an existing file                                                                            |
| No leftovers        | No `{BackendProjectName}`, `{DotnetVersion}` or `{FrontendUrl}` token may remain                                                       |

| Mode       | `launch.json` configurations              | Compound     | `tasks.json` tasks                 |
| ---------- | ----------------------------------------- | ------------ | ---------------------------------- |
| API        | `Launch API`                              | No           | `build-backend`                    |
| Frontend   | `Launch Frontend (Chrome)`                | No           | `start-frontend`                   |
| Full Stack | `Launch API` + `Launch Frontend (Chrome)` | `Full Stack` | `build-backend` + `start-frontend` |

| Placeholder            | Value                                     | Example                 |
| ---------------------- | ----------------------------------------- | ----------------------- |
| `{BackendProjectName}` | API project name (`<root-namespace>.Api`) | `Acme.App.Api`          |
| `{DotnetVersion}`      | `<TargetFramework>` of the Api `.csproj`  | `net10.0`               |
| `{FrontendUrl}`        | Vite dev server URL                       | `http://localhost:5173` |

### Canonical `launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch API",
      "type": "coreclr",
      "request": "launch",
      "preLaunchTask": "build-backend",
      "program": "${workspaceFolder}/backend/{BackendProjectName}/bin/Debug/{DotnetVersion}/{BackendProjectName}.dll",
      "args": [],
      "cwd": "${workspaceFolder}/backend/{BackendProjectName}",
      "stopAtEntry": false,
      "launchSettingsFilePath": "${workspaceFolder}/backend/{BackendProjectName}/Properties/launchSettings.json",
      "launchSettingsProfile": "https",
      "env": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    },
    {
      "name": "Launch Frontend (Chrome)",
      "type": "chrome",
      "request": "launch",
      "preLaunchTask": "start-frontend",
      "url": "{FrontendUrl}",
      "webRoot": "${workspaceFolder}/frontend",
      "sourceMapPathOverrides": {
        "/@fs/*": "/*"
      }
    }
  ],
  "compounds": [
    {
      "name": "Full Stack",
      "configurations": ["Launch API", "Launch Frontend (Chrome)"],
      "stopAll": true
    }
  ]
}
```

### Canonical `tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "build-backend",
      "command": "dotnet",
      "type": "process",
      "args": [
        "build",
        "${workspaceFolder}/backend/{BackendProjectName}/{BackendProjectName}.csproj",
        "/property:GenerateFullPaths=true",
        "/consoleloggerparameters:NoSummary"
      ],
      "problemMatcher": "$msCompile"
    },
    {
      "label": "start-frontend",
      "type": "npm",
      "script": "dev",
      "options": {
        "cwd": "${workspaceFolder}/frontend"
      },
      "isBackground": true,
      "problemMatcher": {
        "owner": "vite",
        "fileLocation": "relative",
        "pattern": {
          "regexp": "^(.*):(\\d+):(\\d+):\\s+(warning|error):\\s+(.*)$",
          "file": 1,
          "line": 2,
          "column": 3,
          "severity": 4,
          "message": 5
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "VITE",
          "endsPattern": "ready in"
        }
      }
    }
  ]
}
```

> pnpm adaptation for this repository: replace `"type": "npm", "script": "dev"` with `"type": "shell", "command": "pnpm", "args": ["run", "dev"]`, keeping the same `label`, `options.cwd`, `isBackground` and `problemMatcher`. Also adjust `${workspaceFolder}/backend` / `${workspaceFolder}/frontend` to `src/backend` / `src/frontend` when the workspace root is the repository root.

## Local SQL Server in Docker

| Rule                  | Value                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Compose file          | `docker-compose.yml` at the **solution root** (folder containing the `.slnx`/`.sln`)                                    |
| Existing compose file | Add the `sqlserver` service and `sqlserver-data` volume; never overwrite other services                                 |
| Service name          | `sqlserver` (no explicit `container_name`)                                                                              |
| Image                 | `mcr.microsoft.com/mssql/server:2022-latest` (SQL Server 2022)                                                          |
| Port                  | `1433:1433`                                                                                                             |
| Data volume           | Named volume `sqlserver-data` mounted at `/var/opt/mssql`                                                               |
| EULA                  | `ACCEPT_EULA: "Y"`                                                                                                      |
| SA password           | From `.env` (`SA_PASSWORD`), never hardcoded in tracked files                                                           |
| Health check          | `sqlcmd` from `/opt/mssql-tools18`, `SELECT 1`, `-C` (trust certificate); interval 10s, timeout 5s, retries 5           |
| Prerequisite          | Docker Desktop running                                                                                                  |
| Startup               | Automatic in Development: the API runs `docker compose up -d sqlserver` on launch. Standalone (no app): run it manually |

Canonical `docker-compose.yml`:

```yaml
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    env_file: .env
    environment:
      SA_PASSWORD: "${SA_PASSWORD}"
      ACCEPT_EULA: "Y"
    ports:
      - "1433:1433"
    volumes:
      - sqlserver-data:/var/opt/mssql
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P '${SA_PASSWORD}' -Q 'SELECT 1' -C",
        ]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  sqlserver-data:
```

### SA password handling

| Rule           | Detail                                                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File           | `.env` at the solution root, sibling of `docker-compose.yml`, single line `SA_PASSWORD=<generated>`                                                                                                                 |
| Generation     | Cryptographically random, different on every bootstrap; 24 characters: `Dev!` prefix + 20 chars of base64 of 18 random bytes with `+`, `/`, `=` removed (meets SQL Server complexity: upper, lower, digit, special) |
| Git            | `.env` added to `.gitignore` (repository root or backend); never committed                                                                                                                                          |
| Where it lives | Only in `.env` and in `dotnet user-secrets`                                                                                                                                                                         |

```powershell
$saPasswordRaw = [System.Convert]::ToBase64String(
    [System.Security.Cryptography.RandomNumberGenerator]::GetBytes(18)
) -replace '[+/=]', ''
$saPassword = "Dev!" + $saPasswordRaw.Substring(0, 20)
"SA_PASSWORD=$saPassword" | Set-Content .env
```

### Automatic startup in Development (`Program.cs`)

| Rule                         | Detail                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Call site                    | `EnsureSqlServerRunning(app.Logger, app.Environment.ContentRootPath)` inside the `IsDevelopment()` block (after `MapOpenApi()`)     |
| Discovery                    | Walk up from `ContentRootPath` until a folder contains `docker-compose.yml`; if none, log a warning and skip                        |
| Command                      | `docker compose up -d sqlserver` in that folder, `UseShellExecute = false`, wait up to 30 seconds                                   |
| Failures never crash the app | Not found, failed start, timeout, non-zero exit code or exception → log a warning only (e.g. "make sure Docker Desktop is running") |
| Success log                  | `SQL Server Docker container started.` (used to verify the setup)                                                                   |

```csharp
static void EnsureSqlServerRunning(ILogger logger, string contentRootPath)
{
    var dir = new DirectoryInfo(contentRootPath);
    while (dir is not null && !File.Exists(Path.Join(dir.FullName, "docker-compose.yml")))
        dir = dir.Parent;

    if (dir is null)
    {
        logger.LogWarning("docker-compose.yml not found — skipping SQL Server startup.");
        return;
    }

    try
    {
        using var process = new Process();
        process.StartInfo = new ProcessStartInfo
        {
            FileName = "docker",
            Arguments = "compose up -d sqlserver",
            WorkingDirectory = dir.FullName,
            UseShellExecute = false
        };

        if (!process.Start())
        {
            logger.LogWarning("Failed to launch docker — skipping SQL Server startup.");
            return;
        }

        process.WaitForExit(30_000);

        if (!process.HasExited)
        {
            logger.LogWarning("docker compose timed out — SQL Server may still be starting.");
            return;
        }

        if (process.ExitCode != 0)
        {
            logger.LogWarning("docker compose exited with code {ExitCode} — SQL Server may not have started.", process.ExitCode);
            return;
        }

        logger.LogInformation("SQL Server Docker container started.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Could not start Docker SQL Server — make sure Docker Desktop is running.");
    }
}
```

## Connection strings and secrets

| Rule                         | Detail                                                                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Key name                     | Always `ConnectionStrings:DefaultConnection` (never `Default`; deployed apps read this exact name)                                                                                                                 |
| Placement                    | `ConnectionStrings` section at the top of every appsettings JSON object                                                                                                                                            |
| Present in                   | Every appsettings file of the Api project                                                                                                                                                                          |
| Base / deployed environments | Empty string `""`; the value is injected at runtime (Azure App Configuration / Key Vault / App Service settings). In Azure it is a **passwordless** connection string                                              |
| Development (preferred)      | `appsettings.Development.json` value `""`; the real value is stored in `dotnet user-secrets` (requires `UserSecretsId` in the Api `.csproj`; run `dotnet user-secrets init --project <ApiProjectPath>` if missing) |
| Password source              | Read back from `.env` so Docker and the API use the same value                                                                                                                                                     |

| File                                                    | `DefaultConnection`                      |
| ------------------------------------------------------- | ---------------------------------------- |
| `appsettings.json`                                      | `""`                                     |
| `appsettings.Development.json`                          | `""` + user-secrets (see conflict below) |
| `appsettings.Dev.json`                                  | `""`                                     |
| `appsettings.Uat.json`                                  | `""`                                     |
| `appsettings.Prod.json` / `appsettings.Production.json` | `""` (file name conflict, see below)     |

Local development connection string format:

```text
Server=localhost,1433;Database={DatabaseName};User Id=sa;Password=<sa-password>;TrustServerCertificate=True;
```

```powershell
$saPassword = (Get-Content .env | Where-Object { $_ -match '^SA_PASSWORD=' }) -replace '^SA_PASSWORD=', ''
dotnet user-secrets set "ConnectionStrings:DefaultConnection" `
  "Server=localhost,1433;Database={DatabaseName};User Id=sa;Password=$saPassword;TrustServerCertificate=True;" `
  --project "<ApiProjectPath>"
```

## SQL Database Project and local dacpac deployment

| Rule               | Detail                                                                                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project type       | SDK-style SQL Database Project (`Microsoft.Build.Sql`), created from the `Microsoft.Build.Sql.Templates` template (`dotnet new sqlproj`); install the template if missing  |
| Name / location    | `{Name}.Database` next to the solution file, added to the `.slnx` (preferred) or `.sln`                                                                                    |
| Target platform    | Default `SqlServer2022`; allowed `SqlServer2022`, `SqlServer2019`, `SqlServer2017`, `SqlServer2016`, `AzureSqlDatabaseV12`                                                 |
| Folders            | `dbo/Tables`, `dbo/Views`, `dbo/StoredProcedures`, `dbo/Functions`, `Scripts/Pre-Deployment`, `Scripts/Post-Deployment`                                                    |
| Deployment scripts | `Scripts/Pre-Deployment/Script.PreDeployment.sql` and `Scripts/Post-Deployment/Script.PostDeployment.sql`, wired as `<PreDeploy>` / `<PostDeploy>` items                   |
| Never overwrite    | Abort if the project folder already exists                                                                                                                                 |
| Build              | `dotnet build {Name}.Database/{Name}.Database.sqlproj` → `bin/Debug/{Name}.Database.dacpac` (or `bin/Release/`)                                                            |
| Deploy tool        | `sqlpackage` with `/Action:Publish /SourceFile:<dacpac> /TargetConnectionString:<conn>`; extra arguments (e.g. `/p:BlockOnPossibleDataLoss=False`) may be appended         |
| Tool installation  | Either via local tool manifest (`dotnet tool exec sqlpackage ...`, no global install) or global (`dotnet tool install -g microsoft.sqlpackage`, then restart the terminal) |

```powershell
dotnet build {Name}.Database/{Name}.Database.sqlproj
dotnet tool exec sqlpackage /Action:Publish /SourceFile:bin/Debug/{Name}.Database.dacpac /TargetConnectionString:"{ConnectionString}"
```

Local target: the Docker SQL Server, `Server=localhost,1433;Database={DatabaseName};User Id=sa;Password=<sa-password>;TrustServerCertificate=True;`.

## Entra ID prerequisites for local setup

Applies only when `auth.entra` is present in `input/project.yaml`.

| Rule                           | Detail                                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Inputs                         | `tenant-id` and client IDs come from `input/project.yaml`                                                                                   |
| Missing client IDs             | App registrations may be created automatically via Azure CLI, logging in tenant-scoped with `tenant-id` when available                      |
| Insufficient Entra permissions | Continue with placeholders; create the app registrations later once access is granted                                                       |
| YAML is never mutated          | Generated client IDs are never written back into `input/project.yaml`                                                                       |
| Handoff file                   | `entra-app-registrations.json` may carry generated IDs from frontend to backend setup; it is temporary and deleted once both sides validate |
| Frontend runtime config        | Extended with Entra tenant and client IDs                                                                                                   |
| Backend                        | JWT Bearer via Microsoft.Identity.Web; `GET /api/me` returns `200 OK` (no payload) when authorized, `401` otherwise                         |

## First environment setup document

| Rule                  | Detail                                                                                                                                                                                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Applies when          | Azure infrastructure and/or pipeline is generated                                                                                                                                                                                                         |
| Location              | `Documentation/Guides-And-References/First-Environment-Setup.md` (French: `Guides-Et-References/Mise-En-Service-Environnement.md`), linked by one line under the title of the Deployment page                                                             |
| Without documentation | The filled checklist is printed at the end of the generation                                                                                                                                                                                              |
| Structure             | Title + introduction, **one table per environment** (`## Environment <code> (<name>)`), columns `#`, `Step`, `Who`, rows in execution order numbered from 1, then a "Why these steps stay manual" section with only the explanations of the rows included |
| Regeneration          | Each run rewrites the whole table of each environment (rows of every step run so far), never inserting into a numbered table; nothing else on the page changes                                                                                            |
| Scope                 | Done **once per environment**, in order, before its first deployment                                                                                                                                                                                      |
| Resource names        | `<application-name>-<code>-<suffix>`                                                                                                                                                                                                                      |

Placeholders:

| Placeholder            | Value                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `<code>`, `<name>`     | Environment `code`; its `name`, else the code with first letter uppercased           |
| `<service-connection>` | Environment `serviceConnection`                                                      |
| `<resource-group>`     | `<azure-app>-<code>-rg`, or `resourceGroupName` when infrastructure is not generated |
| `<key-vault>`          | `<azure-app>-<code>-kv`                                                              |
| `<sql-admin-group>`    | `azure.sqlAdminGroup.name`, else `<azure-app>-<code>-sql-admins`                     |

Rows (canonical order) and ownership:

| #   | Step                                                                                                                                                         | Who                                                | Included when                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | ---------------------------------------------- |
| 1   | Create Entra ID group `<sql-admin-group>`; put its object ID in `infra/Environment/main.<code>.bicepparam` (`sqlAdminGroupObjectId`)                         | Entra ID administrator                             | Infrastructure                                 |
| 2   | Put the object IDs of the Key Vault secret managers in `kvAdminIds` of `main.<code>.bicepparam`                                                              | Team member who maintains `infra/`                 | Infrastructure                                 |
| 3   | Create Azure DevOps service connection `<service-connection>` (Azure Resource Manager), then add its identity to `<sql-admin-group>`                         | Azure DevOps administrator, then the group's owner | Pipeline (group part only with infrastructure) |
| 4   | Give the service connection Contributor and Role Based Access Control Administrator on `<resource-group>` (or the subscription if the RG does not exist yet) | Azure subscription owner                           | Pipeline (RBAC Admin only with infrastructure) |
| 5   | Create pipeline environment `<name>` with approvals and variable groups                                                                                      | Azure DevOps administrator                         | Pipeline                                       |
| 6   | Run the pipeline for the first infrastructure deployment; check the SQL access step ran                                                                      | Team member allowed to run the pipeline            | Pipeline + infrastructure                      |
| 7   | Add developers to `<sql-admin-group>` — all they need to access the database                                                                                 | Group owner                                        | Infrastructure                                 |
| 8   | Create in `<key-vault>` one secret per name of `secretEnvironmentVariableNames` in `infra/Environment/main.bicep`, named without its `__`                    | A person listed in `kvAdminIds`                    | Infrastructure, when the list is non-empty     |

Why they stay manual (content to keep):

- **Entra ID group**: needs Microsoft Graph permissions rarely granted to pipelines, and would bypass database access approval.
- **Key Vault secret managers**: they receive Key Vault Secrets Officer; until `kvAdminIds` lists someone, nobody can write a secret.
- **Service connection in the group**: the deployment creates the app identity's SQL user with the service connection identity; only a SQL server administrator can.
- **Service connection roles**: assigning Azure roles needs Role Based Access Control Administrator in addition to Contributor.
- **Developers in the group**: Azure roles do not open SQL data; group membership does, and developers need no SQL user.
- **Key Vault secrets**: values are secrets and are never generated into the repository.

## Conflicts and gaps

| Topic                            | Conflict / gap                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Development connection string    | `data-setup-launchpad` flow: `appsettings.Development.json` value `""` + user-secrets with the generated `.env` password. Its own `connection-strings.json.template` and `sqldb-setup-launchpad` bootstrap instead put a full connection string with a fixed literal SA password directly in `appsettings.Development.json` (which also mismatches the random `.env` password). Prefer the user-secrets rule (no secret in tracked files) |
| Production appsettings file name | `data-setup-launchpad` uses `appsettings.Production.json`; `sqldb-setup-launchpad` and generated projects use `appsettings.Prod.json`                                                                                                                                                                                                                                                                                                     |
| Dacpac example connection string | `sqldb-setup-launchpad` deploy example uses `Server=localhost;...;Trusted_Connection=True` (Windows auth), which does not work against the Docker SQL Server (SA login on `localhost,1433`)                                                                                                                                                                                                                                               |
| sqlpackage install               | Local tool manifest (`dotnet tool exec`) vs global tool (`dotnet tool install -g microsoft.sqlpackage`)                                                                                                                                                                                                                                                                                                                                   |
| Package manager                  | Sources assume npm everywhere; this repository requires pnpm                                                                                                                                                                                                                                                                                                                                                                              |
| VS Code paths                    | Templates assume `backend/` and `frontend/` directly under the workspace root                                                                                                                                                                                                                                                                                                                                                             |
| Container name                   | No `container_name` is defined; the container is identified by the compose service `sqlserver`                                                                                                                                                                                                                                                                                                                                            |
| Database name                    | No naming convention for `{DatabaseName}` beyond the example `BonneurApp`                                                                                                                                                                                                                                                                                                                                                                 |
| Local dacpac automation          | No convention for automatically deploying the dacpac to the local Docker SQL Server on startup                                                                                                                                                                                                                                                                                                                                            |

## Sources

- `node-setup-launchpad`
- `node-version-config-launchpad`
- `vscode-setup-launchpad`
- `app-create-launchpad`
- `sqldb-setup-launchpad`
- `data-setup-launchpad`
- `dotnet-app-init-launchpad`
- `dotnet-setup-cors-launchpad`
- `react-config-management-launchpad`

Extracted from NexusInnovation/nexus-plugin-marketplace plugins/launchpad on 2026-11-24.
