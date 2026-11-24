# Backend Data Access Standards

Standards for the backend data access layer (Dapper + DapperExtensions + RepoDb, Repository and Unit of Work, soft delete) and the SDK-style SQL Database Project (`Microsoft.Build.Sql` `.sqlproj`) that defines the SQL Server schema.

## Contents

- [Stack and packages](#stack-and-packages)
- [Project placement and namespaces](#project-placement-and-namespaces)
- [Input model used for generation](#input-model-used-for-generation)
- [SQL and C# type mapping](#sql-and-c-type-mapping)
- [BaseEntity and system fields](#baseentity-and-system-fields)
- [Soft delete](#soft-delete)
- [Auditing (defaultValue and computedValue)](#auditing-defaultvalue-and-computedvalue)
- [IRepository contract](#irepository-contract)
- [DapperConnectionFactory](#dapperconnectionfactory)
- [DapperRepository implementation](#dapperrepository-implementation)
- [Unit of Work](#unit-of-work)
- [Typed entity repositories](#typed-entity-repositories)
- [Entity classes](#entity-classes)
- [DI registration](#di-registration)
- [Connection strings and secrets](#connection-strings-and-secrets)
- [Program.cs wiring](#programcs-wiring)
- [SQL Server in Docker for local development](#sql-server-in-docker-for-local-development)
- [Infrastructure registration tests](#infrastructure-registration-tests)
- [SQL Database Project](#sql-database-project)
- [Object naming conventions](#object-naming-conventions)
- [Table scripts generated from module YAML](#table-scripts-generated-from-module-yaml)
- [Generic SQL object templates](#generic-sql-object-templates)
- [Pre- and post-deployment scripts](#pre--and-post-deployment-scripts)
- [Build and deploy (dacpac, sqlpackage)](#build-and-deploy-dacpac-sqlpackage)
- [Best practices and invariants](#best-practices-and-invariants)
- [Known conflicts and gaps](#known-conflicts-and-gaps)
- [Sources](#sources)

---

## Stack and packages

| Concern                | Choice                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| ORM                    | Dapper (micro-ORM) — **not** Entity Framework                                                           |
| Conventions-based CRUD | DapperExtensions for `GetByIdAsync`, `GetAllAsync`, `InsertAsync`                                       |
| Update                 | RepoDb, **scoped to `UpdateAsync` only**                                                                |
| Delete                 | Soft delete implemented on top of `UpdateAsync` (no physical `DELETE`)                                  |
| Patterns               | Generic Repository + Unit of Work, clean architecture (Api, Application, Domain, Infrastructure)        |
| Database               | SQL Server (local: Docker, SQL Server 2022); schema owned by an SDK-style SQL Database Project (dacpac) |

NuGet packages added to the **Infrastructure** project with `dotnet add package` (no version pinning — latest stable, except where noted). The **Domain** project needs no additional package.

| Package                                           | Purpose                                                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `Dapper`                                          | Micro-ORM for SQL mapping                                                               |
| `DapperExtensions`                                | Conventions-based CRUD for Get/GetAll/Insert                                            |
| `RepoDb.SqlServer`                                | Conventions-based CRUD for `UpdateAsync` only (replaces DapperExtensions' buggy Update) |
| `Microsoft.Data.SqlClient`                        | SQL Server connection driver                                                            |
| `Microsoft.Extensions.Configuration.Abstractions` | `IConfiguration` for reading connection strings                                         |

```powershell
dotnet add {Name}.Infrastructure/{Name}.Infrastructure.csproj package Dapper
dotnet add {Name}.Infrastructure/{Name}.Infrastructure.csproj package DapperExtensions
dotnet add {Name}.Infrastructure/{Name}.Infrastructure.csproj package RepoDb.SqlServer
dotnet add {Name}.Infrastructure/{Name}.Infrastructure.csproj package Microsoft.Data.SqlClient
dotnet add {Name}.Infrastructure/{Name}.Infrastructure.csproj package Microsoft.Extensions.Configuration.Abstractions
```

### Why both DapperExtensions and RepoDb

- `DapperExtensions.UpdateAsync(entity)` has a long-standing unresolved upstream bug: a shared column-alias cache can corrupt generated UPDATE parameter names (`Must declare the scalar variable '@u_5'` — tmsmith/Dapper-Extensions#306). DapperExtensions is unmaintained (no release since ~2021).
- RepoDb is actively maintained and is the chosen long-term replacement. It is introduced **for `UpdateAsync` only** to limit risk; migrating the other methods and removing DapperExtensions is a deliberate future follow-up.

**Version rule:** `RepoDb.SqlServer` 1.14.0+ requires `Microsoft.Data.SqlClient >= 6.1.1`. If restore fails with `NU1605: Detected package downgrade`, bump (or pin) `Microsoft.Data.SqlClient` so the final reference satisfies both packages.

---

## Project placement and namespaces

| Type                      | Namespace                             | Location                                                 |
| ------------------------- | ------------------------------------- | -------------------------------------------------------- |
| `BaseEntity`              | `{RootNamespace}.Domain.Entities`     | `{Name}.Domain/Entities/BaseEntity.cs`                   |
| `{EntityName}` (entity)   | `{RootNamespace}.Domain.Entities`     | `{Name}.Domain/Entities/{EntityName}.cs`                 |
| `IRepository<T>`          | `{RootNamespace}.Domain.Repositories` | `{Name}.Domain/Repositories/IRepository.cs`              |
| `IUnitOfWork`             | `{RootNamespace}.Domain.Repositories` | `{Name}.Domain/Repositories/IUnitOfWork.cs`              |
| `I{EntityName}Repository` | `{RootNamespace}.Domain.Repositories` | `{Name}.Domain/Repositories/I{EntityName}Repository.cs`  |
| `DapperConnectionFactory` | `{RootNamespace}.Infrastructure.Data` | `{Name}.Infrastructure/Data/DapperConnectionFactory.cs`  |
| `DapperRepository<T>`     | `{RootNamespace}.Infrastructure.Data` | `{Name}.Infrastructure/Data/DapperRepository.cs`         |
| `DapperUnitOfWork`        | `{RootNamespace}.Infrastructure.Data` | `{Name}.Infrastructure/Data/DapperUnitOfWork.cs`         |
| `{EntityName}Repository`  | `{RootNamespace}.Infrastructure.Data` | `{Name}.Infrastructure/Data/{EntityName}Repository.cs`   |
| DI registration           | `{RootNamespace}.Infrastructure`      | `{Name}.Infrastructure/ConfigureServices.cs`             |
| SQL Database Project      | n/a                                   | `{SolutionRoot}/{Name}.Database/{Name}.Database.sqlproj` |

- `{RootNamespace}` is never hardcoded — infer it from existing project names / namespaces (e.g. `Acme.App`, `{client}.{project}`).
- The typed repository location has a variant (per-entity plural namespace) — see [Known conflicts and gaps](#known-conflicts-and-gaps).
- `IAuthenticatedUserService` lives in the Application layer (`{RootNamespace}.Application.Authentication`) and is consumed by `DapperRepository<T>`.

---

## Input model used for generation

Data access artefacts are generated from the `input/` folder at repository root.

| File                       | What is read                                                                                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input/project.yaml`       | `name` (root namespace base) and `modules:` (list of module YAML paths)                                                                                         |
| `input/system-fields.yaml` | System fields shared by every entity: each top-level key declares `displayName`, `type`, `control`, `required`, and optionally `defaultValue` / `computedValue` |
| `input/modules/*.yaml`     | One entity per file: entity name, `displayName`, `fields` (`name`, `type`, `required`)                                                                          |

- Only `name`, `type`, `required` (and for system fields `defaultValue`/`computedValue`) drive data access. Presentation metadata (`displayName`, `control`, `choices`, `layout`, `cardDescription`, `icon`) is ignored for SQL / repository generation.
- A module YAML references its system fields via `entity.systemFields` (path resolved relative to the module YAML file). A missing or empty `entity.systemFields` is a failure for table generation.
- System fields are **never** duplicated in the module's own field list, the entity class, or anywhere other than `BaseEntity` and the system columns of each table.
- Field `name` (camelCase) → PascalCase property / column (`firstName` → `FirstName` / `[FirstName]`, `isActive` → `IsActive`, `orderDate` → `OrderDate`).

---

## SQL and C# type mapping

Authoritative cross-stack mapping (summary for data access):

| YAML type  | C# type          | SQL Server type    | Notes                                                       |
| ---------- | ---------------- | ------------------ | ----------------------------------------------------------- |
| `int`      | `int`            | `INT`              |                                                             |
| `decimal`  | `decimal`        | `DECIMAL(18,2)`    | Default — `precision` / `scale` override                    |
| `string`   | `string`         | `NVARCHAR(256)`    | Default — `maxLength` overrides                             |
| `datetime` | `DateTimeOffset` | `DATETIMEOFFSET`   | Timezone-aware                                              |
| `boolean`  | `bool`           | `BIT`              |                                                             |
| `enum`     | `string` (enum)  | `NVARCHAR(50)`     | Stored as text; values from YAML `choices[].value`          |
| `guid`     | `Guid`           | `UNIQUEIDENTIFIER` | Reserved for system-generated fields; not for custom fields |

| YAML `required` | SQL        | C#             |
| --------------- | ---------- | -------------- |
| `true`          | `NOT NULL` | Non-nullable   |
| `false`         | `NULL`     | Nullable (`?`) |

Additional rules from the data access reference:

- Identity-type system fields (holding a username) use `NVARCHAR(256)`.
- Enum fields are stored as text in SQL. The data access reference requires the **entity property to remain `string`** so Dapper reads/writes the raw value; a C# `enum` (e.g. `{EntityName}Status`) may be created for application-logic comparisons only.
- The data access reference carries an older mapping table with different widths — see [Known conflicts and gaps](#known-conflicts-and-gaps).

---

## BaseEntity and system fields

- All persistent entities inherit `BaseEntity` (Domain project).
- `BaseEntity` properties are **generated from `input/system-fields.yaml`**, one per top-level key, in declared order:
  - property **name** = PascalCase of the YAML key; never rename (must match the SQL system column so Dapper maps it);
  - property **type** = YAML `type` mapped via the type-mapping table;
  - `required: false` → nullable type.
- Never hardcode or enumerate the system fields; regenerate `BaseEntity` from the YAML when it changes.
- The soft-delete trio (flag, timestamp, identity) is part of this list.

```csharp
namespace {RootNamespace}.Domain.Entities;

public abstract class BaseEntity
{
    // SYSTEM FIELDS — generated from system-fields.yaml. Do not hardcode this list.
    // Emit one property per top-level key in `input/system-fields.yaml`, in declared order:
    //   - property NAME = PascalCase of the YAML key.
    //   - property TYPE = the key's `type` mapped via the Field Type Mapping table
    //     (`guid` → `Guid`, `datetime` → `DateTimeOffset`, `string` → `string`, `boolean` → `bool`, …).
    //   - `required: false` keys map to a nullable type.
    //   - never rename a field — the names must match the system columns in the generated
    //     SQL tables so Dapper maps them.
    // The soft-delete trio declared in system-fields.yaml is part of this list and is
    // what `DapperRepository<T>.DeleteAsync` stamps — see Soft Delete below.
}
```

---

## Soft delete

Deletion is **always logical**. The generic repository never issues a SQL `DELETE`.

| Rule                      | Detail                                                                                                                                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trio                      | Flag, timestamp and identity fields declared in `system-fields.yaml`. Their PascalCase names are substituted for `{SoftDeleteFlagProperty}`, `{SoftDeleteTimestampProperty}`, `{SoftDeleteIdentityProperty}` — never assume fixed names. |
| Stamping                  | `DeleteAsync(id)` loads the entity, sets flag = `true`, timestamp = `timeProvider.GetUtcNow()`, identity = `authenticatedUserService.GetAuthenticatedUser()`, then calls `UpdateAsync`.                                                  |
| Only place stamped        | The trio's `computedValue` (`true` / `now` / `username`) is applied **only** in `DeleteAsync`. Create and Update command handlers must never assign these fields.                                                                        |
| Missing / already deleted | `DeleteAsync` is a no-op. The caller (e.g. a `Delete{Entity}Command` handler) throws `NotFoundException` when it wants a 404.                                                                                                            |
| Read filtering            | `GetByIdAsync` and `GetAllAsync` exclude soft-deleted rows by default.                                                                                                                                                                   |
| Include deleted           | `GetAllAsync(includingDeleted: true)` returns deleted and non-deleted rows in one call (trash / recycle-bin views).                                                                                                                      |
| Custom queries            | Every custom typed-repository query must filter `WHERE [{SoftDeleteFlagColumn}] = 0`, unless intentionally mirroring `includingDeleted: true`.                                                                                           |
| Dependencies              | `DapperRepository<T>` injects `DapperConnectionFactory`, `IAuthenticatedUserService`, `TimeProvider`; typed repositories forward all three to the base constructor.                                                                      |
| YAML shape                | The soft-delete flag may combine `defaultValue: false` with `computedValue: true` (the only fields allowed to declare both).                                                                                                             |
| SQL default               | The soft-delete flag column carries a SQL DEFAULT (with the `id` column, the only defaults per the data access reference).                                                                                                               |

---

## Auditing (defaultValue and computedValue)

System fields may declare **one** of these generation-metadata properties (not both, except the soft-delete trio):

| Property        | Valid values                       | Behaviour                                              |
| --------------- | ---------------------------------- | ------------------------------------------------------ |
| `defaultValue`  | `now`, `username`, `true`, `false` | Assigned once at creation, never overwritten on update |
| `computedValue` | `now`, `username`, `true`, `false` | Recalculated on every save (create and update)         |

`now` → `datetime` only; `username` → `string` only; `true`/`false` → `boolean` only.

| YAML value       | C# expression                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `now`            | `timeProvider.GetUtcNow()` (inject `TimeProvider`; `TimeProvider.System` registered in DI) |
| `username`       | `authenticatedUserService.GetAuthenticatedUser()` (inject `IAuthenticatedUserService`)     |
| `true` / `false` | Literal boolean                                                                            |

| Property            | Create handler                                | Update handler                                  |
| ------------------- | --------------------------------------------- | ----------------------------------------------- |
| `defaultValue`      | Assign mapped value                           | Do NOT reassign (immutable after creation)      |
| `computedValue`     | Assign mapped value (except soft-delete trio) | Reassign mapped value (except soft-delete trio) |
| Neither (e.g. `id`) | Assign separately (e.g. `Guid.NewGuid()`)     | Not applicable                                  |

Audit values are set by the application layer (C# handlers), not by SQL defaults (see conflicts for the competing table-template comment).

```csharp
// Create handler
var now = timeProvider.GetUtcNow();
var authenticatedUser = authenticatedUserService.GetAuthenticatedUser();

<CreatedTimestampProperty> = now,               // defaultValue: now
<CreatedIdentityProperty> = authenticatedUser,  // defaultValue: username
<UpdatedTimestampProperty> = now,               // computedValue: now
<UpdatedIdentityProperty> = authenticatedUser,  // computedValue: username

// Update handler (only computedValue fields)
<UpdatedTimestampProperty> = timeProvider.GetUtcNow(),                       // computedValue: now
<UpdatedIdentityProperty> = authenticatedUserService.GetAuthenticatedUser(), // computedValue: username
```

---

## IRepository contract

Generic async CRUD contract, Domain project. Five methods; do not modify it when adding entity repositories.

```csharp
using {RootNamespace}.Domain.Entities;

namespace {RootNamespace}.Domain.Repositories;

public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<T>> GetAllAsync(bool includingDeleted = false, CancellationToken cancellationToken = default);

    Task InsertAsync(T entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(T entity, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
```

---

## DapperConnectionFactory

Creates a `SqlConnection` from configuration key `ConnectionStrings:DefaultConnection`; throws if missing. Registered as singleton.

```csharp
using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace {RootNamespace}.Infrastructure.Data;

public class DapperConnectionFactory
{
    private readonly string _connectionString;

    public DapperConnectionFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
    }

    public IDbConnection CreateConnection() => new SqlConnection(_connectionString);
}
```

---

## DapperRepository implementation

| Method         | Implementation                                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| `GetByIdAsync` | DapperExtensions `GetListAsync<T>(new { Id = id, {SoftDeleteFlagProperty} = false })` → `SingleOrDefault()` |
| `GetAllAsync`  | DapperExtensions `GetListAsync<T>()` (including deleted) or filtered on flag = `false`                      |
| `InsertAsync`  | DapperExtensions `InsertAsync(entity)`                                                                      |
| `UpdateAsync`  | RepoDb `RepoDb.DbConnectionExtension.UpdateAsync<T>(connection, entity, cancellationToken: ...)`            |
| `DeleteAsync`  | Soft delete: load, stamp trio, `UpdateAsync`                                                                |

- Each method opens its own connection via `_connectionFactory.CreateConnection()` inside `using`.
- **No `using RepoDb;` in this file.** DapperExtensions and RepoDb both define `InsertAsync`/`UpdateAsync`/`DeleteAsync` extensions on `IDbConnection`; combined with `using DapperExtensions;` an unqualified call is ambiguous (CS0121). Call RepoDb through the fully-qualified static class, which bypasses extension resolution.
- Do not modify this generic class when adding entity repositories.

```csharp
using {RootNamespace}.Application.Authentication;
using {RootNamespace}.Domain.Entities;
using {RootNamespace}.Domain.Repositories;
using DapperExtensions;

namespace {RootNamespace}.Infrastructure.Data;

public class DapperRepository<T> : IRepository<T> where T : BaseEntity
{
    // NOTE: the soft-delete flag/timestamp/identity property names below (and the ones stamped in
    // DeleteAsync) come from the soft-delete trio declared in system-fields.yaml — substitute the
    // actual PascalCase property names from that file; do not assume fixed names.
    private readonly DapperConnectionFactory _connectionFactory;
    private readonly IAuthenticatedUserService _authenticatedUserService;
    private readonly TimeProvider _timeProvider;

    public DapperRepository(
        DapperConnectionFactory connectionFactory,
        IAuthenticatedUserService authenticatedUserService,
        TimeProvider timeProvider)
    {
        _connectionFactory = connectionFactory;
        _authenticatedUserService = authenticatedUserService;
        _timeProvider = timeProvider;
    }

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        using var connection = _connectionFactory.CreateConnection();
        var results = await connection.GetListAsync<T>(new { Id = id, {SoftDeleteFlagProperty} = false });
        return results.SingleOrDefault();
    }

    public async Task<IEnumerable<T>> GetAllAsync(bool includingDeleted = false, CancellationToken cancellationToken = default)
    {
        using var connection = _connectionFactory.CreateConnection();
        var result = includingDeleted
            ? await connection.GetListAsync<T>()
            : await connection.GetListAsync<T>(new { {SoftDeleteFlagProperty} = false });
        return result;
    }

    public async Task InsertAsync(T entity, CancellationToken cancellationToken = default)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.InsertAsync(entity);
    }

    public async Task UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        using var connection = _connectionFactory.CreateConnection();
        await RepoDb.DbConnectionExtension.UpdateAsync<T>(connection, entity, cancellationToken: cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity is null)
        {
            return;
        }

        entity.{SoftDeleteFlagProperty} = true;
        entity.{SoftDeleteTimestampProperty} = _timeProvider.GetUtcNow();
        entity.{SoftDeleteIdentityProperty} = _authenticatedUserService.GetAuthenticatedUser();

        await UpdateAsync(entity, cancellationToken);
    }
}
```

**Table-name resolution:** tables are singular, `[{EntityName}]`, matching `typeof(T).Name`, which both DapperExtensions and RepoDb resolve by default — no mapping configuration needed. Escape hatch only when a project deliberately diverges (e.g. a pre-existing plural table): configure DapperExtensions (`DapperExtensions.SetMappingAssemblies()` or a `ClassMapper`) **and** RepoDb (`FluentMapper.Entity<{EntityName}>().Table("{ActualTableName}")` or `[Map("{ActualTableName}")]`) so both stay in sync; otherwise `UpdateAsync` targets the wrong table.

---

## Unit of Work

- `IUnitOfWork` (Domain) exposes a shared `IDbConnection` and `IDbTransaction` for operations spanning several repository calls.
- `DapperUnitOfWork` (Infrastructure) creates and opens a connection and begins a transaction **at construction**. Registered **scoped**: one connection + transaction per request.
- Inject `IUnitOfWork` where atomic multi-step work is needed; call `CommitAsync()` on success. Disposing without commit (e.g. on exception) rolls back.

```csharp
using System.Data;

namespace {RootNamespace}.Domain.Repositories;

public interface IUnitOfWork : IDisposable
{
    IDbConnection Connection { get; }
    IDbTransaction Transaction { get; }
    Task CommitAsync(CancellationToken cancellationToken = default);
    void Rollback();
}
```

```csharp
using System.Data;
using Microsoft.Data.SqlClient;
using {RootNamespace}.Domain.Repositories;

namespace {RootNamespace}.Infrastructure.Data;

public sealed class DapperUnitOfWork : IUnitOfWork
{
    private bool _disposed;

    public IDbConnection Connection { get; }
    public IDbTransaction Transaction { get; }

    public DapperUnitOfWork(DapperConnectionFactory connectionFactory)
    {
        Connection = connectionFactory.CreateConnection();
        Connection.Open();
        Transaction = Connection.BeginTransaction();
    }

    public Task CommitAsync(CancellationToken cancellationToken = default)
    {
        Transaction.Commit();
        return Task.CompletedTask;
    }

    public void Rollback() => Transaction.Rollback();

    public void Dispose()
    {
        if (_disposed) return;
        Transaction.Dispose();
        Connection.Dispose();
        _disposed = true;
    }
}
```

---

## Typed entity repositories

- Interface `I{EntityName}Repository : IRepository<{EntityName}>` in Domain; implementation `{EntityName}Repository : DapperRepository<{EntityName}>, I{EntityName}Repository` in Infrastructure.
- Inherit the generic base; never duplicate generic CRUD; never modify `IRepository<T>` / `DapperRepository<T>`.
- Custom queries use `_connectionFactory.CreateConnection()` with Dapper `QueryAsync` / `QueryFirstOrDefaultAsync` / `ExecuteAsync`.
- **All SQL must be parameterized.** Never build SQL with string interpolation or concatenated user input.
- Custom queries always exclude soft-deleted rows.
- Register with `services.AddScoped<I{EntityName}Repository, {EntityName}Repository>();` after (never replacing) the open-generic registration.

Canonical template (Domain/Repositories + Infrastructure/Data):

```csharp
// === Interface (Domain) ===

using {RootNamespace}.Domain.Repositories;

namespace {RootNamespace}.Domain.Repositories;

public interface I{EntityName}Repository : IRepository<{EntityName}>
{
    // Add entity-specific query methods here
}

// === Implementation (Infrastructure) ===

using {RootNamespace}.Application.Authentication;
using {RootNamespace}.Domain.Repositories;
using {RootNamespace}.Infrastructure.Data;
using Dapper;

namespace {RootNamespace}.Infrastructure.Data;

public class {EntityName}Repository : DapperRepository<{EntityName}>, I{EntityName}Repository
{
    public {EntityName}Repository(
        DapperConnectionFactory connectionFactory,
        IAuthenticatedUserService authenticatedUserService,
        TimeProvider timeProvider)
        : base(connectionFactory, authenticatedUserService, timeProvider)
    {
    }

    // Add entity-specific query methods here
    // Use _connectionFactory.CreateConnection() for custom Dapper queries
    // Custom queries must filter out soft-deleted rows: WHERE [{SoftDeleteFlagColumn}] = 0 (column name from system-fields.yaml)
}

// === DI Registration (Infrastructure ConfigureServices) ===

services.AddScoped<I{EntityName}Repository, {EntityName}Repository>();
```

Module-driven variant (per-entity plural namespace, with a custom query example):

```csharp
// === Interface (Domain) ===

namespace {RootNamespace}.Domain.{EntityName}s;

public interface I{EntityName}Repository : IRepository<{EntityName}>
{
    // Add query methods based on the entity's fields.
    // Good candidates:
    //   - Filter by enum field:    Task<IEnumerable<{EntityName}>> GetByStatusAsync(string status, ...)
    //   - Filter by boolean field: Task<IEnumerable<{EntityName}>> GetActiveAsync(...)
    //   - Lookup by unique string: Task<{EntityName}?> GetBy{FieldName}Async(string {fieldName}, ...)
    //   - Date range query:        Task<IEnumerable<{EntityName}>> GetBetweenDatesAsync(DateTimeOffset from, DateTimeOffset to, ...)
}

// === Implementation (Infrastructure) ===

using {RootNamespace}.Application.Authentication;
using {RootNamespace}.Domain.{EntityName}s;
using {RootNamespace}.Infrastructure.Data;
using Dapper;

namespace {RootNamespace}.Infrastructure.{EntityName}s;

public class {EntityName}Repository : DapperRepository<{EntityName}>, I{EntityName}Repository
{
    public {EntityName}Repository(
        DapperConnectionFactory connectionFactory,
        IAuthenticatedUserService authenticatedUserService,
        TimeProvider timeProvider)
        : base(connectionFactory, authenticatedUserService, timeProvider) { }

    // Example — filter by a field (repeat for each custom query method).
    // Always exclude soft-deleted rows by filtering on the soft-delete flag column from system-fields.yaml:
    public async Task<IEnumerable<{EntityName}>> GetBy{FieldName}Async(
        {CSharpType} {fieldName},
        CancellationToken cancellationToken = default)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = "SELECT * FROM [dbo].[{EntityName}] WHERE [{ColumnName}] = @{FieldName} AND [{SoftDeleteFlagColumn}] = 0";
        return await connection.QueryAsync<{EntityName}>(sql, new { {FieldName} = {fieldName} });
    }
}

// === DI Registration ===

services.AddScoped<I{EntityName}Repository, {EntityName}Repository>();
```

Choosing custom query methods from module fields:

| Field type            | Method to generate                                                              |
| --------------------- | ------------------------------------------------------------------------------- |
| `enum`                | `GetBy{FieldName}Async(string {fieldName})` — filter by enum value (string)     |
| `boolean`             | `Get{TrueValueDescription}Async()` — e.g. `isActive` → `GetActiveAsync()`       |
| `string` (unique key) | `GetBy{FieldName}Async(string {fieldName})` — lookup by unique identifier       |
| `datetime`            | `GetBetween{FieldName}Async(DateTimeOffset from, DateTimeOffset to)` — optional |
| `decimal` / `int`     | Only when a range query makes domain sense                                      |

Primary-constructor variant (as specified by the per-module repository scaffold):

```csharp
// Domain/Repositories/I{Entity}Repository.cs
using <RootNamespace>.Domain.Entities;

namespace <RootNamespace>.Domain.Repositories;

public interface I{Entity}Repository : IRepository<{Entity}>
{
    // Entity-specific methods can be added here
}

// Infrastructure/Data/{Entity}Repository.cs
using <RootNamespace>.Domain.Entities;
using <RootNamespace>.Domain.Repositories;

namespace <RootNamespace>.Infrastructure.Data;

public class {Entity}Repository(DapperConnectionFactory connectionFactory)
    : DapperRepository<{Entity}>(connectionFactory), I{Entity}Repository
{
}
```

This variant uses a C# 12 primary constructor; its base call does not match the three-parameter `DapperRepository<T>` constructor — see [Known conflicts and gaps](#known-conflicts-and-gaps).

---

## Entity classes

- `public class {EntityName} : BaseEntity` in `{RootNamespace}.Domain.Entities`, file `{Name}.Domain/Entities/{EntityName}.cs`.
- Entity name = PascalCase noun, no suffix (`Product`, `Customer`, `Invoice`).
- `public` auto-properties `{ get; set; }`, one per module field, PascalCase.
- Never redeclare `Id` or any system / audit field.
- Required strings: non-nullable `string` initialised to `string.Empty`. Optional fields: nullable (`string?`, `DateTimeOffset?`, value types `?`).
- Enum fields: `string` property.
- Preserve existing files; update surgically rather than overwrite custom code.

```csharp
using {RootNamespace}.Domain.Entities;

namespace {RootNamespace}.Domain.Entities;

public class {EntityName} : BaseEntity
{
    {EntityProperties}
}
```

Entity unit test template (`tests/{Name}.UnitTests/{EntityName}Tests.cs`):

```csharp
using {RootNamespace}.Domain.Entities;

namespace {TestRootNamespace};

public class {EntityName}Tests
{
    [Fact]
    public void {EntityName}_ShouldInheritBaseEntitySystemFields()
    {
        var entity = new {EntityName}();

        entity.Id.Should().Be(Guid.Empty);
        {SystemFieldDefaultAssertions}
    }

    [Fact]
    public void {EntityName}_Properties_ShouldBeSettable()
    {
        var entity = new {EntityName}
        {
            {EntityPropertyAssignments}
        };

        // Assert each assigned property
        {EntityPropertyAssertions}
    }
}
```

---

## DI registration

`{Name}.Infrastructure/ConfigureServices.cs`:

| Order | Registration                                                                            | Lifetime              |
| ----- | --------------------------------------------------------------------------------------- | --------------------- |
| 1     | `GlobalConfiguration.Setup().UseSqlServer()` (RepoDb, once, before any repository call) | n/a                   |
| 2     | `DapperConnectionFactory`                                                               | Singleton             |
| 3     | `IUnitOfWork` → `DapperUnitOfWork`                                                      | Scoped                |
| 4     | `IRepository<>` → `DapperRepository<>`                                                  | Scoped (open generic) |
| 5     | `I{EntityName}Repository` → `{EntityName}Repository` (per entity)                       | Scoped                |

- Signature **must** accept `IConfiguration configuration`.
- `using RepoDb;` is safe here (no DapperExtensions usage in this file).
- **`IDbConnection` is NOT registered in DI** — redundant with the factory and ambiguous on lifecycle. Use `DapperConnectionFactory.CreateConnection()` (with `using`) in repositories and `IUnitOfWork` for transactional work.
- `TimeProvider.System` must be registered in DI (consumed by `DapperRepository<T>`), as must `IAuthenticatedUserService`.

```csharp
using {RootNamespace}.Domain.Repositories;
using {RootNamespace}.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RepoDb;

namespace {RootNamespace}.Infrastructure;

public static class ConfigureServices
{
    public static IServiceCollection RegisterInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        GlobalConfiguration.Setup().UseSqlServer();

        services.AddSingleton<DapperConnectionFactory>();
        services.AddScoped<IUnitOfWork, DapperUnitOfWork>();
        services.AddScoped(typeof(IRepository<>), typeof(DapperRepository<>));

        return services;
    }
}
```

---

## Connection strings and secrets

- Key name is always `ConnectionStrings:DefaultConnection`, placed at the **top** of each appsettings JSON object, present in every appsettings file.
- Deployed environments: value `""`, injected at runtime (Azure App Configuration or Key Vault).
- Never hardcode connection strings in `.sql` files or `.sqlproj`.

| File                                                    | `DefaultConnection`                                                               |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `appsettings.json`                                      | `""` (base — always empty)                                                        |
| `appsettings.Development.json`                          | `""`, real value in `dotnet user-secrets` (see conflicts for the literal variant) |
| `appsettings.Dev.json`                                  | `""`                                                                              |
| `appsettings.Uat.json`                                  | `""`                                                                              |
| `appsettings.Prod.json` / `appsettings.Production.json` | `""` (file name differs between sources)                                          |

Canonical template:

```jsonc
// === appsettings.json (base — value empty, filled by environment override) ===

{
  "ConnectionStrings": {
    "DefaultConnection": ""
  }
}

// === appsettings.Development.json (local dev — Docker SQL Server) ===

{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database={DatabaseName};User Id=sa;Password=DevPassword123!;TrustServerCertificate=True;"
  }
}

// === appsettings.Dev.json / appsettings.Uat.json / appsettings.Production.json ===

{
  "ConnectionStrings": {
    "DefaultConnection": ""
  }
}
```

Local development secret (password read from `.env` so both stay identical; `UserSecretsId` must exist — `dotnet user-secrets init --project <ApiProjectPath>` if missing):

```powershell
$saPassword = (Get-Content .env | Where-Object { $_ -match '^SA_PASSWORD=' }) -replace '^SA_PASSWORD=', ''

dotnet user-secrets set "ConnectionStrings:DefaultConnection" `
  "Server=localhost,1433;Database={DatabaseName};User Id=sa;Password=$saPassword;TrustServerCertificate=True;" `
  --project "<ApiProjectPath>"
```

---

## Program.cs wiring

- Pass `builder.Configuration` to `RegisterInfrastructureServices`.
- In Development, call `EnsureSqlServerRunning(app.Logger, app.Environment.ContentRootPath)` inside the `IsDevelopment()` block: it walks up from `ContentRootPath` to the first `docker-compose.yml` and runs `docker compose up -d sqlserver` (30 s wait). Failures only log warnings; success logs `SQL Server Docker container started.`

```csharp
using System.Diagnostics;
using System.IO;

using {RootNamespace}.Api;
using {RootNamespace}.Application;
using {RootNamespace}.Domain;
using {RootNamespace}.Infrastructure;

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
    .RegisterInfrastructureServices(builder.Configuration)
    .RegisterApiServices(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    EnsureSqlServerRunning(app.Logger, app.Environment.ContentRootPath);
}

app.UseHttpsRedirection();
app.UseCors({RootNamespace}.Api.ConfigureServices.CorsPolicyName);
app.MapControllers();
app.MapHealthChecks("/api/health");
app.Run();

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

---

## SQL Server in Docker for local development

- `docker-compose.yml` at the **solution root** (folder of the `.slnx`/`.sln`). If one exists, add the `sqlserver` service and `sqlserver-data` volume without overwriting other services.
- `SA_PASSWORD` lives only in `.env` (solution root, sibling of `docker-compose.yml`) and in user-secrets. `.env` is gitignored and never committed; the password is never hardcoded in tracked files.
- The password is random per bootstrap: `Dev!` + 20 chars of a base64 of 18 random bytes with `+/=` removed (24 chars, satisfies SQL Server complexity).
- Docker Desktop must be running; the API starts the container automatically in Development. Standalone: `docker compose up -d sqlserver`.

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

```powershell
$saPasswordRaw = [System.Convert]::ToBase64String(
    [System.Security.Cryptography.RandomNumberGenerator]::GetBytes(18)
) -replace '[+/=]', ''
$saPassword = "Dev!" + $saPasswordRaw.Substring(0, 20)
"SA_PASSWORD=$saPassword" | Set-Content .env
```

---

## Infrastructure registration tests

- File: `tests/{Name}.UnitTests/Infrastructure/InfrastructureServiceRegistrationTests.cs`.
- Covers `DapperConnectionFactory`, `IUnitOfWork`, `IRepository<>` registrations.
- Test project uses `AwesomeAssertions` as a global using (`<Using Include="AwesomeAssertions" />`) and xUnit `[Fact]`.
- Tests that instantiate `IUnitOfWork` need a running SQL Server — mark them integration (`[Integration]`) or skip in unit runs if needed.
- `dotnet build {Name}.slnx` and `dotnet test {Name}.slnx` must succeed with zero errors.

```csharp
using {RootNamespace}.Domain.Repositories;
using {RootNamespace}.Infrastructure;
using {RootNamespace}.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace {TestRootNamespace}.Infrastructure;

public class InfrastructureServiceRegistrationTests
{
    private static IServiceProvider BuildServiceProvider()
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Server=localhost,1433;Database=TestDb;User Id=sa;Password=DevPassword123!;TrustServerCertificate=True;"
            })
            .Build();

        services.AddSingleton<IConfiguration>(configuration);
        services.RegisterInfrastructureServices(configuration);
        return services.BuildServiceProvider();
    }

    [Fact]
    public void RegisterInfrastructureServices_ShouldRegisterDapperConnectionFactory()
    {
        var provider = BuildServiceProvider();
        provider.GetService<DapperConnectionFactory>().Should().NotBeNull();
    }

    [Fact]
    public void RegisterInfrastructureServices_ShouldRegisterIUnitOfWork()
    {
        var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();
        // IUnitOfWork requires a real SQL connection — verify it resolves without throwing
        scope.ServiceProvider.GetService<IUnitOfWork>().Should().NotBeNull();
    }

    [Fact]
    public void RegisterInfrastructureServices_ShouldRegisterGenericRepository()
    {
        var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();
        var repository = scope.ServiceProvider.GetService<IRepository<TestEntity>>();
        repository.Should().NotBeNull();
        repository.Should().BeOfType<DapperRepository<TestEntity>>();
    }

    private class TestEntity { public Guid Id { get; set; } }
}
```

---

## SQL Database Project

| Item             | Convention                                                                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project type     | SDK-style SQL Database Project, `<Project Sdk="Microsoft.Build.Sql/...">`, created with `dotnet new sqlproj` (template package `Microsoft.Build.Sql.Templates`) |
| Name             | `{SolutionName}.Database` (e.g. `Acme.App.Database`)                                                                                                            |
| Location         | `{SolutionRoot}\{Name}.Database\{Name}.Database.sqlproj`, added to the solution (`.slnx` preferred, `.sln` fallback)                                            |
| Default platform | `SqlServer2022`                                                                                                                                                 |
| Pre/Post deploy  | `PreDeploy` / `PostDeploy` item references in the `.sqlproj`                                                                                                    |
| File inclusion   | SDK-style projects auto-include all `.sql` files under the project folder (see conflicts)                                                                       |

Folder layout (schema, then object type; additional schemas such as `audit`, `reporting` repeat the layout):

```text
{ProjectName}/
├── {ProjectName}.sqlproj
├── dbo/
│   ├── Tables/
│   ├── Views/
│   ├── StoredProcedures/
│   └── Functions/
└── Scripts/
    ├── Pre-Deployment/
    │   └── Script.PreDeployment.sql
    └── Post-Deployment/
        └── Script.PostDeployment.sql
```

| Object type           | Folder                       |
| --------------------- | ---------------------------- |
| Table                 | `{schema}/Tables/`           |
| View                  | `{schema}/Views/`            |
| Stored procedure      | `{schema}/StoredProcedures/` |
| Scalar function       | `{schema}/Functions/`        |
| Table-valued function | `{schema}/Functions/`        |

Target platforms:

| Platform string       | Version            | DSP                                                                 |
| --------------------- | ------------------ | ------------------------------------------------------------------- |
| `SqlServer2022`       | SQL Server 2022    | `Microsoft.Data.Tools.Schema.Sql.Sql160DatabaseSchemaProvider`      |
| `SqlServer2019`       | SQL Server 2019    | `Microsoft.Data.Tools.Schema.Sql.Sql150DatabaseSchemaProvider`      |
| `SqlServer2017`       | SQL Server 2017    | `Microsoft.Data.Tools.Schema.Sql.Sql140DatabaseSchemaProvider`      |
| `SqlServer2016`       | SQL Server 2016    | `Microsoft.Data.Tools.Schema.Sql.Sql130DatabaseSchemaProvider`      |
| `AzureSqlDatabaseV12` | Azure SQL Database | `Microsoft.Data.Tools.Schema.Sql.SqlAzureV12DatabaseSchemaProvider` |

Typical `.sqlproj`:

```xml
<Project Sdk="Microsoft.Build.Sql/0.2.1">
  <PropertyGroup>
    <ProjectGuid>{GUID}</ProjectGuid>
    <DSP>Microsoft.Data.Tools.Schema.Sql.Sql160DatabaseSchemaProvider</DSP>
    <SqlTargetName>{ProjectName}</SqlTargetName>
  </PropertyGroup>
  <ItemGroup>
    <PreDeploy Include="Scripts\Pre-Deployment\Script.PreDeployment.sql" />
    <PostDeploy Include="Scripts\Post-Deployment\Script.PostDeployment.sql" />
  </ItemGroup>
</Project>
```

---

## Object naming conventions

| Item               | Convention                         | Example                               |
| ------------------ | ---------------------------------- | ------------------------------------- |
| Schema             | `dbo` by default                   | `[dbo]`                               |
| Database objects   | PascalCase, in brackets            | `[Customer]`, `[GetActiveOrders]`     |
| Tables             | Singular entity name               | `[dbo].[Invoice]`                     |
| Columns            | PascalCase, in brackets            | `[Id]`, `[CreatedAt]`, `[FirstName]`  |
| Primary key        | `PK_{TableName}`                   | `PK_Customer`                         |
| Default constraint | `DF_{TableName}_{ColumnName}`      | `DF_Customer_CreatedAt`               |
| Foreign key        | `FK_{TableName}_{ReferencedTable}` | `FK_Order_Customer`                   |
| Index              | `IX_{TableName}_{ColumnName(s)}`   | `IX_Order_CustomerId`                 |
| File names         | Exactly the object name            | `Customer.sql`, `GetActiveOrders.sql` |

All schema, table, column and constraint identifiers are bracket-quoted. One object per file.

---

## Table scripts generated from module YAML

| Rule             | Detail                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| File             | `<SqlProject>\dbo\Tables\{EntityName}.sql` (create `dbo\Tables\` if missing); preserve unrelated SQL                                                |
| Table name       | `[dbo].[{EntityName}]`, singular, = entity name from module YAML                                                                                    |
| Column order     | System fields first (order of `system-fields.yaml`), then module fields (YAML order)                                                                |
| Column name      | PascalCase of field name, bracketed                                                                                                                 |
| Column type      | YAML type via the type-mapping table                                                                                                                |
| Nullability      | `required: true` → `NOT NULL`, `required: false` → `NULL`; system keys without `required: false` are `NOT NULL`                                     |
| Primary key      | The `guid` system field (typically `id` → `[Id]`, `UNIQUEIDENTIFIER`)                                                                               |
| `[Id]` default   | `UNIQUEIDENTIFIER` with neither `defaultValue` nor `computedValue` gets a generated GUID default (`NEWSEQUENTIALID()` vs `NEWID()` — see conflicts) |
| Other defaults   | See conflicts (application-managed vs column DEFAULT)                                                                                               |
| Identity columns | Identity-type system fields use `NVARCHAR(256)`; values set by the application                                                                      |

Table-scaffold shape (named clustered PK):

```sql
CREATE TABLE [dbo].[<EntityName>]
(
    -- fields from <AllFields>, in declared order
    [<FieldName>]  <SqlType>  <NULLABILITY> <DEFAULT>,
    ...

    CONSTRAINT [PK_<EntityName>] PRIMARY KEY CLUSTERED ([<IdColumnName>] ASC)
);
```

Data-access template (inline PK):

```sql
CREATE TABLE [dbo].[{EntityName}] (
    -- SYSTEM FIELD COLUMNS — GENERATED FROM system-fields.yaml. Do not hardcode this list.
    -- Emit one column per top-level key in `input/system-fields.yaml`, in declared order:
    --   column NAME = PascalCase of the YAML key (bracket-wrapped),
    --   column TYPE = the key's `type` mapped via the Field Type Mapping table.
    --   The `id` key is the PRIMARY KEY (UNIQUEIDENTIFIER, DEFAULT NEWID()).
    --   Identity-type system fields use NVARCHAR(256); their values are assigned by the application layer.
    --   A key's `defaultValue`/`computedValue` (if any) becomes its column DEFAULT; otherwise no DEFAULT.
    --   Keys with `required: false` are NULL-able; all others are NOT NULL.
    [Id]  UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWID() PRIMARY KEY,
    -- Repeat for every remaining key in system-fields.yaml (order and nullability per the rules above):
    [{PascalCaseSystemFieldName}]  {SqlType}  {NOT NULL | NULL}  {DEFAULT ...},
    -- Repeat for each field in the module YAML:
    [{PascalCaseFieldName}]  {SqlType}  {NOT NULL | NULL}
);
```

Registration in the project (as specified by the table scaffold; backslashes, no duplicates, create an `<ItemGroup>` if none fits):

```xml
<ItemGroup>
  <Build Include="dbo\Tables\Customer.sql" />
</ItemGroup>
```

Validate with `dotnet build <sqlproj-file>`.

---

## Generic SQL object templates

File = `{schema}/{TypeFolder}/{ObjectName}.sql`; `{ObjectName}` is PascalCase without schema prefix and matches the file name. No placeholder text left unfilled; no environment-specific values.

Table (generic, non-module template):

```sql
CREATE TABLE [dbo].[{TableName}]
(
    [Id]            INT             NOT NULL IDENTITY(1,1),
    [CreatedAt]     DATETIME2(7)    NOT NULL CONSTRAINT [DF_{TableName}_CreatedAt] DEFAULT SYSUTCDATETIME(),
    [CreatedBy]     NVARCHAR(256)   NOT NULL,
    [ModifiedAt]    DATETIME2(7)    NOT NULL CONSTRAINT [DF_{TableName}_ModifiedAt] DEFAULT SYSUTCDATETIME(),
    [ModifiedBy]    NVARCHAR(256)   NOT NULL,
    CONSTRAINT [PK_{TableName}] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO
```

View:

```sql
CREATE VIEW [dbo].[{ViewName}]
AS
    SELECT
        -- TODO: define columns
    FROM [dbo].[{SourceTable}]
    WHERE 1 = 1;
GO
```

Stored procedure:

```sql
CREATE PROCEDURE [dbo].[{ProcedureName}]
    @Param1 INT
AS
BEGIN
    SET NOCOUNT ON;

    -- TODO: implement procedure body

END;
GO
```

Function:

```sql
CREATE FUNCTION [dbo].[{FunctionName}]
(
    @Param1 INT
)
RETURNS INT
AS
BEGIN
    DECLARE @Result INT;

    -- TODO: implement function body

    RETURN @Result;
END;
GO
```

Common build failures: duplicate object name (rename), T-SQL syntax error, missing referenced object (create it first or use a pre-deployment script).

---

## Pre- and post-deployment scripts

Run outside the schema comparison (not subject to sqlpackage idempotency). Include sub-scripts with SQLCMD `:r` rather than inline SQL.

| Use pre-deployment for                         | Use post-deployment for                         |
| ---------------------------------------------- | ----------------------------------------------- |
| Dropping constraints / indexes before a change | Seeding reference / lookup data                 |
| Migrating data before a column rename          | Recreating constraints / indexes after a change |
| Temporary tables needed during deployment      | Granting permissions                            |

`Scripts/Pre-Deployment/Script.PreDeployment.sql`:

```sql
/*
 Pre-Deployment Script Template
 This file contains SQL statements that will be executed before the build script.
 Use SQLCMD syntax to include a file in the pre-deployment script.
 Example:      :r .\myfile.sql
 Use SQLCMD syntax to reference a variable in the pre-deployment script.
 Example:      :setvar TableName MyTable
               SELECT * FROM [$(TableName)]
*/
```

`Scripts/Post-Deployment/Script.PostDeployment.sql`:

```sql
/*
 Post-Deployment Script Template
 This file contains SQL statements that will be appended to the build script.
 Use SQLCMD syntax to include a file in the post-deployment script.
 Example:      :r .\myfile.sql
 Use SQLCMD syntax to reference a variable in the post-deployment script.
 Example:      :setvar TableName MyTable
               SELECT * FROM [$(TableName)]
*/
```

---

## Build and deploy (dacpac, sqlpackage)

Build — produces `bin\Debug\{ProjectName}.dacpac` (or `bin\Release\`):

```powershell
dotnet build {ProjectName}.sqlproj
```

Deploy — `sqlpackage /Action:Publish` with the dacpac as `/SourceFile` and a full ADO.NET connection string as `/TargetConnectionString`; extra sqlpackage arguments (e.g. `/p:BlockOnPossibleDataLoss=False`) are appended as needed:

```powershell
dotnet tool exec sqlpackage /Action:Publish /SourceFile:bin/Debug/{ProjectName}.dacpac /TargetConnectionString:"{ConnectionString}"
```

`dotnet tool exec` resolves the version from the local tool manifest (no global install). The deployment script variant instead requires `sqlpackage` on PATH (`dotnet tool install -g microsoft.sqlpackage`), verifies the dacpac exists, and fails with sqlpackage's exit code. Example connection string: `Server=localhost;Database={DatabaseName};Trusted_Connection=True;TrustServerCertificate=True;`.

---

## Best practices and invariants

- Source-control `.sql` files, never `.dacpac`; `bin/` and `obj/` are gitignored.
- No hardcoded connection strings in `.sql` / `.sqlproj`; they belong in appsettings and are injected at runtime or deployment.
- One object per file; file name = object name.
- Schema is environment-agnostic; environment-specific seeding goes to post-deployment.
- Use `SYSUTCDATETIME()` (datetime2(7)) for audit columns, not `GETDATE()` / `GETUTCDATE()`.
- Always bracket object names.
- Never physically delete rows through the repository; always filter soft-deleted rows in reads.
- Never register `IDbConnection` in DI.
- Never add `using RepoDb;` to `DapperRepository.cs`.
- Parameterize all SQL; no string interpolation of input.
- Do not create README files in generated subfolders; update the central project documentation.

---

## Known conflicts and gaps

| #   | Topic                                              | Variant A                                                                                                                                        | Variant B                                                                                                                                              |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `string` / `enum` SQL widths                       | `NVARCHAR(256)` / `NVARCHAR(50)` (`standards-launchpad` type mapping, used by `dotnet-db-table-launchpad`)                                       | `NVARCHAR(500)` / `NVARCHAR(100)` (`data-setup-launchpad`)                                                                                             |
| 2   | `[Id]` default                                     | `DEFAULT NEWSEQUENTIALID()` (`standards-launchpad`, `dotnet-db-table-launchpad`)                                                                 | `DEFAULT NEWID()` (`data-setup-launchpad` table template)                                                                                              |
| 3   | PK declaration                                     | Named `CONSTRAINT [PK_{EntityName}] PRIMARY KEY CLUSTERED` (`dotnet-db-table-launchpad`, `sqldb-setup-launchpad` naming)                         | Inline unnamed `PRIMARY KEY` (`data-setup-launchpad`)                                                                                                  |
| 4   | Column DEFAULTs for `defaultValue`/`computedValue` | None — application-managed (`standards-launchpad`, `dotnet-db-table-launchpad`)                                                                  | Become column DEFAULT (`data-setup-launchpad` table-template comment); same source's rules also say only `id` and the soft-delete flag carry a DEFAULT |
| 5   | Generic table template                             | `INT IDENTITY(1,1)` id, `DATETIME2(7)` + `SYSUTCDATETIME()` audit columns, `CreatedAt/CreatedBy/ModifiedAt/ModifiedBy` (`sqldb-setup-launchpad`) | `UNIQUEIDENTIFIER` id, `DATETIMEOFFSET`, system fields from `system-fields.yaml` (module-driven tables)                                                |
| 6   | Registering table files in `.sqlproj`              | Not needed — SDK-style auto-includes `.sql` (`sqldb-setup-launchpad`)                                                                            | Add `<Build Include="dbo\Tables\{EntityName}.sql" />` (`dotnet-db-table-launchpad`)                                                                    |
| 7   | Typed repository namespace/folder                  | `Domain.Repositories` + `Infrastructure.Data` (`data-setup-launchpad` add-entity + typed template, `dotnet-repository-launchpad`)                | `Domain.{EntityName}s` + `Infrastructure.{EntityName}s` (`data-setup-launchpad` module template / generation steps)                                    |
| 8   | Typed repository constructor                       | Three params forwarded to base (`data-setup-launchpad`)                                                                                          | Primary constructor with `DapperConnectionFactory` only (`dotnet-repository-launchpad`) — does not compile against the three-param base                |
| 9   | Enum C# type                                       | Entity property stays `string` (`data-setup-launchpad`)                                                                                          | C# `enum` + `[EnumMember]` (`standards-launchpad`)                                                                                                     |
| 10  | Development connection string                      | `""` in `appsettings.Development.json`, real value in user-secrets (`data-setup-launchpad` flow)                                                 | Literal `...Password=DevPassword123!...` (`data-setup-launchpad` JSON template, `sqldb-setup-launchpad`)                                               |
| 11  | Prod appsettings file name                         | `appsettings.Production.json` (`data-setup-launchpad`)                                                                                           | `appsettings.Prod.json` (`sqldb-setup-launchpad`)                                                                                                      |
| 12  | sqlpackage invocation                              | `dotnet tool exec sqlpackage` via local manifest                                                                                                 | Global `dotnet tool install -g microsoft.sqlpackage` (deploy script)                                                                                   |
| 13  | Module YAML entity name key                        | `entity.name` (`dotnet-db-table-launchpad`, `dotnet-repository-launchpad`)                                                                       | `entity: {EntityName}` (`data-setup-launchpad` example)                                                                                                |

Gaps:

- `_connectionFactory` is `private` in `DapperRepository<T>`, yet typed repository templates use `_connectionFactory.CreateConnection()` in derived classes; it must be `protected` (or re-captured) for custom queries to compile.
- `DapperRepository<T>` methods accept `CancellationToken` but DapperExtensions calls do not pass it.
- `DapperRepository<T>` does not use `IUnitOfWork` transactions; how repositories join a unit of work is unspecified.
- Index / foreign-key generation from module YAML is not defined (only naming conventions).
- `TimeProvider` / `IAuthenticatedUserService` registration is required but not part of the Infrastructure DI template.

---

## Sources

`data-setup-launchpad`, `dotnet-repository-launchpad`, `dotnet-db-table-launchpad`, `sqldb-setup-launchpad`, `standards-launchpad`

Extracted from NexusInnovation/nexus-plugin-marketplace plugins/launchpad on 2026-11-24.
