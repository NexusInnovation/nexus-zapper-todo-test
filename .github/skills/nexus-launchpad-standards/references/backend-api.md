# Backend Web API Standards

Conventions for the .NET Web API layer: module controllers and endpoint contracts, domain exceptions and RFC 9457 error responses, and Microsoft Entra ID JWT bearer authentication.

## Contents

- [Scope and prerequisites](#scope-and-prerequisites)
- [Naming, placement and namespaces](#naming-placement-and-namespaces)
- [Routing](#routing)
- [Endpoint contract matrix](#endpoint-contract-matrix)
- [Controller rules](#controller-rules)
- [Request models vs Application DTOs](#request-models-vs-application-dtos)
- [Action ordering inside the controller](#action-ordering-inside-the-controller)
- [Canonical controller code](#canonical-controller-code)
- [Error handling overview](#error-handling-overview)
- [DomainErrors and error code format](#domainerrors-and-error-code-format)
- [Domain exception hierarchy](#domain-exception-hierarchy)
- [Exception handlers (IExceptionHandler)](#exception-handlers-iexceptionhandler)
- [Status code mapping](#status-code-mapping)
- [Registration and middleware order](#registration-and-middleware-order)
- [FluentValidation integration](#fluentvalidation-integration)
- [Exception handler tests](#exception-handler-tests)
- [Adding a new exception type end-to-end](#adding-a-new-exception-type-end-to-end)
- [Entra ID JWT bearer authentication](#entra-id-jwt-bearer-authentication)
- [Authenticated user service](#authenticated-user-service)
- [Gaps and source conflicts](#gaps-and-source-conflicts)
- [Sources](#sources)

---

## Scope and prerequisites

A module endpoint requires, in the target project:

| Prerequisite                                                                                                 | Layer       |
| ------------------------------------------------------------------------------------------------------------ | ----------- |
| CQRS command handling infrastructure (`ICommandHandler<,>`, pipeline, DI)                                    | Application |
| The operation's command/result records (e.g. `List{Entity}Command` / `List{Entity}Result`) and `{Entity}Dto` | Application |
| Controllers wired in the Api project: `AddControllers()` + `app.MapControllers()`                            | Api         |
| Global exception handling: `IExceptionHandler` → `DomainExceptionHandler` (and `ValidationExceptionHandler`) | Api         |

Controllers compile against the **actual** generated command, result and DTO names — never assume type names; read the Application files (command record, result record, result property name, constructor parameters, DTO namespace) before writing the controller.

---

## Naming, placement and namespaces

| Item                      | Name / path                                                                                                  | Namespace                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Module controller         | `{ApiProject}/{EntityPlural}/Controllers/{EntityPlural}Controller.cs`                                        | `{RootNamespace}.Api.{EntityPlural}.Controllers`   |
| Create request record     | `{ApiProject}/{EntityPlural}/Requests/Create{Entity}Request.cs`                                              | `{RootNamespace}.Api.{EntityPlural}.Requests`      |
| Update request record     | `{ApiProject}/{EntityPlural}/Requests/Update{Entity}Request.cs`                                              | `{RootNamespace}.Api.{EntityPlural}.Requests`      |
| Exception handlers        | `{ApiProject}/ExceptionHandlers/ValidationExceptionHandler.cs`, `DomainExceptionHandler.cs`                  | `{RootNamespace}.Api.ExceptionHandlers`            |
| `/api/me` controller      | `{ProjectName}.Api/Controllers/MeController.cs`                                                              | `{ProjectName}.Api.Controllers`                    |
| Authenticated user impl.  | `{ProjectName}.Api/Authentication/AuthenticatedUserService.cs`                                               | `{RootNamespace}.Api.Authentication`               |
| Authenticated user iface  | `{ProjectName}.Application/Authentication/IAuthenticatedUserService.cs`                                      | `{RootNamespace}.Application.Authentication`       |
| Command handler interface | (Application)                                                                                                | `{RootNamespace}.Application.CommandHandling.Core` |
| DTO / commands            | e.g. `Application/{EntityPlural}/{Entity}Dto.cs`, `Application/{EntityPlural}/{Operation}{Entity}Command.cs` | e.g. `{RootNamespace}.Application.{EntityPlural}`  |

Name derivation from the module YAML:

- `{Entity}` = `entity.name` (e.g. `Customer`).
- `{EntityPlural}` = conventional English plural of `{Entity}` (e.g. `Customers`) — used for class names, namespaces and folders.
- `{module-name}` = `module-name` (e.g. `customers`) — the **lowercase plural route segment**. Use it verbatim; never re-pluralise or change its casing. Some sources call the same value `{entities}`.
- One controller per module (`{EntityPlural}Controller`) hosts all of the module's actions (List, Create, Find, Update, Delete).

---

## Routing

- Controller route: `[Route("api/{module-name}")]` → collection routes `/api/{module-name}`, item routes `/api/{module-name}/{id:guid}`.
- The frontend fetches `${API_URL}/{module-name}` where `API_URL` already ends in `/api`, so the route must match `module-name` exactly.
- Item routes always use the `{id:guid}` constraint: ASP.NET Core then returns `400 Bad Request` automatically for malformed IDs — no manual parsing.
- The route `{id}` is the command `Id`; it is **never** part of a request body.
- `/api/me` uses `[Route("api/[controller]")]` on `MeController`.

---

## Endpoint contract matrix

| Operation | HTTP / route                          | Action signature                                                                            | Dispatches                                                                                  | Success response                                                                              | Errors                                                  |
| --------- | ------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| List      | `GET /api/{module-name}`              | `Task<ActionResult<IReadOnlyList<{Entity}Dto>>> List()`                                     | `new List{Entity}Command()` (parameterless; plural names like `ListCustomersCommand` occur) | `200 OK`, **bare JSON array** `[...]` (or `[]`) = `result.Items`                              | global handlers                                         |
| Find      | `GET /api/{module-name}/{id:guid}`    | `Task<ActionResult<{Entity}Dto>> Find(Guid id)`                                             | `new Find{Entity}Command(id)`                                                               | `200 OK`, single `{Entity}Dto` = `result.Item`                                                | `404` (NotFoundException), `400` bad GUID               |
| Create    | `POST /api/{module-name}`             | `Task<ActionResult> Create([FromBody] Create{Entity}Request request)`                       | `new Create{Entity}Command(request.Field1, ...)`                                            | `201 Created`, location = new ID string, **no body**: `Created($"{result.{Entity}Id}", null)` | `422` validation/domain                                 |
| Update    | `PUT /api/{module-name}/{id:guid}`    | `Task<ActionResult<{Entity}Dto>> Update(Guid id, [FromBody] Update{Entity}Request request)` | `new Update{Entity}Command(id, request.Field1, ...)`                                        | `200 OK`, updated `{Entity}Dto` = `result.Item` from the Update result (no second query)      | `404`, `422`, `400` bad GUID                            |
| Delete    | `DELETE /api/{module-name}/{id:guid}` | `Task<IActionResult> Delete(Guid id)`                                                       | `new Delete{Entity}Command(id)`                                                             | `204 No Content` via `NoContent()`                                                            | `404` (missing or already soft-deleted), `400` bad GUID |
| Me        | `GET /api/me`                         | `IActionResult Get() => Ok()`                                                               | —                                                                                           | `200 OK`, empty body                                                                          | `401` without valid token                               |

Contract details:

- **List** returns the `Items` collection (`IReadOnlyList<{Entity}Dto>`) — never the `List{Entity}Result` wrapper (that would serialise as `{ "items": [...] }`). The frontend `parseListResponse` helper expects an array.
- **Find** returns `result.Item` — never the `Find{Entity}Result` wrapper.
- **Create** result exposes `Guid {Entity}Id` (e.g. `CustomerId`). Location value is the bare ID (e.g. `Location: 3fa85f64-...`), no path prefix. Never return the result object or `200 OK`. Equivalent form in sources: `Created(result.{EntityIdProperty}.ToString(), null)`.
- **Update** returns `Ok(result.Item)` from `Update{Entity}Result` — never the Find wrapper, never a second `findHandler` call, never `NoContent()`. The companion `GET /{id:guid}` (Find) is used by the frontend to prefill the edit form; it must exist **exactly once** on the controller (reuse if present, never duplicate).
- **Delete** is logical (soft delete: the repository stamps the soft-delete trio declared in `system-fields.yaml`). `Delete{Entity}Result` carries no data. Return type is `Task<IActionResult>` (not `ActionResult<T>`); no request body, no `[FromBody]`. Deliberately **not idempotent** at HTTP level: a second call returns `404` because `GetByIdAsync` no longer sees the soft-deleted row.

---

## Controller rules

- Attributes on every module controller: `[ApiController]` + `[Route("api/{module-name}")]`; derive from `ControllerBase`.
- Verb attributes: `[HttpGet]`, `[HttpPost]`, `[HttpGet("{id:guid}")]`, `[HttpPut("{id:guid}")]`, `[HttpDelete("{id:guid}")]`.
- `[FromBody]` is required on POST/PUT request parameters.
- Inject one `ICommandHandler<{Command}, {Result}>` per action via the **primary constructor**, named by operation: `listHandler`, `createHandler`, `findHandler`, `updateHandler`, `deleteHandler`. When adding an action to an existing controller, append the new handler parameter; never change or remove existing parameters or methods.
- Dispatch with `await {x}Handler.Handle(new {Command}(...))`; arguments are passed in the command's constructor order.
- **No try/catch in controllers.** All exceptions bubble to the global `IExceptionHandler` chain (`NotFoundException` → 404, etc.).
- No mapping in the controller: the Application handler already maps entity → DTO.
- `System.Collections.Generic` comes from `ImplicitUsings` — no extra using for `IReadOnlyList`.
- Usings: `Microsoft.AspNetCore.Mvc`, `{RootNamespace}.Application.CommandHandling.Core`, the command/DTO namespace(s), and `{RootNamespace}.Api.{EntityPlural}.Requests` when request records are used.
- Authorization: no `[Authorize]` attribute needed (fallback policy protects everything); `[AllowAnonymous]` to opt out; `[Authorize(Policy = "PolicyName")]` for elevated permissions.

---

## Request models vs Application DTOs

| Direction | Type                    | Layer       | Rule                                                                                                                                                                                                     |
| --------- | ----------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Response  | `{Entity}Dto`           | Application | Returned as-is. No Api-layer response type, no second mapping. A dedicated HTTP response contract may be added later only if Api and Application shapes must diverge.                                    |
| Request   | `Create{Entity}Request` | Api only    | Mirrors `Create{Entity}Command` parameters exactly — same names, types, order. Fields from `entity.layout.create`.                                                                                       |
| Request   | `Update{Entity}Request` | Api only    | Mirrors `Update{Entity}Command` parameters exactly **excluding `Id`**. Fields = `entity.layout.edit` entries marked `editable` (or all `entity.fields` in declaration order if `layout.edit` is absent). |

- Commands are never exposed directly as HTTP bodies; request records are thin wrappers.
- Request records are never referenced from the Application project.
- Optional (nullable) fields stay nullable in request records.
- System fields (from `system-fields.yaml`, e.g. `id`) and any field with `defaultValue` or `computedValue` are never request body parameters.
- Commands: `Create{Entity}Command(fields...)`; `Update{Entity}Command(Guid Id, editable fields...)`; `Find{Entity}Command(Guid Id)`; `Delete{Entity}Command(Guid Id)`; List command parameterless.

```csharp
namespace {RootNamespace}.Api.{EntityPlural}.Requests;

public record Create{Entity}Request(
    {Field1Type} {Field1Name},
    {Field2Type} {Field2Name}
    // … one parameter per field in layout.create, matching the command's parameter types and names
);

public record Update{Entity}Request(
    {Field1Type} {Field1Name},
    {Field2Type} {Field2Name}
    // … one parameter per editable field, matching the Update command's parameters (excluding Id)
);
```

---

## Action ordering inside the controller

Mirror conventional REST documentation order:

1. Collection-level: `GET /` (List), `POST /` (Create)
2. Item-level: `GET /{id}` (Find), `PUT /{id}` (Update)
3. `DELETE /{id}` (Delete) last

---

## Canonical controller code

### List (new controller)

```csharp
using Microsoft.AspNetCore.Mvc;

using <RootNamespace>.Application.CommandHandling.Core;
using <DtoNamespace>;

namespace <RootNamespace>.Api.<EntityPlural>.Controllers;

[ApiController]
[Route("api/[controller]")]
public class <EntityPlural>Controller(ICommandHandler<<ListCommand>, <ListResult>> listHandler)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<<Entity>Dto>>> List()
    {
        var result = await listHandler.Handle(new <ListCommand>());

        return Ok(result.<ItemsProperty>);
    }
}
```

(The List source uses `api/[controller]`; all other sources use `api/<module-name>` — see [conflicts](#gaps-and-source-conflicts).)

### Create (new controller)

```csharp
using Microsoft.AspNetCore.Mvc;

using <RootNamespace>.Application.CommandHandling.Core;
using <CommandNamespace>;
using <RootNamespace>.Api.<EntityPlural>.Requests;

namespace <RootNamespace>.Api.<EntityPlural>.Controllers;

[ApiController]
[Route("api/<entities>")]
public class <EntityPlural>Controller(ICommandHandler<<CreateCommand>, <CreateResult>> createHandler)
    : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult> Create([FromBody] Create<Entity>Request request)
    {
        var result = await createHandler.Handle(new <CreateCommand>(
            request.<Field1Name>,
            request.<Field2Name>
            // … one argument per field, in order
        ));

        return Created($"{result.<EntityIdProperty>}", null);
    }
}
```

### Find action

```csharp
[HttpGet("{id:guid}")]
public async Task<ActionResult<<Entity>Dto>> Find(Guid id)
{
    var result = await findHandler.Handle(new <FindCommand>(id));

    return Ok(result.<ItemProperty>);
}
```

### Find + Update (asset template `Controller.cs.template`)

```csharp
using Microsoft.AspNetCore.Mvc;

using <RootNamespace>.Application.CommandHandling.Core;
using <DtoNamespace>;
using <UpdateCommandNamespace>;
using <RootNamespace>.Api.<EntityPlural>.Requests;

namespace <RootNamespace>.Api.<EntityPlural>.Controllers;

[ApiController]
[Route("api/<module-name>")]
public class <EntityPlural>Controller(
    ICommandHandler<<FindCommand>, <FindResult>> findHandler,
    ICommandHandler<<UpdateCommand>, <UpdateResult>> updateHandler)
    : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<<Entity>Dto>> Find(Guid id)
    {
        var result = await findHandler.Handle(new <FindCommand>(id));

        return Ok(result.<ItemProperty>);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<<Entity>Dto>> Update(Guid id, [FromBody] Update<Entity>Request request)
    {
        var result = await updateHandler.Handle(new <UpdateCommand>(
            id,
            request.<Field1Name>,
            request.<Field2Name>
            // … one argument per editable field, in order
        ));

        return Ok(result.<UpdateItemProperty>);
    }
}
```

### Delete (asset template `Controller.cs.template`)

```csharp
using Microsoft.AspNetCore.Mvc;

using <RootNamespace>.Application.CommandHandling.Core;
using <DeleteCommandNamespace>;

namespace <RootNamespace>.Api.<EntityPlural>.Controllers;

[ApiController]
[Route("api/<module-name>")]
public class <EntityPlural>Controller(
    ICommandHandler<<DeleteCommand>, <DeleteResult>> deleteHandler)
    : ControllerBase
{
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await deleteHandler.Handle(new <DeleteCommand>(id));

        return NoContent();
    }
}
```

Placeholder glossary: `<ItemsProperty>` = List result collection (expected `Items`); `<ItemProperty>` = Find result item (expected `Item`); `<UpdateItemProperty>` = Update result item (expected `Item`); `<EntityIdProperty>` = Create result ID (expected `{Entity}Id`).

---

## Error handling overview

Full-stack error handling has three parts:

| Layer       | Component                                                                                                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application | `LoggingBehavior` registered as the **first** pipeline behavior — logs and rethrows unhandled exceptions from command handlers.                                               |
| Domain      | `DomainErrors`, `DomainException`, `NotFoundException`, `ConflictException`, `ValidationException`.                                                                           |
| Application | `ValidationExtensions.ToValidationException()` (FluentValidation bridge).                                                                                                     |
| Api         | `ValidationExceptionHandler`, `DomainExceptionHandler` (`IExceptionHandler`, RFC 9457 `ProblemDetails` / `ValidationProblemDetails`).                                         |
| Frontend    | `ApiError` + `toApiError` (`src/core/errors/`), `ErrorToastProvider` (MUI Snackbar toasts), `QueryProvider` (surfaces React Query errors as toasts), i18n `errors.generic.*`. |

Rules:

- Target .NET 8+ `IExceptionHandler` only. `IExceptionFilter`-based APIs and MediatR projects are not supported.
- Unknown (non-domain) exceptions fall through to ASP.NET Core's built-in handler → `500`. No explicit 500 handler.
- 401/403 come from authentication/authorization middleware before any action runs; they never reach `IExceptionHandler` — no entries needed.

---

## DomainErrors and error code format

`DomainErrors` (Domain project root, `DomainErrors.cs`) is the **single source of truth** for error code strings. No magic strings anywhere else in the backend.

```csharp
namespace {RootNamespace}.Domain;

public static class DomainErrors
{
    public static class Generic
    {
        public const string Unexpected       = "errors.generic.unexpected";
        public const string NotFound         = "errors.generic.notFound";
        public const string Conflict         = "errors.generic.conflict";
        public const string ValidationFailed = "errors.generic.validationFailed";
    }
}
```

| Constant                                | Value                             | HTTP | Frontend i18n key (`common` ns)          |
| --------------------------------------- | --------------------------------- | ---- | ---------------------------------------- |
| `DomainErrors.Generic.Unexpected`       | `errors.generic.unexpected`       | 500  | `common:errors.generic.unexpected`       |
| `DomainErrors.Generic.NotFound`         | `errors.generic.notFound`         | 404  | `common:errors.generic.notFound`         |
| `DomainErrors.Generic.Conflict`         | `errors.generic.conflict`         | 409  | `common:errors.generic.conflict`         |
| `DomainErrors.Generic.ValidationFailed` | `errors.generic.validationFailed` | 422  | `common:errors.generic.validationFailed` |

Format: dot-separated, lowercase segments (camelCase names), `{domain}.{category}.{name}`:

- `errors` — top-level domain for all application errors.
- `generic` — category for errors shared across all features.
- Feature categories match the aggregate root name (`user`, `order`, `payment`).

Feature-specific codes go in a **nested class inside `DomainErrors`** — never standalone error-code classes. Use `Generic` only for truly cross-feature, reusable errors.

```csharp
public static class User
{
    public const string EmailAlreadyInUse = "errors.user.emailAlreadyInUse";
    public const string NotFound          = "errors.user.notFound";
}

throw new NotFoundException(DomainErrors.User.NotFound, $"User {id} not found.");
throw new ConflictException(DomainErrors.User.EmailAlreadyInUse, "Email already in use.");
```

The frontend consumes codes as i18n keys (in `common` or a feature namespace). Never change an existing constant value without a coordinated frontend update.

---

## Domain exception hierarchy

One file per type under `{DomainProject}/Exceptions/`, namespace `{RootNamespace}.Domain.Exceptions`, primary-constructor style.

```csharp
namespace {RootNamespace}.Domain.Exceptions;

public abstract class DomainException(string errorCode, string message) : Exception(message)
{
    public string ErrorCode { get; } = errorCode;
}
```

```csharp
namespace {RootNamespace}.Domain.Exceptions;

public class NotFoundException(string errorCode, string message)
    : DomainException(errorCode, message);
```

```csharp
namespace {RootNamespace}.Domain.Exceptions;

public class ConflictException(string errorCode, string message)
    : DomainException(errorCode, message);
```

```csharp
using {RootNamespace}.Domain;

namespace {RootNamespace}.Domain.Exceptions;

public class ValidationException(IDictionary<string, string[]> errors)
    : DomainException(DomainErrors.Generic.ValidationFailed, "One or more validation errors occurred.")
{
    public IDictionary<string, string[]> Errors { get; } = errors;
}
```

| Type                  | Constructor                                   | HTTP                                  | Error code                                                                                                |
| --------------------- | --------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `DomainException`     | abstract `(string errorCode, string message)` | 422 (catch-all for unmapped subtypes) | caller-supplied                                                                                           |
| `NotFoundException`   | `(string errorCode, string message)`          | 404                                   | caller-supplied (e.g. `DomainErrors.Generic.NotFound`, `DomainErrors.User.NotFound`)                      |
| `ConflictException`   | `(string errorCode, string message)`          | 409                                   | caller-supplied                                                                                           |
| `ValidationException` | `(IDictionary<string, string[]> errors)`      | 422                                   | always `DomainErrors.Generic.ValidationFailed`; `Errors` keys = property names, values = i18n error codes |

Rules for new subtypes:

- Class name ends in `Exception`.
- Constructor: `(string message)` when the error code is always the same constant, or `(string errorCode, string message)` when callers supply a feature-specific variant.
- Status is mapped by **type**, not by error code.

---

## Exception handlers (IExceptionHandler)

`{ApiProject}/ExceptionHandlers/ValidationExceptionHandler.cs` — handles only `ValidationException`; returns `ValidationProblemDetails` with field-keyed errors; returns `false` otherwise.

```csharp
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using {RootNamespace}.Domain.Exceptions;

namespace {RootNamespace}.Api.ExceptionHandlers;

public class ValidationExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is not ValidationException validationException)
        {
            return false;
        }

        var problemDetails = new ValidationProblemDetails(validationException.Errors)
        {
            Status = StatusCodes.Status422UnprocessableEntity,
        };

        httpContext.Response.StatusCode = StatusCodes.Status422UnprocessableEntity;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
        return true;
    }
}
```

`{ApiProject}/ExceptionHandlers/DomainExceptionHandler.cs` — handles any `DomainException`; maps type → status via a switch expression with a `_ => 422` catch-all; returns `false` for non-domain exceptions (→ built-in 500).

```csharp
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using {RootNamespace}.Domain.Exceptions;

namespace {RootNamespace}.Api.ExceptionHandlers;

public class DomainExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is not DomainException domainException)
        {
            return false;
        }

        var statusCode = domainException switch
        {
            NotFoundException  => StatusCodes.Status404NotFound,
            ConflictException  => StatusCodes.Status409Conflict,
            _                  => StatusCodes.Status422UnprocessableEntity,
        };

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Extensions = { ["errorCode"] = domainException.ErrorCode },
        };

        httpContext.Response.StatusCode = statusCode;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
        return true;
    }
}
```

Response shape: `ProblemDetails.Extensions` items serialise as **top-level** JSON properties, so the body contains `"errorCode": "..."` alongside `"status"`, `"title"`, etc. This matches the `{ errorCode: "..." }` shape expected by the frontend `toApiError` helper. Validation responses carry `errors: { "<PropertyName>": ["<error code>", ...] }`.

---

## Status code mapping

| Source                                        | Handler                                       | Status    | Body                                                       |
| --------------------------------------------- | --------------------------------------------- | --------- | ---------------------------------------------------------- |
| `ValidationException`                         | `ValidationExceptionHandler`                  | 422       | `ValidationProblemDetails` (field-keyed error code arrays) |
| `NotFoundException`                           | `DomainExceptionHandler`                      | 404       | `ProblemDetails` + `errorCode`                             |
| `ConflictException`                           | `DomainExceptionHandler`                      | 409       | `ProblemDetails` + `errorCode`                             |
| Any other `DomainException` subtype           | `DomainExceptionHandler` (`_`)                | 422       | `ProblemDetails` + `errorCode`                             |
| New subtype needing another status (e.g. 402) | `DomainExceptionHandler` (new arm before `_`) | as mapped | `ProblemDetails` + `errorCode`                             |
| Non-domain exception                          | built-in ASP.NET Core                         | 500       | default                                                    |
| Malformed `{id:guid}`                         | routing                                       | 400       | —                                                          |
| Missing/invalid bearer token / forbidden      | auth middleware                               | 401 / 403 | —                                                          |

---

## Registration and middleware order

`{ApiProject}/ConfigureServices.cs` — inside `RegisterApiServices`, register problem details and both handlers **before** `AddControllers()`; `ValidationExceptionHandler` **first** (handlers run in registration order and stop at the first returning `true`; since `ValidationException` is also a `DomainException`, reversing the order would produce a flat `ProblemDetails` without field errors).

```csharp
using {RootNamespace}.Api.ExceptionHandlers;

// ...

public static IServiceCollection RegisterApiServices(this IServiceCollection services, IConfiguration configuration)
{
    services.ConfigureCors(configuration);
    services.AddProblemDetails();
    services.AddExceptionHandler<ValidationExceptionHandler>();
    services.AddExceptionHandler<DomainExceptionHandler>();
    services.AddControllers();
    services.AddHealthChecks();
    services.AddHttpContextAccessor();

    return services;
}
```

`Program.cs` — `app.UseExceptionHandler()` immediately before `app.UseHttpsRedirection()`:

```csharp
app.UseExceptionHandler();
app.UseHttpsRedirection();
```

---

## FluentValidation integration

- The Application project references `FluentValidation` (latest stable at scaffold time; reference example `12.0.0`).
- `{ApplicationProject}/Validation/ValidationExtensions.cs`, namespace `{RootNamespace}.Application.Validation`:

```csharp
using FluentValidation.Results;

using {RootNamespace}.Domain.Exceptions;

namespace {RootNamespace}.Application.Validation;

public static class ValidationExtensions
{
    public static ValidationException ToValidationException(this IList<ValidationFailure> failures)
    {
        var errors = failures
            .GroupBy(f => f.PropertyName)
            .ToDictionary(
                g => g.Key,
                g => g.Select(f => f.ErrorCode).ToArray());

        return new ValidationException(errors);
    }
}
```

- Validators derive from `AbstractValidator<TCommand>`, named `{CommandName}Validator`; every rule sets `.WithErrorCode("errors.{feature}.{name}")` (same `{domain}.{category}.{name}` convention) — the code is the frontend i18n key.

```csharp
using FluentValidation;

using {RootNamespace}.Application.Validation;

namespace {RootNamespace}.Application.Features.{Feature}.Commands;

public class {CommandName}Validator : AbstractValidator<{CommandName}>
{
    public {CommandName}Validator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .WithErrorCode("errors.{feature}.emailRequired")
            .EmailAddress()
            .WithErrorCode("errors.{feature}.emailInvalid");
    }
}
```

- In the command handler (or a validation pipeline behavior):

```csharp
var result = await validator.ValidateAsync(command, cancellationToken);
if (!result.IsValid)
{
    throw result.Errors.ToValidationException();
}
```

- Add every `.WithErrorCode()` key to the frontend `public/locales/{lang}/common.json`.

---

## Exception handler tests

File: `{TestProject}/ExceptionHandlers/ExceptionHandlerTests.cs`. Stack: **xUnit**, **AwesomeAssertions**, `DefaultHttpContext` — no mocking library (handlers are pure functions over `HttpContext`). `Response.Body` is set to a `MemoryStream` so `WriteAsJsonAsync` does not throw. Test names: `{Handler}_{Scenario}_{Expected}`.

```csharp
using AwesomeAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using {RootNamespace}.Api.ExceptionHandlers;
using {RootNamespace}.Domain;
using {RootNamespace}.Domain.Exceptions;

namespace {RootNamespace}.Tests.ExceptionHandlers;

public class ExceptionHandlerTests
{
    // ── ValidationExceptionHandler ──────────────────────────────────────────

    [Fact]
    public async Task ValidationExceptionHandler_ValidationException_Returns422WithFieldErrors()
    {
        var errors = new Dictionary<string, string[]>
        {
            { "Name", ["errors.generic.validationFailed"] },
        };
        var exception = new ValidationException(errors);
        var context = CreateHttpContext();
        var handler = new ValidationExceptionHandler();

        var handled = await handler.TryHandleAsync(context, exception, CancellationToken.None);

        handled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status422UnprocessableEntity);
    }

    [Fact]
    public async Task ValidationExceptionHandler_NonValidationException_ReturnsFalse()
    {
        var exception = new InvalidOperationException("not a domain error");
        var context = CreateHttpContext();
        var handler = new ValidationExceptionHandler();

        var handled = await handler.TryHandleAsync(context, exception, CancellationToken.None);

        handled.Should().BeFalse();
    }

    // ── DomainExceptionHandler ──────────────────────────────────────────────

    [Fact]
    public async Task DomainExceptionHandler_NotFoundException_Returns404WithErrorCode()
    {
        var exception = new NotFoundException(DomainErrors.Generic.NotFound, "not found");
        var context = CreateHttpContext();
        var handler = new DomainExceptionHandler();

        var handled = await handler.TryHandleAsync(context, exception, CancellationToken.None);

        handled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task DomainExceptionHandler_ConflictException_Returns409WithErrorCode()
    {
        var exception = new ConflictException(DomainErrors.Generic.Conflict, "conflict");
        var context = CreateHttpContext();
        var handler = new DomainExceptionHandler();

        var handled = await handler.TryHandleAsync(context, exception, CancellationToken.None);

        handled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task DomainExceptionHandler_BaseDomainException_Returns422WithCustomErrorCode()
    {
        const string customCode = "errors.custom.code";
        var exception = new TestDomainException(customCode, "custom error");
        var context = CreateHttpContext();
        var handler = new DomainExceptionHandler();

        var handled = await handler.TryHandleAsync(context, exception, CancellationToken.None);

        handled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status422UnprocessableEntity);
    }

    [Fact]
    public async Task DomainExceptionHandler_NonDomainException_ReturnsFalse()
    {
        var exception = new InvalidOperationException("not a domain error");
        var context = CreateHttpContext();
        var handler = new DomainExceptionHandler();

        var handled = await handler.TryHandleAsync(context, exception, CancellationToken.None);

        handled.Should().BeFalse();
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private static DefaultHttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    /// <summary>Concrete stand-in for an unknown DomainException subtype.</summary>
    private sealed class TestDomainException(string errorCode, string message)
        : DomainException(errorCode, message);
}
```

`TestDomainException` exercises the `_ => 422` catch-all arm.

---

## Adding a new exception type end-to-end

Inputs that define a new error type:

| Input                       | Rule                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| Exception class name        | Ends in `Exception` (e.g. `PaymentRequiredException`).                                                  |
| HTTP status code            | e.g. `402`. 404/409 already mapped; 422 needs no handler change.                                        |
| Error code string           | `{domain}.{category}.{name}` (e.g. `errors.payment.required`); **identical** in backend and frontend.   |
| `DomainErrors` nested class | Feature class (e.g. `Payment`) preferred; `Generic` only for truly cross-feature errors.                |
| Constructor signature       | `(string message)` or `(string errorCode, string message)`.                                             |
| English toast message       | For `public/locales/en/common.json`.                                                                    |
| French toast message        | For `public/locales/fr/common.json`; if not provided use `"TODO: French translation for <error-code>"`. |

Backend:

1. Add the constant to `DomainErrors` — to the existing nested class, or create a new nested class following the `Generic` pattern.
2. Create `{DomainProject}/Exceptions/{ExceptionClassName}.cs` using the primary-constructor pattern deriving from `DomainException`.
3. If the status is not 422, add an arm to the `DomainExceptionHandler` switch **before** `_ =>`:

   ```csharp
   {NewExceptionClass} => StatusCodes.Status{NNN}{StatusCodeName},
   ```

4. `dotnet build` must pass.

Frontend error code registration contract:

- Prerequisite: `ErrorToastProvider` and `QueryProvider` are set up.
- Add the error code key to the i18n type definitions (`src/i18n/config.ts`, where `errors.generic.*` types live).
- Add translations to both `public/locales/en/common.json` and `public/locales/fr/common.json`.
- The frontend reads `errorCode` from the ProblemDetails body and resolves it as an i18n key (`common:` namespace) to display a toast; frontend build must pass.

---

## Entra ID JWT bearer authentication

Scope: Microsoft Entra ID JWT Bearer validation via `Microsoft.Identity.Web`. Not covered: role policies, claims transformation, on-behalf-of flows, user provisioning, daemon/service-to-service auth.

### Project YAML source

```yaml
auth:
  entra:
    tenant-id: "00000000-0000-0000-0000-000000000000"
    client-id:
      dev: "00000000-0000-0000-0000-000000000000"
      uat: "00000000-0000-0000-0000-000000000000"
      prod: "00000000-0000-0000-0000-000000000000"
```

- `tenant-id` is mandatory and must be real (otherwise stop: "Add a real `tenant-id` to the `auth.entra` block in your project YAML, then retry.").
- `client-id` is optional at scaffold time. Resolution order: (1) `auth.entra.client-id.*` in the project YAML; (2) `entra-app-registrations.json` (generated by the app-registration flow) — never write those IDs back into `input/project.yaml`.
- If client IDs are missing, continue with placeholders: `<your-dev-client-id>` (for `appsettings.json`, `appsettings.Development.json`, `appsettings.Dev.json`), `<your-uat-client-id>` (`appsettings.Uat.json`), `<your-prod-client-id>` (`appsettings.Prod.json`). Never invent fake GUIDs in `project.yaml`.

### Package

```bash
dotnet add {ProjectName}.Api/{ProjectName}.Api.csproj package Microsoft.Identity.Web
```

### Configuration (`AzureAd` section)

`appsettings.json`:

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "<tenant-id-from-yaml>",
    "ClientId": "<dev-client-id-from-yaml>"
  }
}
```

Every `appsettings.{env}.json` override:

```json
{
  "AzureAd": {
    "TenantId": "<your-{env}-tenant-id>",
    "ClientId": "<client-id-for-{env}-from-yaml>"
  }
}
```

| Key        | Value                                                                                                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Instance` | `https://login.microsoftonline.com/` (base file)                                                                                                                            |
| `TenantId` | Entra tenant ID                                                                                                                                                             |
| `ClientId` | API app registration client ID per environment (`Development`/`Dev` → dev; `Uat` → uat; `Prod` → prod)                                                                      |
| `Audience` | **Never set.** When omitted, Microsoft.Identity.Web accepts both the bare client ID GUID and `api://<client-id>`, so tokens work with `requestedAccessTokenVersion` 1 or 2. |

### Program.cs wiring

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.Identity.Web;

// After existing builder.Services registrations:
builder.Services.AddMicrosoftIdentityWebApiAuthentication(builder.Configuration);
builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build());

// After app.UseRouting() / before app.MapControllers():
app.UseAuthentication();
app.UseAuthorization();
```

- Middleware order: `UseAuthentication` → `UseAuthorization` → `MapControllers`.
- The **fallback policy** (`RequireAuthenticatedUser`) protects every endpoint without an authorization attribute — do **not** add `[Authorize]` to controllers. Use `[AllowAnonymous]` for public endpoints and `[Authorize(Policy = "PolicyName")]` for elevated permissions.
- The health check is mapped with `MapHealthChecks` (not a controller action) and stays public without annotation.

### `/api/me` endpoint

```csharp
using Microsoft.AspNetCore.Mvc;

namespace {ProjectName}.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MeController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok();
}
```

- Stable surface the frontend calls first to verify authorization: `401 Unauthorized` without token, `200 OK` with **empty body** with a valid token. May later grow into a current-user response without changing the route.

### CORS for local dev

Development `AllowedOrigins` must use `http://localhost:5173` (Vite dev server is plain HTTP, not `https://`):

```json
{
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173"]
  }
}
```

### Validation / test conventions

- `dotnet build` and `dotnet test` must pass.
- Verify `/api/me` returns `401` without a token and `200 OK` (no payload) with a valid Entra bearer token.

---

## Authenticated user service

Purpose: let handlers/services know **who** is calling, to stamp identity system fields (any field driven by an `authenticatedUser` value in `system-fields.yaml`). Interface in **Application** (consumers depend only on the abstraction); implementation in **Api** (reads the current request's claims).

```csharp
namespace {RootNamespace}.Application.Authentication;

public interface IAuthenticatedUserService
{
    /// <summary>
    /// Returns the identity of the authenticated caller (e.g. UPN / email), used to stamp audit fields.
    /// </summary>
    string GetAuthenticatedUser();
}
```

```csharp
using System.Security.Claims;
using {RootNamespace}.Application.Authentication;

namespace {RootNamespace}.Api.Authentication;

public class AuthenticatedUserService(IHttpContextAccessor httpContextAccessor) : IAuthenticatedUserService
{
    public string GetAuthenticatedUser()
    {
        var user = httpContextAccessor.HttpContext?.User;

        return user?.FindFirstValue(ClaimTypes.Upn)
            ?? user?.FindFirstValue("preferred_username")
            ?? user?.FindFirstValue(ClaimTypes.Email)
            ?? user?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? "system";
    }
}
```

- Claim resolution order: `ClaimTypes.Upn` → `preferred_username` → `ClaimTypes.Email` → `ClaimTypes.NameIdentifier` → `"system"`.
- The `"system"` fallback covers unauthenticated/background calls so audit fields are never null.
- Registration in `RegisterApiServices()` (`{ProjectName}.Api/ConfigureServices.cs`), with `using {RootNamespace}.Api.Authentication;` (`AddHttpContextAccessor()` is already registered):

```csharp
        services.AddScoped<IAuthenticatedUserService, AuthenticatedUserService>();
```

---

## Gaps and source conflicts

Conflicts (both variants documented above):

- **Controller route attribute:** `dotnet-list-endpoint-launchpad` uses `[Route("api/[controller]")]` (resolves to `api/{EntityPlural}`, matched case-insensitively), while `dotnet-find-endpoint-launchpad`, `dotnet-update-endpoint-launchpad` and `dotnet-delete-endpoint-launchpad` use `[Route("api/<module-name>")]` and `dotnet-create-endpoint-launchpad` uses `[Route("api/<entities>")]` (same value as `module-name`). Its own design decisions still state the route is `GET /api/{module-name}`. The explicit `api/{module-name}` form is the majority rule and the only one guaranteed to match the YAML route segment.
- **Create location expression:** code uses `Created($"{result.<EntityIdProperty>}", null)`; the checklist in `dotnet-create-endpoint-launchpad` writes `Created(result.<EntityIdProperty>.ToString(), null)`. Semantically equivalent.
- **Exception filter wording:** List/Create endpoint sources mention "global exception filter / `IExceptionHandler`", whereas `dotnet-api-exception-handler-launchpad` states `IExceptionFilter`-based APIs are not supported; `error-handling-launchpad` add-error-type intro also says "wires it into the API filter". The implemented mechanism is `IExceptionHandler`.
- **New-exception unit test:** `error-handling-launchpad` completion summary says the new exception is "covered by a unit test" and "mapped ... in `DomainExceptionHandler`", but the `dotnet-api-exception-handler-launchpad` add-exception flow creates no test and adds a switch arm only for non-422 statuses.
- **`MeController` placement:** `dotnet-entra-auth-launchpad` uses a flat `{ProjectName}.Api/Controllers/` folder with `[Route("api/[controller]")]` and namespace `{ProjectName}.Api.Controllers`, unlike module controllers (`{EntityPlural}/Controllers/`, `{RootNamespace}.Api.{EntityPlural}.Controllers`). It also mixes `{ProjectName}` and `{RootNamespace}` placeholders.
- **Auth registration position:** `dotnet-entra-auth-launchpad` prose says add authentication "before the existing service registrations" while its code comment says "After existing builder.Services registrations".
- **Per-env `TenantId`:** env overrides use placeholder `<your-{env}-tenant-id>` while the base file uses the YAML `tenant-id` (the YAML defines a single tenant).
- **Validator namespace:** FluentValidation example uses `{RootNamespace}.Application.Features.{Feature}.Commands`, whereas module commands live under `Application/{EntityPlural}/` (namespace `{RootNamespace}.Application.{EntityPlural}`).
- **Test namespace:** tests use `{RootNamespace}.Tests.ExceptionHandlers` while the example test project is `tests/Acme.App.UnitTests/`.
- **Frontend build command:** orchestration sources state `npm run build`; repository preference elsewhere is pnpm.

Gaps (not specified by sources):

- No `CancellationToken` parameter on controller actions; handlers are called as `Handle(command)` without a token. Only `IExceptionHandler.TryHandleAsync` and validator calls use a `CancellationToken`.
- No OpenAPI/Swagger metadata conventions (`[ProducesResponseType]`, `.http` files, etc.) for module controllers.
- No auth integration-test conventions (only manual 401/200 verification of `/api/me`).
- No explicit `DomainErrors.Generic.Unexpected` producer on the backend (500 comes from the built-in handler with no `errorCode`).

---

## Sources

- `dotnet-list-endpoint-launchpad`
- `dotnet-find-endpoint-launchpad`
- `dotnet-create-endpoint-launchpad`
- `dotnet-update-endpoint-launchpad`
- `dotnet-delete-endpoint-launchpad`
- `dotnet-api-exception-handler-launchpad`
- `error-handling-launchpad`
- `dotnet-entra-auth-launchpad`

Extracted from NexusInnovation/nexus-plugin-marketplace plugins/launchpad on 2026-11-24.
