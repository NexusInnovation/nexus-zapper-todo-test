# Backend Architecture Standards (.NET)

Conventions for the structure, composition, configuration, testing and code style of a Nexus .NET clean architecture Web API backend.

## Contents

- [Naming and root namespace](#naming-and-root-namespace)
- [Backend root location](#backend-root-location)
- [Solution layout](#solution-layout)
- [Layers and project references](#layers-and-project-references)
- [Target framework and project settings](#target-framework-and-project-settings)
- [Folder conventions](#folder-conventions)
- [Dependency injection per layer](#dependency-injection-per-layer)
- [Program.cs composition](#programcs-composition)
- [Health check](#health-check)
- [Application Insights and OpenAPI](#application-insights-and-openapi)
- [Time access](#time-access)
- [Serialization](#serialization)
- [Launch settings](#launch-settings)
- [Environments and appsettings files](#environments-and-appsettings-files)
- [CORS](#cors)
- [NuGet configuration and packages](#nuget-configuration-and-packages)
- [Test project](#test-project)
- [Code style (.editorconfig)](#code-style-editorconfig)
- [Resulting scaffold](#resulting-scaffold)
- [Validation invariants](#validation-invariants)
- [Conflicts and gaps](#conflicts-and-gaps)
- [Sources](#sources)

## Naming and root namespace

The single source of naming is `project-name` in `input/project.yaml`, in kebab-case (e.g. `acme-app`). When it is available, never ask for either derived form; derive it.

| Form                          | Derivation                                                                    | Example    | Used for                                                                                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<root-namespace>` (`{Name}`) | Each hyphen-separated segment of `project-name` in PascalCase, joined by dots | `Acme.App` | Solution (`<root-namespace>.slnx`), project names, C# namespaces, database name (`AcmeAppDb`)                                                           |
| `<application-name>`          | `project-name` unchanged                                                      | `acme-app` | Azure DevOps pipeline application name, Bicep `applicationName` default, Azure resource / resource group names, API URLs, Entra app registration prefix |

- When only `<root-namespace>` is known (existing backend, no `project.yaml`): `<application-name>` = `<root-namespace>` lowercased, dots replaced by hyphens (`Acme.App` → `acme-app`).
- Every segment must start with a letter (a C# identifier cannot start with a digit): `sales-v2` → `Sales.V2` (valid); `sales-2024` → `Sales.2024` (invalid).
- The root namespace typically has the shape `{Client}.{ProjectName}`.
- Database name: `<root-namespace>` with dots removed + `Db` (`Acme.App` → `AcmeAppDb`). SQL Database Project name: `{Name}.Database`.

Derived project names:

| Artifact       | Name                    |
| -------------- | ----------------------- |
| Solution       | `{Name}.slnx`           |
| API            | `{Name}.Api`            |
| Application    | `{Name}.Application`    |
| Domain         | `{Name}.Domain`         |
| Infrastructure | `{Name}.Infrastructure` |
| Unit tests     | `{Name}.UnitTests`      |
| SQL database   | `{Name}.Database`       |

C# namespaces follow the project name and folder (`namespace {Name}.{Layer};`, `dotnet_style_namespace_match_folder = true`).

## Backend root location

Resolve the backend root (the folder containing the `.slnx`) in this order:

1. The `<backend-folder>` passed by an orchestrator.
2. Otherwise `output.local/backend/` when it contains the .NET solution (default scaffold location: `<cwd>/output.local/backend/`; a repository's `.github/copilot-instructions.md` may specify another output folder).
3. Otherwise ask, or locate the root by finding the clean architecture projects (`*.Api`, `*.Application`, `*.Domain`, `*.Infrastructure`).

Always resolve to an absolute path; do not rely on a relative `output/backend` path.

## Solution layout

```text
<backend-root>/
  {Name}.slnx                 # XML solution format (dotnet new sln --format slnx)
  nuget.config
  .editorconfig               # also listed as <File Path=".editorconfig" /> in the .slnx
  {Name}.Api/
  {Name}.Application/
  {Name}.Domain/
  {Name}.Infrastructure/
  tests/
    {Name}.UnitTests/
      Api/
      Application/
      Domain/
      Infrastructure/
```

- The solution file is `.slnx` (not `.sln`).
- `.editorconfig` lives at the solution root and must be referenced as a solution item: `<File Path=".editorconfig" />` inside `<Solution>`.
- The test project lives under `tests/` (in the `.slnx` it appears under a `/tests/` solution folder).

## Layers and project references

| Project                  | Role                                                                | References              | Template   |
| ------------------------ | ------------------------------------------------------------------- | ----------------------- | ---------- |
| `{Name}.Api`             | ASP.NET Web API host: controllers, middleware, `Program.cs`         | Infrastructure          | `webapi`   |
| `{Name}.Infrastructure`  | External concerns: database, HTTP clients, third-party integrations | Application             | `classlib` |
| `{Name}.Application`     | Use cases, business logic orchestration, interfaces                 | Domain                  | `classlib` |
| `{Name}.Domain`          | Entities, value objects, domain events, pure domain logic           | _(none)_                | `classlib` |
| `tests/{Name}.UnitTests` | Unit tests for all layers                                           | All four projects above | `xunit`    |

Dependency direction:

```text
Api → Infrastructure → Application → Domain
```

- No layer may reference a layer above it.
- Api references only Infrastructure directly; it reaches Application and Domain transitively.

## Target framework and project settings

- The sources do not pin a target framework; projects use the `dotnet new` template default of the installed SDK (observed: `net10.0`).
- Template defaults kept: `<Nullable>enable</Nullable>`, `<ImplicitUsings>enable</ImplicitUsings>`; Api uses `Microsoft.NET.Sdk.Web`, other projects `Microsoft.NET.Sdk`; test project `<IsPackable>false</IsPackable>` and global `<Using Include="Xunit" />`.

## Folder conventions

Use a **domain-driven folder structure**: group by feature/domain, not by technical concern. There is no `Controllers/` or `Models/` folder at the project root.

Do:

```text
Api/
  Orders/
    OrdersController.cs
    CreateOrderRequest.cs
  Invoices/
    InvoicesController.cs
```

Don't:

```text
Api/
  Controllers/
    OrdersController.cs
    InvoicesController.cs
  Models/
    CreateOrderRequest.cs
```

## Dependency injection per layer

Each project exposes exactly one `ConfigureServices.cs` at its root, a `public static class ConfigureServices` with a `Register{Layer}Services` extension method on `IServiceCollection` that returns `services` (chainable).

Template:

```csharp
using Microsoft.Extensions.DependencyInjection;

namespace {Name}.{Layer};

public static class ConfigureServices
{
    public static IServiceCollection Register{Layer}Services(this IServiceCollection services)
    {
        // {Layer}-specific registrations go here
        return services;
    }
}
```

| `{Layer}`        | Method                             | Scaffold-time body                                                                                       |
| ---------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `Domain`         | `RegisterDomainServices()`         | Empty                                                                                                    |
| `Application`    | `RegisterApplicationServices()`    | Empty                                                                                                    |
| `Infrastructure` | `RegisterInfrastructureServices()` | Empty                                                                                                    |
| `Api`            | `RegisterApiServices()`            | `AddControllers()`, `AddHealthChecks()`, `AddHttpContextAccessor()`, `AddSingleton(TimeProvider.System)` |

Api body at scaffold time:

```csharp
        services.AddControllers();
        services.AddHealthChecks();
        services.AddHttpContextAccessor();
        services.AddSingleton(TimeProvider.System);

        return services;
```

- Registration order is fixed: Domain → Application → Infrastructure → Api.
- Service registrations such as `AddControllers()`, `AddHealthChecks()`, `AddHttpContextAccessor()` belong in `RegisterApiServices()`, never in `Program.cs`.
- Once CORS is added, `RegisterApiServices` takes `IConfiguration` (`RegisterApiServices(this IServiceCollection services, IConfiguration configuration)`); see [CORS](#cors). Other layers may likewise gain an `IConfiguration` parameter when they need configuration (observed: `RegisterInfrastructureServices(builder.Configuration)` after data access setup).

## Program.cs composition

Keep `Program.cs` minimal. It only:

- conditionally adds OpenAPI (Development only) and Application Insights (non-Development only);
- chain-calls the DI registrations in the fixed order;
- configures the middleware pipeline (`UseHttpsRedirection`, `UseCors` once CORS is set up, `MapControllers`);
- maps the built-in health endpoint.

No template-generated comments and no WeatherForecast code may remain.

Canonical scaffold `Program.cs`:

```csharp
using {Name}.Api;
using {Name}.Application;
using {Name}.Domain;
using {Name}.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddOpenApi();
}
if (!builder.Environment.IsDevelopment())
{
    builder.Services.AddApplicationInsightsTelemetry();
}

builder.Services
    .RegisterDomainServices()
    .RegisterApplicationServices()
    .RegisterInfrastructureServices()
    .RegisterApiServices();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.MapControllers();
app.MapHealthChecks("/api/health");
app.Run();
```

## Health check

- Use the built-in ASP.NET Core health checks middleware.
- Register `AddHealthChecks()` in `RegisterApiServices()`.
- Map with `app.MapHealthChecks("/api/health")` in `Program.cs`.
- Do **not** create a custom `HealthController`.

## Application Insights and OpenAPI

- Package `Microsoft.ApplicationInsights.AspNetCore` in the Api project.
- `ApplicationInsights:ConnectionString` is present in `appsettings.json` as an empty placeholder.
- Call `AddApplicationInsightsTelemetry()` only when **not** in Development.
- `AddOpenApi()` / `MapOpenApi()` only in Development.

## Time access

Register `TimeProvider.System` as a singleton in `RegisterApiServices()`. Handlers and services obtain the current time through the injectable .NET `TimeProvider` abstraction, never by calling `DateTimeOffset.UtcNow` / `DateTime.UtcNow` directly, so tests can inject a fake `TimeProvider`.

## Serialization

Always use **System.Text.Json**. Never use Newtonsoft.Json.

## Launch settings

`{Name}.Api/Properties/launchSettings.json` is replaced wholesale (not edited) and keeps only the `https` profile (the `http` profile is removed):

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

## Environments and appsettings files

Environments: `Development` (local only) and the deployed environments `Dev`, `Uat`, `Prod`. Files live in the Api project.

| File                           | `Logging:LogLevel:Default` | Application Insights                           | Notes                                       |
| ------------------------------ | -------------------------- | ---------------------------------------------- | ------------------------------------------- |
| `appsettings.json`             | `Information`              | `ApplicationInsights:ConnectionString` = `""`  | Base config; **no** `AllowedHosts`          |
| `appsettings.Development.json` | `Information`              | _(not included)_                               | Local dev only; holds `"AllowedHosts": "*"` |
| `appsettings.Dev.json`         | `Information`              | ConnectionString placeholder + AI log override | Deployed dev                                |
| `appsettings.Uat.json`         | `Warning`                  | ConnectionString placeholder + AI log override | UAT                                         |
| `appsettings.Prod.json`        | `Warning`                  | ConnectionString placeholder + AI log override | Production                                  |

`Microsoft.AspNetCore` log level is `Warning` in every file. Every deployed environment (Dev, Uat, Prod) has an `ApplicationInsights` logging override: `Default: Warning`, `{Name}: Information`.

`appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ApplicationInsights": {
    "ConnectionString": ""
  }
}
```

`appsettings.Development.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

`appsettings.{Dev|Uat|Prod}.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "<Information|Warning>",
      "Microsoft.AspNetCore": "Warning"
    },
    "ApplicationInsights": {
      "LogLevel": {
        "Default": "Warning",
        "{Name}": "Information"
      }
    }
  },
  "ApplicationInsights": {
    "ConnectionString": ""
  }
}
```

Later setup adds `Cors:AllowedOrigins` (see [CORS](#cors)) and `ConnectionStrings:DefaultConnection` to all appsettings files.

## CORS

| Item             | Convention                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| Policy name      | `"Frontend"`, exposed as `public const string CorsPolicyName` on `{Name}.Api.ConfigureServices`        |
| Config key       | `Cors:AllowedOrigins` (string array), read via `IConfiguration`, defaulting to `[]`                    |
| Policy           | `WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()`                                        |
| Registration     | Private `ConfigureCors(this IServiceCollection, IConfiguration)` called first in `RegisterApiServices` |
| Composition      | `RegisterApiServices(builder.Configuration)`                                                           |
| Middleware order | `UseHttpsRedirection()` → `UseCors({Name}.Api.ConfigureServices.CorsPolicyName)` → `MapControllers()`  |

`Cors:AllowedOrigins` values per file:

| File                            | Value                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------- |
| `appsettings.json`              | `[]` (placeholder, sibling of `ApplicationInsights`)                          |
| `appsettings.Development.json`  | Local frontend dev origin(s), e.g. `["http://localhost:5173"]` (Vite default) |
| `appsettings.Dev/Uat/Prod.json` | `[]` placeholder, filled with that environment's deployed frontend URL(s)     |

Api `ConfigureServices.cs` with CORS:

```csharp
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace {Name}.Api;

public static class ConfigureServices
{
    public const string CorsPolicyName = "Frontend";

    public static IServiceCollection RegisterApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.ConfigureCors(configuration);
        services.AddControllers();
        services.AddHealthChecks();
        services.AddHttpContextAccessor();
        services.AddSingleton(TimeProvider.System);

        return services;
    }

    private static IServiceCollection ConfigureCors(this IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

        services.AddCors(options =>
        {
            options.AddPolicy(CorsPolicyName, policy =>
            {
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            });
        });

        return services;
    }
}
```

`Program.cs` changes:

```csharp
builder.Services
    .RegisterDomainServices()
    .RegisterApplicationServices()
    .RegisterInfrastructureServices()
    .RegisterApiServices(builder.Configuration);
```

```csharp
app.UseHttpsRedirection();
app.UseCors({Name}.Api.ConfigureServices.CorsPolicyName);
app.MapControllers();
```

The `TimeProvider.System` line is not in the CORS source template; see [Conflicts and gaps](#conflicts-and-gaps).

## NuGet configuration and packages

- `nuget.config` at the backend root, created with `dotnet new nugetconfig` (default content: `<clear />` then the single `nuget` source `https://api.nuget.org/v3/index.json`).
- Packages are added with `dotnet add package` without explicit versions (latest at scaffold time); no versions are pinned by the standard.

| Project                 | Packages at scaffold time                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{Name}.Domain`         | `Microsoft.Extensions.DependencyInjection.Abstractions`                                                                                                             |
| `{Name}.Application`    | `Microsoft.Extensions.DependencyInjection.Abstractions`                                                                                                             |
| `{Name}.Infrastructure` | `Microsoft.Extensions.DependencyInjection.Abstractions`                                                                                                             |
| `{Name}.Api`            | `Microsoft.ApplicationInsights.AspNetCore` (+ `Microsoft.AspNetCore.OpenApi` from the `webapi` template)                                                            |
| `{Name}.UnitTests`      | `AwesomeAssertions`, `AutoFixture`, `FakeItEasy` (+ `xunit`, `xunit.runner.visualstudio`, `Microsoft.NET.Test.Sdk`, `coverlet.collector` from the `xunit` template) |

## Test project

| Aspect      | Convention                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------- |
| Location    | `tests/{Name}.UnitTests/`                                                                    |
| Framework   | xUnit                                                                                        |
| Assertions  | AwesomeAssertions (fluent)                                                                   |
| Test data   | AutoFixture                                                                                  |
| Mocking     | FakeItEasy                                                                                   |
| References  | Api, Application, Domain, Infrastructure                                                     |
| Folders     | Mirror one folder per solution project: `Api/`, `Application/`, `Domain/`, `Infrastructure/` |
| Boilerplate | Template `UnitTest1.cs` removed                                                              |

`dotnet build {Name}.slnx` and `dotnet test {Name}.slnx` must both succeed with zero errors.

## Code style (.editorconfig)

The solution-root `.editorconfig` is the standard Nexus file. Significant rules:

### Core / file formatting

| Files                                                 | Rules                                                                   |
| ----------------------------------------------------- | ----------------------------------------------------------------------- |
| `[*]`                                                 | `indent_style = space`, `end_of_line = lf`                              |
| `*.cs, *.csx, *.vb, *.vbx`                            | `indent_size = 4`, `insert_final_newline = true`, `charset = utf-8-bom` |
| `*.csproj, *.vbproj, *.proj, ...`                     | `indent_size = 4`                                                       |
| `*.props, *.targets, *.config, *.nuspec, *.resx, ...` | `indent_size = 2`                                                       |
| `*.json`                                              | `indent_size = 2`                                                       |
| `*.ps1`                                               | `indent_size = 2`                                                       |
| `*.sh`                                                | `indent_size = 2`, `end_of_line = lf`                                   |
| `*.{cs,vb}`                                           | `tab_width = 4`                                                         |

### Usings and namespaces

| Rule                                       | Value                                    |
| ------------------------------------------ | ---------------------------------------- |
| `dotnet_sort_system_directives_first`      | `true` (System usings first)             |
| `dotnet_separate_import_directive_groups`  | `true` (blank line between using groups) |
| `csharp_using_directive_placement`         | `outside_namespace:silent`               |
| `csharp_style_namespace_declarations`      | `file_scoped:silent`                     |
| `dotnet_style_namespace_match_folder`      | `true:suggestion`                        |
| `csharp_prefer_simple_using_statement`     | `true:suggestion`                        |
| `csharp_style_prefer_top_level_statements` | `true:silent`                            |

### `var` and types

| Rule                                                                                | Value                                                      |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `csharp_style_var_for_built_in_types` / `_when_type_is_apparent` / `_elsewhere`     | `true:suggestion` (var everywhere)                         |
| `dotnet_diagnostic.IDE0007.severity`                                                | `warning` ("prefer var everywhere")                        |
| `dotnet_style_predefined_type_for_locals_parameters_members` / `_for_member_access` | `true:suggestion` (`int`, `string` over `Int32`, `String`) |
| `csharp_style_implicit_object_creation_when_type_is_apparent`                       | `true:suggestion` (target-typed `new()`)                   |
| `dotnet_style_qualification_for_field/property/method/event`                        | `false:suggestion` (no `this.`)                            |

### Braces, newlines, indentation, spacing

- Allman braces: `csharp_new_line_before_open_brace = all`; newline before `else`, `catch`, `finally`, members in object initializers and anonymous types, between query clauses.
- Braces required: `csharp_prefer_braces = true:silent` with `dotnet_diagnostic.IDE0011.severity = warning` (add braces); ReSharper `braces_for_for/foreach/ifelse/while = required`.
- `csharp_preserve_single_line_blocks = true`, `csharp_preserve_single_line_statements = true`.
- Indentation: block contents, case contents (also when block) and switch labels indented; braces not indented; labels `flush_left`.
- Spacing: space after keywords in control flow, after comma, around binary operators (`before_and_after`), around `:` in inheritance clauses, after `;` in `for`; no space after cast, around dots, inside parentheses/brackets, or between method name and `(`.
- Wrapping: `dotnet_style_operator_placement_when_wrapping = beginning_of_line`; ReSharper chops long argument lists, parameter lists, chained calls and extends lists (`chop_if_long`); attributes not placed on the same line; max 1 initializer element per line; `keep_existing_linebreaks = false`.

### Naming

| Symbols                             | Style                                     |
| ----------------------------------- | ----------------------------------------- |
| Constant fields (any accessibility) | PascalCase                                |
| Non-private `readonly` fields       | PascalCase                                |
| Non-private `static` fields         | PascalCase                                |
| Instance fields                     | camelCase with `_` prefix (`_repository`) |
| Locals and parameters               | camelCase                                 |
| Local functions                     | PascalCase                                |
| All other members (default)         | PascalCase                                |

All naming rules have severity `suggestion`.

### Language and expression preferences (mostly `suggestion`)

- Expression-bodied methods, constructors, operators, properties, indexers, accessors: `true:suggestion`; lambdas `true:silent`; local functions `false:silent`.
- Primary constructors preferred (`csharp_style_prefer_primary_constructors = true:suggestion`).
- Collection expressions (`when_types_loosely_match:suggestion`), object/collection initializers, null propagation, coalesce, throw expressions, conditional delegate call, inferred tuple / anonymous member names, explicit tuple names, compound assignment, simplified booleans and interpolation, index/range operators, tuple swap, UTF-8 string literals, deconstruction, inlined `out` variables, simple `default`, `is null` checks, `not` patterns, extended property patterns, switch expressions, pattern matching over `as`/cast checks, static local functions, readonly structs, local functions over anonymous functions.
- `dotnet_style_require_accessibility_modifiers = for_non_interface_members:suggestion`; `dotnet_style_readonly_field = true:suggestion`.
- Modifier order: `public, private, protected, internal, static, extern, new, virtual, abstract, sealed, override, readonly, unsafe, volatile, async`.
- Parentheses: `never_if_unnecessary:silent` for all operator categories.
- Unused value assignment: discard (`_ = ...`) preferred.

### Diagnostics severities

| Diagnostic | Severity                                                                 | Meaning                                |
| ---------- | ------------------------------------------------------------------------ | -------------------------------------- |
| IDE0055    | warning                                                                  | Fix formatting                         |
| IDE0035    | warning                                                                  | Remove unreachable code                |
| IDE0036    | warning                                                                  | Order modifiers                        |
| IDE0043    | warning                                                                  | Invalid format string placeholder      |
| IDE0044    | warning                                                                  | Make field readonly                    |
| IDE0011    | warning                                                                  | Add braces                             |
| IDE0040    | warning                                                                  | Add accessibility modifiers            |
| IDE0051    | warning                                                                  | Remove unused private member           |
| IDE0052    | warning                                                                  | Remove unread private member           |
| IDE0059    | warning                                                                  | Unnecessary assignment                 |
| IDE0060    | warning                                                                  | Remove unused parameter                |
| IDE0007    | warning                                                                  | Use `var`                              |
| IDE0058    | none                                                                     | Expression value never used (disabled) |
| CA1822     | warning under `[*.{cs,vb}]`, overridden to **suggestion** under `[*.cs]` | Make member static (false positives)   |

ReSharper inspection highlights for redundant parentheses, `this.` qualifiers, modifier arrangement, built-in type references and var-vs-type are lowered to `hint`.

## Resulting scaffold

What a fresh backend scaffold contains:

- `.slnx` solution with Api (`webapi`), Application, Domain, Infrastructure (`classlib`) and `tests/{Name}.UnitTests` (`xunit`) projects added.
- `nuget.config` and the standard `.editorconfig` at the root, `.editorconfig` registered as a solution `<File>`.
- Template boilerplate removed: `Class1.cs` in each class library, `UnitTest1.cs`, `{Name}.Api.http`, WeatherForecast code and template comments.
- Project references per [Layers and project references](#layers-and-project-references).
- Test mirror folders `Api/`, `Application/`, `Domain/`, `Infrastructure/`.
- Packages per [NuGet configuration and packages](#nuget-configuration-and-packages).
- HTTPS-only `launchSettings.json`, five appsettings files, minimal `Program.cs`, four `ConfigureServices.cs`.
- Scaffolding aborts if the output folder already exists (never overwrite).

The full backend skeleton then adds, in order: CQRS command handling core in `{Name}.Application/CommandHandling/Core/`, CORS, the Dapper + DapperExtensions data access layer (Repository + Unit of Work, Docker SQL Server for local dev), and an SDK-style SQL Database Project `{Name}.Database` (target platform `SqlServer2022`, folders `dbo/Tables/`, `dbo/Views/`, `dbo/StoredProcedures/`, `dbo/Functions/`, `Scripts/Pre-Deployment/`, `Scripts/Post-Deployment/`) wired into the solution, with `ConnectionStrings:DefaultConnection` in all appsettings files.

## Validation invariants

- Solution builds with zero errors and tests pass (`dotnet build {Name}.slnx`, `dotnet test {Name}.slnx`), after scaffolding and after every change such as CORS.
- No template comments in `Program.cs`; no WeatherForecast code.
- Health endpoint mapped at `/api/health` via `MapHealthChecks`.
- Only the `https` launch profile.
- `AllowedHosts` only in `appsettings.Development.json`; `ApplicationInsights:ConnectionString` in `appsettings.json`.
- `appsettings.Dev.json`, `appsettings.Uat.json`, `appsettings.Prod.json` exist; Dev = Information, Uat/Prod = Warning; all three have the App Insights log override.
- Domain-driven folders (no `Controllers/` folder).
- `TimeProvider.System` singleton registered in `RegisterApiServices()`.
- All four `ConfigureServices.cs` files exist.
- Test project has mirror folders.
- `.editorconfig` at the solution root and referenced in the `.slnx`.
- With CORS: `CorsPolicyName` constant, `ConfigureCors` called from `RegisterApiServices`, `RegisterApiServices(builder.Configuration)`, `UseCors` between `UseHttpsRedirection` and `MapControllers`, `Cors:AllowedOrigins` in all five appsettings files.

## Conflicts and gaps

- **`TimeProvider` vs CORS template** — `dotnet-app-init-launchpad` requires `services.AddSingleton(TimeProvider.System)` in `RegisterApiServices`; the replacement `ConfigureServices.cs` in `dotnet-setup-cors-launchpad` omits it. Keep the line when applying CORS (as the reference project does).
- **`RegisterApiServices` signature** — the scaffold produces `RegisterApiServices(this IServiceCollection services)`, while `dotnet-setup-cors-launchpad` lists `RegisterApiServices(this IServiceCollection services, IConfiguration configuration)` as a prerequisite and then introduces that signature itself. The parameterless form is the pre-CORS state; the `IConfiguration` form is the post-CORS state.
- **`UseCors` snippet** — `dotnet-setup-cors-launchpad` shows the literal `Acme.App.Api.ConfigureServices.CorsPolicyName` in its code sample and `{Name}.Api.ConfigureServices.CorsPolicyName` in its checklist; the `{Name}` form is the rule.
- **Default output folder** — the scaffold script falls back to `output/backend` when no path is given; the flows and backend-root resolution use `output.local/backend/`, and warn against the relative `output/backend` path.
- **Target framework and package versions** — not specified; inherited from the installed SDK templates and latest NuGet at scaffold time.

## Sources

`dotnet-app-init-launchpad`, `backend-create-launchpad`, `dotnet-setup-cors-launchpad`, `standards-launchpad`

Extracted from NexusInnovation/nexus-plugin-marketplace plugins/launchpad on 2026-11-24.
