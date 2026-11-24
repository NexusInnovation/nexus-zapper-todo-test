# Backend CQRS Command Handling Standard

The custom CQRS command handling standard (no MediatR) for the .NET Application layer: core interfaces, pipeline behaviors, `LoggingBehavior`, and the per-operation command contracts (List, Find, Create, Update, Delete) with their handler templates and unit test conventions.

## Contents

- [Placeholder notation](#placeholder-notation)
- [Principles](#principles)
- [Folder and namespace placement](#folder-and-namespace-placement)
- [Core interfaces](#core-interfaces)
- [Pipeline infrastructure](#pipeline-infrastructure)
- [DI registration](#di-registration)
- [Commands: single-file convention and naming](#commands-single-file-convention-and-naming)
- [Generic command templates](#generic-command-templates)
- [Validators](#validators)
- [Pipeline behaviors](#pipeline-behaviors)
- [Behavior marker interfaces](#behavior-marker-interfaces)
- [LoggingBehavior](#loggingbehavior)
- [Module operation commands: shared rules](#module-operation-commands-shared-rules)
- [Entity DTO](#entity-dto)
- [Per-operation contract summary](#per-operation-contract-summary)
- [List{Entity}Command](#listentitycommand)
- [Find{Entity}Command](#findentitycommand)
- [Create{Entity}Command](#createentitycommand)
- [Update{Entity}Command](#updateentitycommand)
- [Delete{Entity}Command](#deleteentitycommand)
- [Unit test conventions](#unit-test-conventions)
- [Build and test gate](#build-and-test-gate)
- [Conflicts and gaps in the sources](#conflicts-and-gaps-in-the-sources)
- [Sources](#sources)

---

## Placeholder notation

Placeholders are kept exactly as in the sources. Both notations appear and mean the same thing:

| Placeholder                             | Meaning                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| `{RootNamespace}` / `<RootNamespace>`   | Root .NET namespace, e.g. `{Client}.{ProjectName}` (`Acme.App`)                         |
| `{Entity}` / `<Entity>`                 | PascalCase entity name from `entity.name` in the module YAML (e.g. `Customer`, `Order`) |
| `<entity>`                              | camelCase entity name (used for the injected repository parameter)                      |
| `{EntityPlural}` / `<EntityPlural>`     | Conventional English plural of the entity (e.g. `Customers`, `Orders`)                  |
| `{CommandName}`                         | Verb + entity, **without** the `Command` suffix (e.g. `CreateAppliance`)                |
| `{BehaviorName}`                        | Short concern name for a behavior (e.g. `Audit`, `Caching`, `Retry`, `Logging`)         |
| `{TestProject}` / `{TestRootNamespace}` | Unit test project folder / namespace (e.g. `{Client}.{ProjectName}.UnitTests`)          |
| `<EntityField…>` / `<CommandField…>`    | Entity class property name / PascalCase command field name                              |
| `<MappingExpression>`                   | Ordered constructor argument list for `<Entity>Dto`                                     |

---

## Principles

- Lightweight, **custom** CQRS — no MediatR. Do not use this standard in MediatR-based projects.
- Every operation (read or write) is modelled as a **command** with a handler and a result. Queries (List, Find) use the same `ICommand` / `ICommandHandler` types.
- Commands and results are always **immutable `record` types with positional parameters**. Never use `class` or mutable properties for them.
- Cross-cutting concerns (logging, transactions, auditing…) are **pipeline behaviors** wrapped around handlers by a decorator; commands opt in via marker interfaces.
- The Application layer is free of HTTP concerns. Exception → HTTP status mapping (e.g. `NotFoundException` → 404) belongs exclusively to the API layer `IExceptionHandler` implementations.

---

## Folder and namespace placement

| Artifact                                                          | Folder (Application project)                     | Namespace                                                |
| ----------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| Core infrastructure (interfaces, delegate, decorator, extensions) | `CommandHandling/Core/`                          | `{RootNamespace}.Application.CommandHandling.Core`       |
| Pipeline behaviors and marker interfaces                          | `CommandHandling/`                               | `{RootNamespace}.Application.CommandHandling`            |
| `ConfigureServices.cs` (DI registration)                          | Application project root                         | `{RootNamespace}.Application`                            |
| Generic command file (`{CommandName}Command.cs`)                  | `Application/`                                   | `{RootNamespace}.Application`                            |
| Module DTO (`{Entity}Dto.cs`)                                     | `Application/<EntityPlural>/`                    | `<RootNamespace>.Application.<EntityPlural>`             |
| Module commands (Find, Update, Delete)                            | `Application/<EntityPlural>/`                    | `<RootNamespace>.Application.<EntityPlural>`             |
| Handler tests                                                     | `tests/{TestProject}/` (mirror source structure) | `{TestRootNamespace}` (+ sub-namespace mirroring source) |
| Behavior tests                                                    | `tests/{TestProject}/CommandHandling/`           | `{TestRootNamespace}.CommandHandling`                    |

Rules:

- Behavior files live in `CommandHandling/` (not `Core/`) and **must** add `using {RootNamespace}.Application.CommandHandling.Core;`.
- Marker interfaces do **not** need a `using` for the Core namespace.
- `ConfigureServices.cs` imports both `{RootNamespace}.Application.CommandHandling` and `{RootNamespace}.Application.CommandHandling.Core`.
- The canonical example places a module command in a module sub-namespace: `CreateApplianceCommand.cs` in `namespace ProjectName.Application.Appliances;` with tests in `ProjectName.UnitTests.Appliances`.
- Path differences between operations are listed under [Conflicts and gaps](#conflicts-and-gaps-in-the-sources).

Prerequisite package: the Application `.csproj` must reference `Microsoft.Extensions.DependencyInjection.Abstractions`.

---

## Core interfaces

The bootstrap creates exactly six files in `CommandHandling/Core/`, all in namespace `{RootNamespace}.Application.CommandHandling.Core`:

| File                          | Content                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `IResult.cs`                  | `IResult` marker interface                                                                                                |
| `ICommand.cs`                 | `ICommand<TResult>` interface with default `GetErrorLogMessage`                                                           |
| `ICommandHandler.cs`          | `ICommandHandler<TCommand, TResult>` interface                                                                            |
| `IPipelineBehavior.cs`        | `RequestHandlerDelegate<TResult>` delegate + `IPipelineBehavior<TCommand, TResult>` interface with default `ShouldHandle` |
| `CommandHandlerDecorator.cs`  | Internal decorator wiring behaviors around handlers                                                                       |
| `CommandHandlerExtensions.cs` | `AddCommandHandler<THandler, TCommand, TResult>` extension method for manual DI registration                              |

Pipeline behaviors (e.g. `ErrorHandlingBehavior`, `TransactionBehavior`, `LoggingBehavior`) are **not** part of the bootstrap; they are added afterwards as behaviors.

### IResult

Marker interface for all command results.

```csharp
namespace {RootNamespace}.Application.CommandHandling.Core;

public interface IResult { }
```

### ICommand\<TResult\>

Base interface for all commands. `TResult` must implement `IResult`. Provides a default error log message used by the error handling / logging behavior. Teams may override `GetErrorLogMessage` per command to include command-specific context (e.g. entity IDs).

```csharp
namespace {RootNamespace}.Application.CommandHandling.Core;

public interface ICommand<TResult>
    where TResult : IResult
{
    string GetErrorLogMessage(Exception ex) =>
        $"Unhandled exception while executing {GetType().Name}: {ex.Message}";
}
```

### ICommandHandler\<TCommand, TResult\>

Handler interface with a single `Handle` method (no `CancellationToken` parameter).

```csharp
namespace {RootNamespace}.Application.CommandHandling.Core;

public interface ICommandHandler<TCommand, TResult>
    where TCommand : ICommand<TResult>
    where TResult : IResult
{
    Task<TResult> Handle(TCommand command);
}
```

---

## Pipeline infrastructure

### RequestHandlerDelegate and IPipelineBehavior

Cross-cutting concerns wrap handlers via a decorator pipeline. Each behavior opts in/out per command via `ShouldHandle` (default `true`).

```csharp
namespace {RootNamespace}.Application.CommandHandling.Core;

public delegate Task<TResult> RequestHandlerDelegate<TResult>();

public interface IPipelineBehavior<TCommand, TResult>
    where TCommand : ICommand<TResult>
    where TResult : IResult
{
    bool ShouldHandle(TCommand command) => true;
    Task<TResult> Handle(TCommand command, RequestHandlerDelegate<TResult> next);
}
```

### CommandHandlerDecorator

Internal sealed decorator that wraps a handler with all registered pipeline behaviors whose `ShouldHandle` returns `true`. It iterates the behaviors in reverse while building the chain, so the **first registered behavior is the outermost** (runs first).

```csharp
namespace {RootNamespace}.Application.CommandHandling.Core;

internal sealed class CommandHandlerDecorator<TCommand, TResult>(
    ICommandHandler<TCommand, TResult> inner,
    IEnumerable<IPipelineBehavior<TCommand, TResult>> behaviors)
    : ICommandHandler<TCommand, TResult>
    where TCommand : ICommand<TResult>
    where TResult : IResult
{
    public Task<TResult> Handle(TCommand command)
    {
        RequestHandlerDelegate<TResult> pipeline = () => inner.Handle(command);

        foreach (var behavior in behaviors.Where(b => b.ShouldHandle(command)).Reverse())
        {
            var next = pipeline;
            pipeline = () => behavior.Handle(command, next);
        }

        return pipeline();
    }
}
```

### ErrorHandlingBehavior (reference example)

Catches unhandled exceptions and logs them using the command's `GetErrorLogMessage`, then re-throws. Lives in `CommandHandling/` (not `Core/`).

```csharp
using {RootNamespace}.Application.CommandHandling.Core;

using Microsoft.Extensions.Logging;

namespace {RootNamespace}.Application.CommandHandling;

public class ErrorHandlingBehavior<TCommand, TResult>(
    ILogger<ErrorHandlingBehavior<TCommand, TResult>> logger)
    : IPipelineBehavior<TCommand, TResult>
    where TCommand : ICommand<TResult>
    where TResult : IResult
{
    public async Task<TResult> Handle(TCommand command, RequestHandlerDelegate<TResult> next)
    {
        try
        {
            return await next();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "{ErrorMessage}", command.GetErrorLogMessage(ex));
            throw;
        }
    }
}
```

---

## DI registration

### Auto-discovery (preferred)

`ConfigureServices.cs` at the Application project root exposes `RegisterApplicationServices(this IServiceCollection services)`. It calls the private `RegisterCommandHandlersFromAssembly(typeof(ConfigureServices).Assembly)`, which discovers every non-abstract, non-interface `ICommandHandler<,>` implementation by reflection, registers the concrete handler as **scoped**, and registers the interface as **scoped**, resolving to a `CommandHandlerDecorator<,>` wrapping the handler and the `IEnumerable<IPipelineBehavior<,>>`.

```csharp
using System.Reflection;

using {RootNamespace}.Application.CommandHandling;
using {RootNamespace}.Application.CommandHandling.Core;

using Microsoft.Extensions.DependencyInjection;

namespace {RootNamespace}.Application;

public static class ConfigureServices
{
    public static IServiceCollection RegisterApplicationServices(
        this IServiceCollection services)
    {
        services
            .RegisterCommandHandlersFromAssembly(typeof(ConfigureServices).Assembly);

        return services;
    }

    private static void RegisterCommandHandlersFromAssembly(
        this IServiceCollection services,
        Assembly assembly)
    {
        var commandHandlerInterface = typeof(ICommandHandler<,>);

        var handlers = assembly.GetTypes()
            .Where(t => t is { IsAbstract: false, IsInterface: false })
            .SelectMany(t => t.GetInterfaces()
                .Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == commandHandlerInterface)
                .Select(i => (HandlerType: t, InterfaceType: i)));

        foreach (var (handlerType, interfaceType) in handlers)
        {
            var typeArgs = interfaceType.GetGenericArguments();
            var decoratorType = typeof(CommandHandlerDecorator<,>).MakeGenericType(typeArgs);
            var behaviorsType = typeof(IEnumerable<>).MakeGenericType(
                typeof(IPipelineBehavior<,>).MakeGenericType(typeArgs));

            services.AddScoped(handlerType);
            services.AddScoped(interfaceType, sp =>
            {
                var inner = sp.GetRequiredService(handlerType);
                var behaviors = sp.GetRequiredService(behaviorsType);
                return Activator.CreateInstance(decoratorType, inner, behaviors)!;
            });
        }
    }
}
```

- Immediately after bootstrap, **no behaviors** are registered. Behavior registrations (`AddTransient(typeof(IPipelineBehavior<,>), typeof(XxxBehavior<,>))`) are added alongside `RegisterCommandHandlersFromAssembly` as behaviors are introduced.
- Because of auto-discovery, new handlers need no manual registration.
- The API project's `Program.cs` must call:

  ```csharp
  builder.Services.RegisterApplicationServices();
  ```

  Do not alter other registration chains in `Program.cs` without confirmation.

### Manual registration (alternative)

`CommandHandlerExtensions.cs` exposes:

```csharp
public static IServiceCollection AddCommandHandler<THandler, TCommand, TResult>(
    this IServiceCollection services)
    where THandler : class, ICommandHandler<TCommand, TResult>
    where TCommand : ICommand<TResult>
    where TResult : IResult
```

---

## Commands: single-file convention and naming

Each command is **one `.cs` file** named `{CommandName}Command.cs` containing, in this order:

1. The **Command** record implementing `ICommand<TResult>` (plus optional behavior marker interfaces).
2. The **Result** record implementing `IResult`.
3. (Optional) The **Validator** class — between the result record and the handler.
4. The **Handler** class implementing `ICommandHandler<TCommand, TResult>`.

### Naming

| Item            | Pattern                                                                    | Example                                   |
| --------------- | -------------------------------------------------------------------------- | ----------------------------------------- |
| Command record  | `{Verb}{Entity}Command`                                                    | `CreateApplianceCommand`                  |
| Result record   | `{Verb}{Entity}Result`                                                     | `CreateApplianceResult`                   |
| Handler class   | `{Verb}{Entity}CommandHandler`                                             | `CreateApplianceCommandHandler`           |
| Validator class | `{CommandName}CommandValidator`                                            | `CreateApplianceCommandValidator`         |
| File name       | `{Verb}{Entity}Command.cs`                                                 | `CreateApplianceCommand.cs`               |
| Folder          | `Application/`                                                             | `Application/`                            |
| Handler tests   | `{CommandName}CommandHandlerTests.cs`                                      | `CreateApplianceCommandHandlerTests.cs`   |
| Validator tests | `{CommandName}CommandValidatorTests.cs`                                    | `CreateApplianceCommandValidatorTests.cs` |
| Entity DTO      | `{Entity}Dto` in `{Entity}Dto.cs`                                          | `CustomerDto`                             |
| Behavior        | `{BehaviorName}Behavior<TCommand, TResult>` in `{BehaviorName}Behavior.cs` | `LoggingBehavior`                         |
| Marker          | `IRequire{BehaviorName}` in `IRequire{BehaviorName}.cs`                    | `IRequireTransaction`                     |

### Record field rules

- `{CommandFields}` and `{ResultFields}` are positional record parameters given as `Type Name` pairs (e.g. `string Name, string Model`, `Guid ApplianceId`).
- A command or result with no fields omits the parentheses and uses an empty record body `{ }` (e.g. `public record Delete<Entity>Result : IResult { }`).
- `{BehaviorMarkers}` are appended comma-separated after `ICommand<…>` (e.g. `, IRequireTransaction`); omitted if none. Add `using` directives for marker namespaces if they differ.
- YAML field names are converted to PascalCase for record parameter names (`firstName` → `FirstName`).

### Canonical example

```csharp
using ProjectName.Application.CommandHandling.Core;

namespace ProjectName.Application.Appliances;

public record CreateApplianceCommand(string Name, string Model) : ICommand<CreateApplianceResult>;

public record CreateApplianceResult(Guid ApplianceId) : IResult;

public class CreateApplianceCommandHandler : ICommandHandler<CreateApplianceCommand, CreateApplianceResult>
{
    public async Task<CreateApplianceResult> Handle(CreateApplianceCommand command)
    {
        // TODO: Implement domain logic
        throw new NotImplementedException();
    }
}
```

---

## Generic command templates

Freshly scaffolded handlers contain a `TODO` placeholder and `throw new NotImplementedException();` until domain logic is implemented. Defaults for a new generic command: no behavior markers, no validator, unit test **yes**.

### Without validator

```csharp
using {RootNamespace}.Application.CommandHandling.Core;

namespace {RootNamespace}.Application;

public record {CommandName}Command({CommandFields}) : ICommand<{CommandName}Result>{BehaviorMarkers};

public record {CommandName}Result({ResultFields}) : IResult;

public class {CommandName}CommandHandler : ICommandHandler<{CommandName}Command, {CommandName}Result>
{
    public async Task<{CommandName}Result> Handle({CommandName}Command command)
    {
        // TODO: Implement domain logic
        throw new NotImplementedException();
    }
}
```

### With validator

```csharp
using FluentValidation;

using {RootNamespace}.Application.CommandHandling.Core;

namespace {RootNamespace}.Application;

public record {CommandName}Command({CommandFields}) : ICommand<{CommandName}Result>{BehaviorMarkers};

public record {CommandName}Result({ResultFields}) : IResult;

public class {CommandName}CommandValidator : AbstractValidator<{CommandName}Command>
{
    public {CommandName}CommandValidator()
    {
        // TODO: Add validation rules
    }
}

public class {CommandName}CommandHandler : ICommandHandler<{CommandName}Command, {CommandName}Result>
{
    public async Task<{CommandName}Result> Handle({CommandName}Command command)
    {
        // TODO: Implement domain logic
        throw new NotImplementedException();
    }
}
```

---

## Validators

- Validators are **optional** and use FluentValidation `AbstractValidator<T>`, living in the **same file** as the command, between the result record and the handler.
- If FluentValidation is not yet referenced in the Application project, it must be added and a validation pipeline behavior wired up (no such behavior is part of the baseline).
- Validator tests use `FluentValidation.TestHelper` and include at least one passing and one failing scenario.
- **None of the five module operation commands (List, Find, Create, Update, Delete) generate a validator.**

---

## Pipeline behaviors

### Design decisions for a behavior

| Decision               | Options                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name                   | `{BehaviorName}` (e.g. `Audit`, `Caching`, `Retry`) → class `{BehaviorName}Behavior`                                                              |
| Marker                 | Default `IRequire{BehaviorName}`; overridable                                                                                                     |
| When it runs           | Preprocessor (before handler), postprocessor (after handler), or wrapping (both)                                                                  |
| Dependencies           | Primary-constructor parameters (e.g. `IAuditService auditService, ILogger<AuditBehavior<TCommand, TResult>> logger`)                              |
| Always active / opt-in | Always active → no marker, `ShouldHandle` omitted (interface default `true`). Opt-in → `ShouldHandle` returns `command is IRequire{BehaviorName}` |

### Paths

| Artifact         | Path                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| Marker interface | `Application/CommandHandling/IRequire{BehaviorName}.cs` (opt-in only) |
| Behavior class   | `Application/CommandHandling/{BehaviorName}Behavior.cs`               |
| Test file        | `tests/{TestProject}/CommandHandling/{BehaviorName}BehaviorTests.cs`  |

### Marker interface template

```csharp
namespace {RootNamespace}.Application.CommandHandling;

public interface IRequire{BehaviorName} { }
```

### Preprocessor template

```csharp
using {RootNamespace}.Application.CommandHandling.Core;

namespace {RootNamespace}.Application.CommandHandling;

public class {BehaviorName}Behavior<TCommand, TResult>({Dependencies})
    : IPipelineBehavior<TCommand, TResult>
    where TCommand : ICommand<TResult>
    where TResult : IResult
{
    public bool ShouldHandle(TCommand command) => {ShouldHandleExpression};

    public async Task<TResult> Handle(TCommand command, RequestHandlerDelegate<TResult> next)
    {
        // TODO: Implement pre-handler logic
        return await next();
    }
}
```

### Postprocessor template

```csharp
using {RootNamespace}.Application.CommandHandling.Core;

namespace {RootNamespace}.Application.CommandHandling;

public class {BehaviorName}Behavior<TCommand, TResult>({Dependencies})
    : IPipelineBehavior<TCommand, TResult>
    where TCommand : ICommand<TResult>
    where TResult : IResult
{
    public bool ShouldHandle(TCommand command) => {ShouldHandleExpression};

    public async Task<TResult> Handle(TCommand command, RequestHandlerDelegate<TResult> next)
    {
        var result = await next();
        // TODO: Implement post-handler logic
        return result;
    }
}
```

### Wrapping template

```csharp
using {RootNamespace}.Application.CommandHandling.Core;

namespace {RootNamespace}.Application.CommandHandling;

public class {BehaviorName}Behavior<TCommand, TResult>({Dependencies})
    : IPipelineBehavior<TCommand, TResult>
    where TCommand : ICommand<TResult>
    where TResult : IResult
{
    public bool ShouldHandle(TCommand command) => {ShouldHandleExpression};

    public async Task<TResult> Handle(TCommand command, RequestHandlerDelegate<TResult> next)
    {
        // TODO: Implement pre-handler logic
        var result = await next();
        // TODO: Implement post-handler logic
        return result;
    }
}
```

Substitutions: omit the `{Dependencies}` parentheses if there are none; for always-active behaviors omit the `ShouldHandle` method entirely.

### Registration and ordering

Register in `ConfigureServices.RegisterApplicationServices()` alongside existing behavior registrations:

```csharp
.AddTransient(typeof(IPipelineBehavior<,>), typeof({BehaviorName}Behavior<,>))
```

- Behaviors are **transient**; handlers are **scoped**.
- **Registration order matters**: behaviors execute as a pipeline, and the first registration is the outermost wrapper. Decide explicitly where a new behavior sits relative to existing ones (e.g. before/after `ErrorHandlingBehavior`, before/after `TransactionBehavior`).
- `LoggingBehavior` must be the **first** `IPipelineBehavior<,>` registered.

### Applying an opt-in marker to existing commands

Append the marker to the end of the command record's inheritance list; do not reorder existing interfaces or change anything else:

```csharp
public record CreateApplianceCommand(string Name) : ICommand<CreateApplianceResult>, IRequire{BehaviorName};
```

When a new marker is introduced, document it in the behavior marker catalogue (its usage, implementation, and when to offer it).

### Behavior test template

xUnit + FakeItEasy + AwesomeAssertions; Given/When/Then method names. Match the mocking library already used by existing behavior tests (e.g. `ErrorHandlingBehaviorTests.cs`).

```csharp
using FakeItEasy;
using AwesomeAssertions;

using {RootNamespace}.Application.CommandHandling;

namespace {TestRootNamespace}.CommandHandling;

public class {BehaviorName}BehaviorTests
{
    private readonly {BehaviorName}Behavior<TestCommand, TestResult> _behavior;
    {DependencyFields}

    public {BehaviorName}BehaviorTests()
    {
        {DependencyFakes}
        _behavior = new {BehaviorName}Behavior<TestCommand, TestResult>({FakeArguments});
    }

    [Fact]
    public async Task GivenApplicableCommand_WhenHandled_ThenBehaviorIsApplied()
    {
        // Arrange
        var command = new TestCommand();
        var expectedResult = new TestResult();
        RequestHandlerDelegate<TestResult> next = () => Task.FromResult(expectedResult);

        // Act
        var result = await _behavior.Handle(command, next);

        // Assert
        result.Should().Be(expectedResult);
        // TODO: Assert behavior-specific side effects
    }

    [Fact]
    public void GivenApplicableCommand_WhenCheckingShouldHandle_ThenReturnsTrue()
    {
        // Arrange
        var command = new TestCommand();

        // Act
        var result = _behavior.ShouldHandle(command);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void GivenNonApplicableCommand_WhenCheckingShouldHandle_ThenReturnsFalse()
    {
        // Arrange
        var command = new NonMarkedTestCommand();

        // Act
        var result = ((IPipelineBehavior<NonMarkedTestCommand, TestResult>)
            new {BehaviorName}Behavior<NonMarkedTestCommand, TestResult>({FakeArguments}))
            .ShouldHandle(command);

        // Assert
        result.Should().BeFalse();
    }

    // Test helpers
    private record TestCommand : ICommand<TestResult>, IRequire{BehaviorName};
    private record NonMarkedTestCommand : ICommand<TestResult>;
    private record TestResult : IResult;
}
```

- `{DependencyFields}` → `private readonly I{Dep} _{dep};` per dependency; `{DependencyFakes}` → `_{dep} = A.Fake<I{Dep}>();`; `{FakeArguments}` → the `_{dep}` arguments.
- For always-active behaviors, omit the `GivenNonApplicableCommand…` test and the `NonMarkedTestCommand` helper.

---

## Behavior marker interfaces

Markers keep behaviors decoupled: a behavior inspects the command at runtime via `ShouldHandle` and only activates when the marker is present. To add a concern: create the marker in `CommandHandling/`, create the behavior, make `ShouldHandle` check the marker, register it (`services.AddTransient(typeof(IPipelineBehavior<,>), typeof(AuditBehavior<,>));`), and let commands opt in by adding the marker.

### IRequireTransaction / TransactionBehavior / ITransaction

`TransactionBehavior` calls `ITransaction.CommitAsync()` after the handler completes successfully (postprocessor).

```csharp
namespace {RootNamespace}.Application.CommandHandling;

public interface IRequireTransaction { }
```

```csharp
public record CreateApplianceCommand(string Name)
    : ICommand<CreateApplianceResult>, IRequireTransaction;
```

```csharp
using {RootNamespace}.Application.CommandHandling.Core;

namespace {RootNamespace}.Application.CommandHandling;

public class TransactionBehavior<TCommand, TResult>(ITransaction transaction)
    : IPipelineBehavior<TCommand, TResult>
    where TCommand : ICommand<TResult>
    where TResult : IResult
{
    public bool ShouldHandle(TCommand command) => command is IRequireTransaction;

    public async Task<TResult> Handle(TCommand command, RequestHandlerDelegate<TResult> next)
    {
        var result = await next();
        await transaction.CommitAsync();
        return result;
    }
}
```

`ITransaction` abstracts committing a unit of work; Infrastructure provides the concrete implementation.

```csharp
namespace {RootNamespace}.Application.CommandHandling;

public interface ITransaction
{
    Task CommitAsync(CancellationToken cancellationToken = default);
}
```

### When to offer markers

| Marker                | Offer when…                                   |
| --------------------- | --------------------------------------------- |
| `IRequireTransaction` | The command creates, updates, or deletes data |

Note: the five module operation commands are all scaffolded **without** markers (see [Per-operation contract summary](#per-operation-contract-summary)).

---

## LoggingBehavior

### Design contract

- Fixed parameters: name `Logging`; class `LoggingBehavior<TCommand, TResult>`; file `CommandHandling/LoggingBehavior.cs`; **no marker interface (always active)**, applies to every command; runs **wrapping** (try/catch around `next()`); single dependency `ILogger<LoggingBehavior<TCommand, TResult>>`.
- Wraps `next()` in try/catch and calls `ILogger.LogError` with the caught exception and `command.GetErrorLogMessage(ex)`.
- **Always re-throws** — never swallows the exception, never writes to `HttpContext`.
- Happy path: calls `next()` and returns the result **without any logging**.
- Logging happens before the exception propagates, so the log entry is always written even if a caller also handles the exception.
- Owns no HTTP response mapping; that is the API layer `IExceptionHandler`'s sole responsibility.

### NuGet requirement

The Application project must reference `Microsoft.Extensions.Logging.Abstractions` (not included in the baseline backend scaffold), using the same major version as `Microsoft.Extensions.DependencyInjection.Abstractions`:

```powershell
dotnet add <application-project-csproj> package Microsoft.Extensions.Logging.Abstractions
```

```xml
<PackageReference Include="Microsoft.Extensions.Logging.Abstractions" Version="10.0.0" />
```

### Reference implementation

```csharp
using {RootNamespace}.Application.CommandHandling.Core;

using Microsoft.Extensions.Logging;

namespace {RootNamespace}.Application.CommandHandling;

public class LoggingBehavior<TCommand, TResult>(
    ILogger<LoggingBehavior<TCommand, TResult>> logger)
    : IPipelineBehavior<TCommand, TResult>
    where TCommand : ICommand<TResult>
    where TResult : IResult
{
    public async Task<TResult> Handle(TCommand command, RequestHandlerDelegate<TResult> next)
    {
        try
        {
            return await next();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "{ErrorMessage}", command.GetErrorLogMessage(ex));
            throw;
        }
    }
}
```

### Registration

Register as the **first** `IPipelineBehavior<,>` in `ConfigureServices.cs`, before any other behavior registration:

```csharp
services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
```

The List command scaffold must ensure `LoggingBehavior` is wired into the pipeline.

### Tests

| Test method                                                | What to assert                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `GivenHandlerThrows_WhenExecuted_ThenLogsErrorAndRethrows` | Exception propagates **and** `ILogger.LogError` was called with that exception |
| `GivenHandlerSucceeds_WhenExecuted_ThenReturnsResult`      | Result is returned **and** `ILogger.LogError` was **not** called               |

---

## Module operation commands: shared rules

These apply to `List`, `Find`, `Create`, `Update`, and `Delete` commands generated from a module YAML:

- **Inputs:** `<Entity>` from `entity.name`; `<EntityPlural>` = conventional English plural; fields from `entity.fields` (name, type, required); system fields from the file referenced by `entity.systemFields` (e.g. `system-fields.yaml`, resolved relative to the module YAML).
- **System-fields YAML is authoritative** for system field names: the PascalCase of each YAML key is the C# property name. The domain entity class `Domain/Entities/<Entity>.cs` is read to confirm exact property names.
- YAML-to-C# type mapping (including nullability for optional fields) follows the shared type mapping standard; it applies equally to system and module fields.
- **No behavior markers** (`LoggingBehavior` is always active), **no validator**, **unit test always generated**.
- Handlers inject the entity-specific repository `I<Entity>Repository` (namespace `<RootNamespace>.Domain.Repositories`, located in `Domain/Repositories/`).
- Repository methods used: `GetAllAsync()`, `GetByIdAsync(id)`, `InsertAsync(entity)`, `UpdateAsync(entity)`, `DeleteAsync(id)` — each also accepts a `CancellationToken` (tests match it with `A<CancellationToken>._`); handlers call them without passing one.
- `GetByIdAsync` / `GetAllAsync` never return soft-deleted rows.
- Not-found is signalled by `throw new NotFoundException(DomainErrors.Generic.NotFound, $"<Entity> with id '{command.Id}' was not found.");` — message must contain the requested id. `NotFoundException` lives in `<RootNamespace>.Domain.Exceptions`; `DomainErrors` in `<RootNamespace>.Domain`. The API layer maps it to HTTP 404.
- Time values come from the injected .NET `TimeProvider` (`timeProvider.GetUtcNow()`); **never** call `DateTimeOffset.UtcNow` / `DateTime.UtcNow` directly. `TimeProvider.System` is registered in DI by the backend baseline.
- The caller identity comes from `IAuthenticatedUserService.GetAuthenticatedUser()` (namespace `<RootNamespace>.Application.Authentication`).
- **System field behaviour** (from `system-fields.yaml`):

  | System field kind                                    | Create                           | Update                    | Delete                                       |
  | ---------------------------------------------------- | -------------------------------- | ------------------------- | -------------------------------------------- |
  | Primary key `id` (no `defaultValue`/`computedValue`) | `Id = Guid.NewGuid()`            | never assigned            | —                                            |
  | `defaultValue` present                               | assigned once                    | never touched             | —                                            |
  | `computedValue` present                              | assigned                         | re-assigned on every save | —                                            |
  | Soft-delete flag/timestamp/identity trio             | only its `defaultValue` (if any) | never touched             | stamped **only** by repository `DeleteAsync` |

  Value expressions: `now` → `timeProvider.GetUtcNow()`; identity (`username` / `authenticatedUser`) → `authenticatedUserService.GetAuthenticatedUser()`.

- System fields are never command parameters (they never appear in `layout.create`; in `layout.edit` they may only be `readonly`).

---

## Entity DTO

`{Entity}Dto` is shared by List, Find, and Update. Create it only if absent; **never modify an existing one**.

- Path: `Application/<EntityPlural>/{Entity}Dto.cs`; namespace `<RootNamespace>.Application.<EntityPlural>`.
- Positional record. Parameters: **system fields first** (in `system-fields.yaml` order), **then module fields** (in `entity.fields` order). System fields are always included even if absent from `entity.fields`.
- **Exclude the soft-delete fields** from the DTO — soft-deleted rows are never returned, so those fields carry no information for API consumers.
- Parameter names are PascalCase of YAML names.
- This ordering keeps the DTO aligned with `BaseEntity` and the frontend `systemFieldsSchema` (avoids Zod validation errors).

```csharp
namespace <RootNamespace>.Application.<EntityPlural>;

public record <Entity>Dto(
    // System fields — derived from entity.systemFields YAML in order
    <SystemField1Type> <SystemField1Name>,
    <SystemField2Type> <SystemField2Name>,
    // … all system fields
    // Module fields — derived from entity.fields in order
    <Field1Type> <Field1Name>,
    <Field2Type> <Field2Name>
    // …
);
```

**Mapping expression:** `<MappingExpression>` maps **all** DTO constructor parameters in exactly the DTO order: `e.<SystemField1>, e.<SystemField2>, …, e.<Field1>, e.<Field2>, …` (variable `e` in List lambdas, `entity` in Find/Update). Update must reuse the exact order of the existing DTO — never re-derive it independently from YAML.

---

## Per-operation contract summary

| Aspect              | List                                                   | Find                                   | Create                                                             | Update                                                                 | Delete                                                    |
| ------------------- | ------------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| Command             | `List<Entity>Command`                                  | `Find<Entity>Command`                  | `Create<Entity>Command`                                            | `Update<Entity>Command`                                                | `Delete<Entity>Command`                                   |
| Command fields      | _(none)_                                               | `Guid Id`                              | one per `entity.layout.create` entry, in order                     | `Guid Id` + one per `editable` entry in `entity.layout.edit`, in order | `Guid Id`                                                 |
| Result              | `List<Entity>Result(IReadOnlyList<<Entity>Dto> Items)` | `Find<Entity>Result(<Entity>Dto Item)` | `Create<Entity>Result(Guid <Entity>Id)`                            | `Update<Entity>Result(<Entity>Dto Item)`                               | `Delete<Entity>Result : IResult { }` (empty)              |
| Injected services   | `I<Entity>Repository`                                  | `I<Entity>Repository`                  | `I<Entity>Repository`, `IAuthenticatedUserService`, `TimeProvider` | `I<Entity>Repository`, `IAuthenticatedUserService`, `TimeProvider`     | `I<Entity>Repository` **only**                            |
| Repository calls    | `GetAllAsync()`                                        | `GetByIdAsync(command.Id)`             | `InsertAsync(entity)`                                              | `GetByIdAsync(command.Id)` then `UpdateAsync(entity)`                  | `GetByIdAsync(command.Id)` then `DeleteAsync(command.Id)` |
| NotFoundException   | no                                                     | yes, when `null`                       | no                                                                 | yes, when `null`                                                       | yes, when `null` (incl. already soft-deleted)             |
| DTO mapping         | every entity → `<Entity>Dto`                           | entity → `<Entity>Dto`                 | none (returns Id)                                                  | mutated entity → `<Entity>Dto`                                         | none                                                      |
| Markers / validator | none / no                                              | none / no                              | none / no                                                          | none / no                                                              | none / no                                                 |
| HTTP (API layer)    | 200 bare array                                         | 200 / 404                              | 201 Created                                                        | 200 with DTO / 404                                                     | 204 No Content / 404                                      |

---

## List{Entity}Command

- No parameters; returns all (non-soft-deleted) entities as DTOs.
- Ensures `LoggingBehavior` is wired into the pipeline.
- Requires the `{Entity}Dto` (create if absent).

```csharp
public class List<Entity>CommandHandler(I<Entity>Repository <entity>Repository)
    : ICommandHandler<List<Entity>Command, List<Entity>Result>
{
    public async Task<List<Entity>Result> Handle(List<Entity>Command command)
    {
        var entities = await <entity>Repository.GetAllAsync();
        var items = entities
            .Select(e => new <Entity>Dto(<MappingExpression>))
            .ToList();
        return new List<Entity>Result(items);
    }
}
```

Required usings:

```csharp
using <RootNamespace>.Application.<EntityPlural>;
using <RootNamespace>.Domain.Repositories;
```

Tests (`I{Entity}Repository` faked with `A.Fake<I{Entity}Repository>()`):

| Test                                                   | Arrange / Assert                                                                    |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `Given<Entity>sExist_WhenHandled_ThenReturnsAllAsDtos` | mock returns a list of entities; `result.Items` has expected count and field values |
| `GivenNo<Entity>s_WhenHandled_ThenReturnsEmptyList`    | mock returns empty list; `result.Items` is empty                                    |

---

## Find{Entity}Command

- `Find<Entity>Command(Guid Id)` → `Find<Entity>Result(<Entity>Dto Item)`.
- Calls `GetByIdAsync`; throws `NotFoundException` with `DomainErrors.Generic.NotFound` when `null` (→ HTTP 404).
- Reuses an existing `{Entity}Dto` (shared with List); creates it if absent.
- Also used by the frontend to prefill the edit form (Update reuses it rather than duplicating it).

```csharp
using <RootNamespace>.Application.<EntityPlural>;
using <RootNamespace>.Domain;
using <RootNamespace>.Domain.Exceptions;
using <RootNamespace>.Domain.Repositories;

namespace <RootNamespace>.Application.<EntityPlural>;

public class Find<Entity>CommandHandler(I<Entity>Repository <entity>Repository)
    : ICommandHandler<Find<Entity>Command, Find<Entity>Result>
{
    public async Task<Find<Entity>Result> Handle(Find<Entity>Command command)
    {
        var entity = await <entity>Repository.GetByIdAsync(command.Id);

        if (entity is null)
            throw new NotFoundException(DomainErrors.Generic.NotFound, $"<Entity> with id '{command.Id}' was not found.");

        var item = new <Entity>Dto(<MappingExpression>);
        return new Find<Entity>Result(item);
    }
}
```

Mapping: `entity.<SystemField1>, entity.<SystemField2>, …, entity.<Field1>, entity.<Field2>, …` in DTO order.

Tests:

| Test                                                            | Arrange / Assert                                                                                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Given<Entity>Exists_WhenHandled_ThenReturnsDto`                | mock returns a valid entity for the `Guid`; `result.Item` has expected field values                                                              |
| `Given<Entity>NotFound_WhenHandled_ThenThrowsNotFoundException` | mock returns `null`; `NotFoundException` thrown, message contains id, `ErrorCode == DomainErrors.Generic.NotFound` (single chained `ThrowAsync`) |

---

## Create{Entity}Command

- Command fields: one per entry of `entity.layout.create`, in order, typed from `entity.fields` (e.g. `string OrderNumber, string Status, decimal TotalAmount, DateTimeOffset OrderDate`).
- System fields (from `system-fields.yaml`, such as `id`, and any field with a `defaultValue` or `computedValue`) are **never** in `layout.create` and never command parameters — the handler assigns them.
- Result: `Create<Entity>Result(Guid <Entity>Id)` (e.g. `Guid OrderId`), returning `entity.Id`.
- Handler builds the domain entity with an object initializer containing **all** `BaseEntity` system fields plus all `<CreateFields>`, then calls `InsertAsync`.
- `<SystemFieldAssignments>`: one assignment per system field with a `defaultValue` or `computedValue` (PascalCase name), **excluding the soft-delete trio's `computedValue`** (applied only by `DeleteAsync`; their `defaultValue`, if any, is still assigned). Any system or command field whose YAML value is `authenticatedUser` uses the resolved `authenticatedUser`.

```csharp
public class Create<Entity>CommandHandler(
    I<Entity>Repository <entity>Repository,
    IAuthenticatedUserService authenticatedUserService,
    TimeProvider timeProvider)
    : ICommandHandler<Create<Entity>Command, Create<Entity>Result>
{
    public async Task<Create<Entity>Result> Handle(Create<Entity>Command command)
    {
        var authenticatedUser = authenticatedUserService.GetAuthenticatedUser();
        var now = timeProvider.GetUtcNow();

        var entity = new <Entity>
        {
            Id = Guid.NewGuid(),
            // One assignment per field in <DefaultValueFields> and <ComputedValueFields> (see Step 2), e.g.
            // <SystemFieldProperty> = now / authenticatedUser depending on its YAML value:
            <SystemFieldAssignments>
            <EntityField1> = command.<CommandField1>,
            <EntityField2> = command.<CommandField2>,
            // …
        };

        await <entity>Repository.InsertAsync(entity);

        return new Create<Entity>Result(entity.Id);
    }
}
```

Required usings:

```csharp
using <RootNamespace>.Domain.Entities;
using <RootNamespace>.Domain.Repositories;
using <RootNamespace>.Application.Authentication;
```

Tests (FakeItEasy fakes for `I{Entity}Repository` and `IAuthenticatedUserService` returning `"test.user@example.com"`; deterministic `FakeTimeProvider` from `Microsoft.Extensions.TimeProvider.Testing` when available, otherwise `TimeProvider.System`; `InsertAsync` configured with `.Returns(Task.CompletedTask)`):

| Test                                                     | Assert                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GivenValidCommand_WhenHandled_ThenReturnsNewId`         | `result.<Entity>Id` ≠ `Guid.Empty`                                                                                                                                                                                     |
| `GivenValidCommand_WhenHandled_ThenCallsInsertAsyncOnce` | `A.CallTo(() => <entity>Repository.InsertAsync(A<<Entity>>.That.Matches(e => e.<EntityField1> == command.<CommandField1>), A<CancellationToken>._)).MustHaveHappenedOnceExactly()` — at least one field in the matcher |

---

## Update{Entity}Command

- Requires `Find<Entity>Command` (in `<ApplicationProjectPath>/<EntityPlural>/Find<Entity>Command.cs`) to exist — reuse it unchanged if present, otherwise create it per the Find contract; never duplicate it. The `<Entity>Dto` is reused, never redeclared.
- Command fields: `Guid Id`, then one per `editable` entry of `entity.layout.edit`, in order (e.g. `Guid Id, string OrderNumber, string Status, decimal TotalAmount, DateTimeOffset OrderDate`).
  - Entries marked `readonly` are ignored (never command parameters, never mutated).
  - If `entity.layout.edit` is **absent**, every field in `entity.fields` is editable, in declaration order.
  - When `layout.edit` is present, fields not listed are left untouched.
  - System fields may only appear as `readonly`.
- Result: `Update<Entity>Result(<Entity>Dto Item)` — the full updated entity state, so callers (the PUT endpoint) need no second query. Never an empty result.
- Handler: `GetByIdAsync` → `NotFoundException` if `null` → mutate only editable fields + `computedValue` system fields → `UpdateAsync` → map to DTO.
- `<ComputedValueFieldAssignments>`: one per system field with `computedValue` (e.g. `computedValue: now` → `timeProvider.GetUtcNow()`; `computedValue: username` → `authenticatedUserService.GetAuthenticatedUser()`), **except** the soft-delete trio. No assignment to `Id` or to `defaultValue`-only system fields.
- `<MappingExpression>` maps all DTO parameters (not just editable ones) in the existing DTO order.

Canonical template:

```csharp
public class Update<Entity>CommandHandler(
    I<Entity>Repository <entity>Repository,
    IAuthenticatedUserService authenticatedUserService,
    TimeProvider timeProvider)
    : ICommandHandler<Update<Entity>Command, Update<Entity>Result>
{
    public async Task<Update<Entity>Result> Handle(Update<Entity>Command command)
    {
        var entity = await <entity>Repository.GetByIdAsync(command.Id)
            ?? throw new NotFoundException(
                DomainErrors.Generic.NotFound,
                $"<Entity> with id '{command.Id}' was not found.");

        entity.<EntityField1> = command.<CommandField1>;
        entity.<EntityField2> = command.<CommandField2>;
        // …
        <ComputedValueFieldAssignments>

        await <entity>Repository.UpdateAsync(entity);

        var item = new <Entity>Dto(<MappingExpression>);
        return new Update<Entity>Result(item);
    }
}
```

Required usings:

```csharp
using <RootNamespace>.Application.Authentication;
using <RootNamespace>.Domain;
using <RootNamespace>.Domain.Exceptions;
using <RootNamespace>.Domain.Repositories;
```

Tests (FakeItEasy fakes for the repository and `IAuthenticatedUserService` returning `"test.user@example.com"`; `TimeProvider.System`, or `FakeTimeProvider` if already used in the project):

| Test                                                            | Arrange / Assert                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GivenValidCommand_WhenHandled_ThenCallsUpdateAsyncOnce`        | existing entity returned by `GetByIdAsync`; assert `UpdateAsync(A<<Entity>>.That.Matches(e => e.<EntityField1> == command.<CommandField1>), A<CancellationToken>._)` `MustHaveHappenedOnceExactly()` **and** `result.Item.<EntityField1>.Should().Be(command.<CommandField1>)` |
| `Given<Entity>NotFound_WhenHandled_ThenThrowsNotFoundException` | `GetByIdAsync` returns `null`; single chained `ThrowAsync` asserting message contains id and `ErrorCode == DomainErrors.Generic.NotFound`                                                                                                                                      |

---

## Delete{Entity}Command

- File: `<ApplicationProjectPath>/<EntityPlural>/Delete<Entity>Command.cs`.
- **Soft delete only.** The handler never issues SQL; `I<Entity>Repository.DeleteAsync(id)` stamps the soft-delete trio declared in `system-fields.yaml` and persists the row through `UpdateAsync`. No physical `DELETE` anywhere (the generic `DapperRepository<T>.DeleteAsync` must not call `connection.DeleteAsync<T>(...)` or emit `DELETE` SQL; if it does, the repository must be regenerated with soft-delete semantics before a Delete command is added).
- **No audit stamping in the handler**: inject only `I<Entity>Repository` — no `IAuthenticatedUserService`, no `TimeProvider`. The handler never mutates the entity and never calls `UpdateAsync` directly.
- **Existence check first**: `GetByIdAsync` excludes soft-deleted rows, so deleting twice throws `NotFoundException` the second time (→ 404), not a silent success. Exception uses `DomainErrors.Generic.NotFound` and a message containing the id.
- **Empty result**; the endpoint returns `204 No Content`.
- No module field information is needed.

```csharp
public record Delete<Entity>Command(Guid Id) : ICommand<Delete<Entity>Result>;

public record Delete<Entity>Result : IResult { }
```

Canonical handler template:

```csharp
public class Delete<Entity>CommandHandler(I<Entity>Repository <entity>Repository)
    : ICommandHandler<Delete<Entity>Command, Delete<Entity>Result>
{
    public async Task<Delete<Entity>Result> Handle(Delete<Entity>Command command)
    {
        _ = await <entity>Repository.GetByIdAsync(command.Id)
            ?? throw new NotFoundException(
                DomainErrors.Generic.NotFound,
                $"<Entity> with id '{command.Id}' was not found.");

        await <entity>Repository.DeleteAsync(command.Id);

        return new Delete<Entity>Result();
    }
}
```

Required usings (as listed by the source):

```csharp
using <RootNamespace>.Domain.Exceptions;
using <RootNamespace>.Domain.Repositories;
```

Tests (FakeItEasy fake `A.Fake<I<Entity>Repository>()`):

| Test                                                            | Arrange / Assert                                                                                                                                                                                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GivenExisting<Entity>_WhenHandled_ThenCallsDeleteAsyncOnce`    | `GetByIdAsync(id, A<CancellationToken>._)` returns a sample entity; assert `A.CallTo(() => <entity>Repository.DeleteAsync(id, A<CancellationToken>._)).MustHaveHappenedOnceExactly()`                                                           |
| `Given<Entity>NotFound_WhenHandled_ThenThrowsNotFoundException` | `GetByIdAsync` returns `null`; single chained `ThrowAsync` (message contains id, `ErrorCode == DomainErrors.Generic.NotFound`); then `A.CallTo(() => <entity>Repository.DeleteAsync(A<Guid>._, A<CancellationToken>._)).MustNotHaveHappened();` |

---

## Unit test conventions

- **Framework:** xUnit (`[Fact]`), **FakeItEasy** for mocks (`A.Fake<T>()`, `A.CallTo(...)`, `MustHaveHappenedOnceExactly()`, `MustNotHaveHappened()`, `A<T>._`, `A<T>.That.Matches(...)`), **AwesomeAssertions** (`.Should()`). Validators: `FluentValidation.TestHelper` (`TestValidate`, `ShouldNotHaveAnyValidationErrors`, `ShouldHaveAnyValidationError`). Match the mocking library already used in the test project.
- **Location:** unit test project, mirroring the source structure: `tests/{TestProject}/{CommandName}CommandHandlerTests.cs`, `tests/{TestProject}/{CommandName}CommandValidatorTests.cs`, `tests/{TestProject}/CommandHandling/{BehaviorName}BehaviorTests.cs`.
- **Naming:** `GivenCondition_WhenAction_ThenExpectation`.
- **Body:** `// Arrange`, `// Act`, `// Assert` sections.
- **Handlers with dependencies:** the default generated test (parameterless handler) is replaced by one injecting fakes for every constructor dependency.
- **Identity fake:** `A.CallTo(() => authenticatedUserService.GetAuthenticatedUser()).Returns("test.user@example.com")`.
- **Time:** `FakeTimeProvider` (`Microsoft.Extensions.TimeProvider.Testing`) for determinism when available, else `TimeProvider.System`.
- **Not-found assertion — single chained `ThrowAsync`** so the handler runs once (a second `await act.Should().ThrowAsync<>()` re-invokes the handler and causes false failures once handlers have side effects):

  ```csharp
  // Act
  Func<Task> act = () => handler.Handle(command);

  // Assert
  var exception = await act.Should().ThrowAsync<NotFoundException>()
      .WithMessage($"*{id}*");
  exception.Which.ErrorCode.Should().Be(DomainErrors.Generic.NotFound);
  ```

- **Default test values:** `"Test"` for strings, `Guid.NewGuid()` for Guids, `0` for numbers; invalid values for validator tests: `""` for required strings, `null` for non-nullable references, negative numbers for positive-only fields.

### Generic handler test template

```csharp
using {RootNamespace}.Application;

namespace {TestRootNamespace};

public class {CommandName}CommandHandlerTests
{
    [Fact]
    public async Task GivenValidCommand_WhenHandled_ThenReturnsExpectedResult()
    {
        // Arrange
        var handler = new {CommandName}CommandHandler();
        var command = new {CommandName}Command({DefaultValues});

        // Act
        var result = await handler.Handle(command);

        // Assert
        result.Should().NotBeNull();
    }
}
```

### Validator test template

```csharp
using FluentValidation.TestHelper;

using {RootNamespace}.Application;

namespace {TestRootNamespace};

public class {CommandName}CommandValidatorTests
{
    private readonly {CommandName}CommandValidator _validator = new();

    [Fact]
    public void GivenValidCommand_WhenValidated_ThenShouldNotHaveErrors()
    {
        // Arrange
        var command = new {CommandName}Command({DefaultValues});

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void GivenInvalidCommand_WhenValidated_ThenShouldHaveExpectedErrors()
    {
        // Arrange
        var command = new {CommandName}Command({InvalidValues});

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        // TODO: Assert specific property errors once validation rules are implemented
        result.ShouldHaveAnyValidationError();
    }
}
```

### Required test cases per artifact

| Artifact        | Test methods                                                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List            | `Given<Entity>sExist_WhenHandled_ThenReturnsAllAsDtos`, `GivenNo<Entity>s_WhenHandled_ThenReturnsEmptyList`                                                                                          |
| Find            | `Given<Entity>Exists_WhenHandled_ThenReturnsDto`, `Given<Entity>NotFound_WhenHandled_ThenThrowsNotFoundException`                                                                                    |
| Create          | `GivenValidCommand_WhenHandled_ThenReturnsNewId`, `GivenValidCommand_WhenHandled_ThenCallsInsertAsyncOnce`                                                                                           |
| Update          | `GivenValidCommand_WhenHandled_ThenCallsUpdateAsyncOnce`, `Given<Entity>NotFound_WhenHandled_ThenThrowsNotFoundException`                                                                            |
| Delete          | `GivenExisting<Entity>_WhenHandled_ThenCallsDeleteAsyncOnce`, `Given<Entity>NotFound_WhenHandled_ThenThrowsNotFoundException`                                                                        |
| LoggingBehavior | `GivenHandlerThrows_WhenExecuted_ThenLogsErrorAndRethrows`, `GivenHandlerSucceeds_WhenExecuted_ThenReturnsResult`                                                                                    |
| Opt-in behavior | `GivenApplicableCommand_WhenHandled_ThenBehaviorIsApplied`, `GivenApplicableCommand_WhenCheckingShouldHandle_ThenReturnsTrue`, `GivenNonApplicableCommand_WhenCheckingShouldHandle_ThenReturnsFalse` |

---

## Build and test gate

Every command or behavior change is complete only when the backend builds and all tests pass:

```powershell
dotnet build <BackendBuildTarget>
dotnet test <TestProjectPath> --no-build
```

`<BackendBuildTarget>` is the solution file, falling back to the Application `.csproj`. On failure, fix only the generated/affected files (do not modify unrelated files) and re-run until green.

---

## Conflicts and gaps in the sources

1. **Command file location / namespace.** The generic add-command convention puts commands at `Application/{CommandName}Command.cs` in namespace `{RootNamespace}.Application` (folder column: `Application/`), and the List and Create checklists say `Application/List<Entity>Command.cs` / `Application/Create<Entity>Command.cs`. However, the canonical example uses `ProjectName.Application.Appliances`, the Find handler declares `namespace <RootNamespace>.Application.<EntityPlural>;`, Update looks for `<ApplicationProjectPath>/<EntityPlural>/Find<Entity>Command.cs`, and Delete generates `<ApplicationProjectPath>/<EntityPlural>/Delete<Entity>Command.cs` (sources: `command-handling-launchpad`, `dotnet-list-command-launchpad`, `dotnet-create-command-launchpad` vs `dotnet-find-command-launchpad`, `dotnet-update-command-launchpad`, `dotnet-delete-command-launchpad`). The DTO is always in `Application/<EntityPlural>/`.
2. **Decorator order wording.** The reference text says the decorator applies behaviors "in reverse registration order", but the code reverses the list while building the chain, so the first registered behavior executes first (outermost); this is consistent with "register `LoggingBehavior` first" (`command-handling-launchpad`, `dotnet-logging-behavior-launchpad`).
3. **ErrorHandlingBehavior vs LoggingBehavior.** Both have an identical implementation (log with `GetErrorLogMessage`, re-throw). `command-handling-launchpad` presents `ErrorHandlingBehavior`; `dotnet-logging-behavior-launchpad` defines `LoggingBehavior` as the standard always-active behavior and refers to `ErrorHandlingBehaviorTests.cs` as an existing example. Neither states whether both may coexist.
4. **Create handler time/identity sources.** `dotnet-create-command-launchpad` contains a value-mapping table saying `now` → inject `IDateTimeOffsetProvider` (`UtcNowAsync()` / `.UtcNow`) and `username` → `"system"` placeholder, and its test case 1 configures `dateTimeOffsetProvider.UtcNow`; but its handler template, rules, and checklist use `TimeProvider.GetUtcNow()` and `IAuthenticatedUserService.GetAuthenticatedUser()`. The template/checklist (`TimeProvider` + `IAuthenticatedUserService`) is consistent with `dotnet-update-command-launchpad`.
5. **Identity YAML value name.** Create refers to the YAML value `authenticatedUser`; Update refers to `computedValue: username`; Create's mapping table refers to `username`.
6. **List command name.** The pattern is `List<Entity>` but the example is `ListCustomers` (plural) while the description says `List{Entity}Command`.
7. **CommandHandlerExtensions body.** Only the `AddCommandHandler<THandler, TCommand, TResult>` signature is given; no implementation body is defined.
8. **Soft-delete trio names** are referred to as the "flag/timestamp/identity trio declared in `system-fields.yaml`" but their concrete field names are not given in these sources.
9. **Delete usings.** The Delete handler uses `DomainErrors` but its listed usings omit `<RootNamespace>.Domain` (Find and Update include it).
10. **Test `using` for AwesomeAssertions** is not shown in the generic handler test template (only in the behavior test template) although assertions use `.Should()`.
11. **FakeTimeProvider in Update tests:** Update prefers `TimeProvider.System` (or `FakeTimeProvider` if already used), whereas Create prefers `FakeTimeProvider` when the package is available.

---

## Sources

- `command-handling-launchpad`
- `dotnet-logging-behavior-launchpad`
- `dotnet-list-command-launchpad`
- `dotnet-find-command-launchpad`
- `dotnet-create-command-launchpad`
- `dotnet-update-command-launchpad`
- `dotnet-delete-command-launchpad`

Extracted from NexusInnovation/nexus-plugin-marketplace plugins/launchpad on 2026-11-24.
