# Project Input Model

The YAML input model (`project.yaml`, `system-fields.yaml`, `modules/*.yaml`) that is the single source of truth driving Nexus launchpad code generation, with its schema, validation rules, type mapping and derived names.

## Contents

- [Folder layout and authority](#folder-layout-and-authority)
- [project.yaml](#projectyaml)
- [system-fields.yaml](#system-fieldsyaml)
- [defaultValue and computedValue](#defaultvalue-and-computedvalue)
- [Module files (modules/{module-name}.yaml)](#module-files-modulesmodule-nameyaml)
- [Data types](#data-types)
- [Control types and input formats](#control-types-and-input-formats)
- [choices and enum fields](#choices-and-enum-fields)
- [Layout](#layout)
- [Relationships and lookups](#relationships-and-lookups)
- [Type mapping across the stack](#type-mapping-across-the-stack)
- [Validation rules](#validation-rules)
- [Project naming derivations](#project-naming-derivations)
- [Azure deployment derivations](#azure-deployment-derivations)
- [Output locations and backend root resolution](#output-locations-and-backend-root-resolution)
- [Canonical examples](#canonical-examples)
- [Known conflicts and gaps](#known-conflicts-and-gaps)
- [Sources](#sources)

---

## Folder layout and authority

```text
{target-folder}/              # default: /input (relative to the workspace root)
├── project.yaml              # entrypoint
├── system-fields.yaml        # shared system fields, generated once per project (not per module)
└── modules/
    └── {module-name}.yaml    # one file per entity; filename = module-name (kebab-case)
```

- The input files are the **single source of truth** for everything generated afterwards (backend, frontend, database, infrastructure, pipeline, documentation).
- The schema below is authoritative: never invent field names or value options.
- Never silently overwrite an existing module file; extending a project appends new module paths after existing `modules` entries (preserving navigation order).
- `branding.icon` / `branding.logo` files are not generated — only their paths are recorded.

---

## project.yaml

Located at `{target-folder}/project.yaml`.

```yaml
project-name: string # Required. kebab-case; each hyphen-separated segment starts with a letter.
description: string # Required. One-sentence description of the project.
languages: # Required. Non-empty list of language codes; FIRST entry is the default language.
  - en
  - fr
displayName: # Required. Human-readable project name, one entry per code in `languages`.
  en: string
  fr: string
branding: # Optional. Omit the whole block when no branding value is provided.
  primaryColor: string # Optional. Hex color #RRGGBB (e.g. #1976D2)
  secondaryColor: string # Optional. Hex color #RRGGBB (e.g. #FF5722)
  icon: string # Optional. Path relative to the target folder (e.g. assets/icon.png)
  logo: string # Optional. Path relative to the target folder (e.g. assets/logo.svg)
modules: # Required. Non-empty list of module file paths relative to the target folder.
  - modules/customer.yaml # ORDER = navigation order in the generated application.
  - modules/product.yaml
auth: # Optional. Authentication metadata.
  entra: # Optional. Microsoft Entra frontend auth metadata.
    tenant-id: string # Optional. Tenant ID used by the frontend auth flow.
    client-id: # Optional. Frontend SPA client IDs per environment.
      dev: string # Optional. Dev / default frontend registration.
      uat: string # Optional. UAT frontend registration.
      prod: string # Optional. Production frontend registration.
azure: # Optional. Azure Bicep infrastructure and Azure DevOps pipeline.
  applicationName: string # Optional. Prefix of every Azure resource name. Defaults to `project-name`.
  location: string # Optional. Azure region. Defaults to canadaeast.
  infrastructure: boolean # Optional. Scaffold the Bicep infrastructure (infra/). Defaults to true.
  pipeline: boolean # Optional. Scaffold the Azure DevOps pipeline (pipelines/). Defaults to true.
  sqlAdminGroup: # Optional. Entra ID group administering the SQL server. Placeholders when omitted.
    name: string # Group display name.
    objectId: string # Group object ID.
  environments: # Required when `azure` is present. At least one entry, in promotion order (dev first).
    - code: string # Required. Lowercase letters and digits (e.g. "dev").
      name: string # Optional. Display name. Defaults to `code` with its first letter uppercased.
      appServicePlanSku: string # Optional. F1 or Premium v3/v4 (e.g. P0v3). Default F1 on first env, P0v3 on others.
      sqlDatabaseSku: string # Optional. Default Basic on first env, GP_S_Gen5_1 (serverless) on others.
      serviceConnection: string # Required when the pipeline step runs. Azure DevOps ARM service connection name.
      resourceGroupName: string # Optional, ONLY when `infrastructure` is false. Defaults to `<applicationName>-<code>-rg`.
documentation: # Optional. Technical documentation scaffold.
  customerName: string # Required when `documentation` is present.
  platform: string # Required when `documentation` is present: `azure-devops-wiki` | `github-repo-docs`.
  language: string # Optional. `english` | `french`. Default `french` when languages[0] is `fr`, else `english`.
```

### Field summary

| Key                                        | Required                               | Type / allowed values                                           | Default                                            |
| ------------------------------------------ | -------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------- |
| `project-name`                             | Yes                                    | kebab-case, each segment starts with a letter                   | —                                                  |
| `description`                              | Yes                                    | one sentence                                                    | —                                                  |
| `languages`                                | Yes                                    | non-empty list of language codes; first = default               | `[en, fr]` (suggested when generating)             |
| `displayName`                              | Yes                                    | map: one entry per `languages` code                             | —                                                  |
| `branding`                                 | No                                     | block                                                           | omitted                                            |
| `branding.primaryColor` / `secondaryColor` | No                                     | `#RRGGBB`                                                       | —                                                  |
| `branding.icon` / `branding.logo`          | No                                     | relative path                                                   | —                                                  |
| `modules`                                  | Yes                                    | non-empty list of existing file paths; order = navigation order | —                                                  |
| `auth.entra.tenant-id`                     | No                                     | string                                                          | —                                                  |
| `auth.entra.client-id.{dev,uat,prod}`      | No                                     | string                                                          | placeholders allowed                               |
| `azure.applicationName`                    | No                                     | `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`                                 | `project-name`                                     |
| `azure.location`                           | No                                     | Azure region                                                    | `canadaeast`                                       |
| `azure.infrastructure`                     | No                                     | boolean                                                         | `true`                                             |
| `azure.pipeline`                           | No                                     | boolean                                                         | `true`                                             |
| `azure.sqlAdminGroup.{name,objectId}`      | No                                     | strings                                                         | `// TODO:` placeholders in `.bicepparam`           |
| `azure.environments[].code`                | Yes (in azure)                         | lowercase letters and digits                                    | —                                                  |
| `azure.environments[].name`                | No                                     | string                                                          | `code` with first letter uppercased                |
| `azure.environments[].appServicePlanSku`   | No                                     | `F1` or Premium v3/v4                                           | `F1` first env, `P0v3` others                      |
| `azure.environments[].sqlDatabaseSku`      | No                                     | see SQL SKU rule                                                | `Basic` first env, `GP_S_Gen5_1` others            |
| `azure.environments[].serviceConnection`   | When pipeline runs                     | string                                                          | —                                                  |
| `azure.environments[].resourceGroupName`   | No (only when `infrastructure: false`) | string                                                          | `<applicationName>-<code>-rg`                      |
| `documentation.customerName`               | Yes (in documentation)                 | non-empty string                                                | —                                                  |
| `documentation.platform`                   | Yes (in documentation)                 | `azure-devops-wiki` \| `github-repo-docs`                       | —                                                  |
| `documentation.language`                   | No                                     | `english` \| `french`                                           | `french` if `languages[0]` is `fr`, else `english` |

### Branding conventions

- `primaryColor` and `secondaryColor` must be valid CSS hex codes `#RRGGBB`.
- `icon` is a small square image (favicon, app launcher, tab icon); `logo` is a wider image (headers, splash screens).
- Both paths are relative to the target folder.

### Entra auth conventions

- `auth`, `auth.entra`, and `auth.entra.client-id` may each be omitted, partially filled, or left with placeholders.
- Validation must **not** fail when the Entra block is absent or incomplete; tenant ID and per-environment client IDs may be populated later.
- During scaffolding, app-registration automation is attempted first; it may continue with placeholders when the user lacks Entra permissions.
- Entra auth (frontend MSAL + backend JWT Bearer) is scaffolded only when `auth.entra` is present.

### Azure conventions

- `azure` may be omitted entirely: infrastructure and pipeline steps are **skipped, not failed**.
- One `environments` list serves both infrastructure and pipeline, so they always agree on environment codes, resource groups, app names and deployment slots.
- `infrastructure: false` scaffolds only the pipeline for pre-existing resources; `resourceGroupName` then names their resource group. Existing apps must already be named `<applicationName>-<code>-app-api` and `<applicationName>-<code>-app-web`.
- List `environments` in promotion order, dev first — SKU defaults treat the first entry as dev.
- `sqlAdminGroup` may be filled later.
- Never ask for (or store) resource group names (when infra is scaffolded) or deployment slots — both are derived.
- Modules, runtimes, app settings, solution paths and package names are **never** part of `project.yaml`; they are derived from the scaffolded backend/frontend folders.

### Documentation conventions

- `documentation` may be omitted entirely: the documentation step is skipped, not failed.
- `customerName` and `platform` are required when present (the platform cannot be detected before a git remote exists).
- The project name used is `displayName` in the documentation language; environments are the codes of `azure.environments`. Neither belongs to the block.
- Documentation is scaffolded into `Documentation/` at the root of the generated project (TODO blocks left to fill). `.github/copilot-instructions.md` gets a `## Documentation` section pointing at it. When `azure` is also present, a first-environment setup guide filled from `azure.environments` is added to `Documentation/Guides-And-References/` (e.g. `First-Environment-Setup.md`).

---

## system-fields.yaml

Located at `{target-folder}/system-fields.yaml`. Generated **once per project**, with defaults (no questions). Each system field declares the same properties as a module field (`displayName`, `type`, `control`, `required`) plus optional `defaultValue` / `computedValue`. Generators read system fields from this file — they are **not hardcoded**. Only display names are meant to be edited; `type`, `control` and `required` are fixed. Language keys must match `project.yaml` `languages`.

### Canonical content

| Key         | `displayName` (en / fr)                                             | `type`     | `control`    | `defaultValue` | `computedValue` | `required` | Role                                    |
| ----------- | ------------------------------------------------------------------- | ---------- | ------------ | -------------- | --------------- | ---------- | --------------------------------------- |
| `id`        | ID / ID                                                             | `guid`     | `textfield`  | —              | —               | `true`     | Primary key                             |
| `createdAt` | Created At / Créé le                                                | `datetime` | `datepicker` | `now`          | —               | `true`     | Creation timestamp                      |
| `createdBy` | Created By / Créé par                                               | `string`   | `textfield`  | `username`     | —               | `true`     | Creator identity                        |
| `updatedAt` | Updated At / Mis à jour le                                          | `datetime` | `datepicker` | —              | `now`           | `true`     | Last-update timestamp                   |
| `updatedBy` | Updated By / Mis à jour par                                         | `string`   | `textfield`  | —              | `username`      | `true`     | Last-updater identity                   |
| `isDeleted` | Deleted / Supprimé (example input uses "Is Deleted / Est supprimé") | `boolean`  | `checkbox`   | `false`        | `true`          | `true`     | Soft-delete flag                        |
| `deletedAt` | Deleted At / Supprimé le                                            | `datetime` | `datepicker` | —              | `now`           | `false`    | Deletion timestamp (null until deleted) |
| `deletedBy` | Deleted By / Supprimé par                                           | `string`   | `textfield`  | —              | `username`      | `false`    | Deleter identity (null until deleted)   |

Rules:

- All keys above are required in the file.
- `id` always uses `type: guid`.
- `required` is `true` for every system field **except** the soft-delete audit pair `deletedAt` / `deletedBy` (nullable until the entity is soft-deleted).
- Allowed properties on a system field: `displayName`, `type`, `control`, `required`, `defaultValue`, `computedValue` — nothing else.
- Entities are **never physically deleted**: the repository's `DeleteAsync` stamps the soft-delete trio (`isDeleted`, `deletedAt`, `deletedBy`).
- System fields never appear in a module's `fields`; per-module configuration is visibility only (via `layout`).
- System fields are **never** available in the create view; in edit they may only be `readonly`; `id` is always `readonly`.

### Default per-view visibility (when listed in schema)

| Field       | `list` default | `edit` default    |
| ----------- | -------------- | ----------------- |
| `id`        | `true`         | always `readonly` |
| `createdAt` | `false`        | `hidden`          |
| `createdBy` | `false`        | `hidden`          |
| `updatedAt` | `false`        | `hidden`          |
| `updatedBy` | `false`        | `hidden`          |

---

## defaultValue and computedValue

Optional behavioural properties on system fields — **generation metadata only**: they do not appear as data properties in the generated TypeScript/Zod schema (the data type remains the underlying `type`).

| Property        | Values                             | Behaviour                                              | Applied by                         |
| --------------- | ---------------------------------- | ------------------------------------------------------ | ---------------------------------- |
| `defaultValue`  | `now`, `username`, `true`, `false` | Assigned **once at creation**; never changed on update | Create command handler only        |
| `computedValue` | `now`, `username`, `true`, `false` | Recalculated on **every save** (create and update)     | Create and Update command handlers |

Type compatibility: `now` → `datetime` only; `username` → `string` only; `true` / `false` → `boolean` only.

**Soft-delete trio exception** (`isDeleted`, `deletedAt`, `deletedBy`): their `computedValue` is **not** applied on every save — it is applied **exclusively by the repository's `DeleteAsync`**, never by the Create or Update handler. This is the only case where a field may declare both properties: `isDeleted` combines `defaultValue: false` (state at creation) with `computedValue: true` (state on deletion). Otherwise a field may not declare both.

### Value mapping

| YAML value       | C# expression                                                                              | SQL DEFAULT                   | TypeScript     |
| ---------------- | ------------------------------------------------------------------------------------------ | ----------------------------- | -------------- |
| `now`            | `timeProvider.GetUtcNow()` (inject `TimeProvider`; `TimeProvider.System` registered in DI) | None — managed by application | n/a (metadata) |
| `username`       | `authenticatedUserService.GetAuthenticatedUser()` (inject `IAuthenticatedUserService`)     | None — managed by application | n/a            |
| `true` / `false` | literal boolean                                                                            | None — managed by application | n/a            |

Fields with neither property keep type-specific defaults: `id` → `Guid.NewGuid()` in C# and `DEFAULT NEWSEQUENTIALID()` in SQL for the `UNIQUEIDENTIFIER` primary key; all other types have no SQL DEFAULT.

### Handler assignment rules

| Property            | Create handler                            | Update handler                                 |
| ------------------- | ----------------------------------------- | ---------------------------------------------- |
| `defaultValue`      | Assign the mapped value                   | Do **not** reassign (immutable after creation) |
| `computedValue`     | Assign the mapped value¹                  | Reassign the mapped value¹                     |
| Neither (e.g. `id`) | Assign separately (e.g. `Guid.NewGuid()`) | n/a                                            |

¹ Except the soft-delete trio — assigned only by `DeleteAsync`.

```csharp
// Create handler
var now = timeProvider.GetUtcNow();
var authenticatedUser = authenticatedUserService.GetAuthenticatedUser();
CreatedAt = now,               // defaultValue: now
CreatedBy = authenticatedUser, // defaultValue: username
UpdatedAt = now,               // computedValue: now
UpdatedBy = authenticatedUser, // computedValue: username

// Update handler — only computedValue fields
UpdatedAt = timeProvider.GetUtcNow(),
UpdatedBy = authenticatedUserService.GetAuthenticatedUser(),
// defaultValue-only fields are NOT reassigned
```

> Conflict: the schema's value-mapping table describes `now` as `DateTimeOffset.UtcNow` and `username` as "current user identity (e.g. `"system"`, HTTP context principal)"; the type-mapping standard specifies `TimeProvider.GetUtcNow()` and `IAuthenticatedUserService.GetAuthenticatedUser()`. The type-mapping form is the more specific generator contract.

---

## Module files (modules/{module-name}.yaml)

One file per entity at `{target-folder}/modules/{module-name}.yaml`; the filename (without extension) must equal `module-name`.

```yaml
module-name: string # Required. kebab-case; must match the filename.
icon: string # Required. Valid @mui/icons-material export name (e.g. PeopleAlt, ShoppingCart).
cardDescription: # Optional. Short dashboard card description, one entry per language.
  en: string
  fr: string

entity:
  name: string # Required. PascalCase entity class name (e.g. Customer, SalesOrder).
  displayName: # Required. One entry per language.
    en: string
    fr: string
  systemFields: system-fields.yaml # Required. Always this literal path (not an inline block).
  fields: # Required. At least one user-defined field.
    - name: string # Required. camelCase.
      displayName: # Required. One entry per language.
        en: string
        fr: string
      required: boolean # Required. true = non-nullable.
      type: string # Required. int | decimal | string | datetime | boolean | enum (guid forbidden).
      control: string # Required. Must be compatible with `type`.
      inputFormat: string # Optional. financial | percentage | uppercase.
      choices: # Optional (required for enum). Static selectable items.
        - value: string # Must match the field's type; PascalCase member for enum.
          displayName:
            en: string
            fr: string
  layout: # Optional. Visibility and order per view.
    list: [string] # Columns of the list/table view (fields + system fields).
    create: [string] # Create form; all editable; NO system fields.
    edit: # Edit form; single-key maps fieldName: editable | readonly.
      - fieldName: editable
      - fieldName: readonly
```

### Module property summary

| Property              | Required | Rule                                                                                                                                       |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `module-name`         | Yes      | kebab-case; equals filename                                                                                                                |
| `icon`                | Yes      | non-empty; must resolve to a real `@mui/icons-material` component (check `https://unpkg.com/@mui/icons-material/<icon>.js`; 404 = invalid) |
| `cardDescription`     | No       | one entry per language                                                                                                                     |
| `entity.name`         | Yes      | PascalCase                                                                                                                                 |
| `entity.displayName`  | Yes      | one entry per language                                                                                                                     |
| `entity.systemFields` | Yes      | literal `system-fields.yaml`                                                                                                               |
| `entity.fields`       | Yes      | non-empty                                                                                                                                  |
| `entity.layout`       | No       | see [Layout](#layout)                                                                                                                      |

### Field property summary

| Property      | Required            | Allowed values                                                      |
| ------------- | ------------------- | ------------------------------------------------------------------- |
| `name`        | Yes                 | camelCase                                                           |
| `displayName` | Yes                 | one key per language code                                           |
| `required`    | Yes                 | `true` \| `false`                                                   |
| `type`        | Yes                 | `int` \| `decimal` \| `string` \| `datetime` \| `boolean` \| `enum` |
| `control`     | Yes                 | see [Control types](#control-types-and-input-formats)               |
| `inputFormat` | No                  | `financial` \| `percentage` \| `uppercase` (only where needed)      |
| `choices`     | No (Yes for `enum`) | list of `{ value, displayName }`                                    |

No other keys are allowed on a field. Field order in `fields` is the default display order when `layout` is omitted.

### Naming derived from a module

| Placeholder      | Derived from            | Example                                                                                                                                                              |
| ---------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{module-name}`  | `module-name`           | `customers` — used in routes `/{module-name}`, `/{module-name}/create`, `/{module-name}/:id`, API `/api/{module-name}`, frontend folder `src/modules/{module-name}/` |
| `{Entity}`       | `entity.name`           | `Customer` — `{Entity}Dto`, `Create{Entity}Command`, `{Entity}ListPage`, `use{Entity}List`                                                                           |
| `{EntityPlural}` | plural of `entity.name` | `Customers` — `{EntityPlural}Controller`                                                                                                                             |

---

## Data types

| YAML `type` | Usable on custom fields                    | Notes              |
| ----------- | ------------------------------------------ | ------------------ |
| `int`       | Yes                                        |                    |
| `decimal`   | Yes                                        |                    |
| `string`    | Yes                                        |                    |
| `datetime`  | Yes                                        | timezone-aware     |
| `boolean`   | Yes                                        |                    |
| `enum`      | Yes                                        | `choices` required |
| `guid`      | **No** — reserved for system fields (`id`) |                    |

---

## Control types and input formats

| `control`     | Compatible types | Description                               | Suggested default for |
| ------------- | ---------------- | ----------------------------------------- | --------------------- |
| `textfield`   | `string`         | Single-line text input                    | `string`              |
| `textarea`    | `string`         | Multiline text input                      | —                     |
| `numberfield` | `int`, `decimal` | Numeric input                             | `int`, `decimal`      |
| `checkbox`    | `boolean`        | Checked/unchecked toggle                  | `boolean`             |
| `radiogroup`  | `string`, `enum` | Mutually exclusive options from `choices` | `enum` (alternative)  |
| `select`      | `string`, `enum` | Dropdown from `choices`                   | `enum` (default)      |
| `datepicker`  | `datetime`       | Date and/or time picker                   | `datetime`            |

System field `id` (type `guid`) uses `textfield` — a system-only exception to the compatibility table.

| `inputFormat` | Description          | Example     |
| ------------- | -------------------- | ----------- |
| `financial`   | Currency formatting  | `$1,234.56` |
| `percentage`  | Percentage mask      | `15%`       |
| `uppercase`   | Auto-uppercase input | `HELLO`     |

Not every control supports `inputFormat`; use it only on fields that need it.

---

## choices and enum fields

```yaml
- name: status
  type: enum
  required: true
  control: select
  choices:
    - value: Active
      displayName: { en: Active, fr: Actif }
    - value: Inactive
      displayName: { en: Inactive, fr: Inactif }
```

- Each choice has `value` (stored/serialized value, must match the field's `type`) and `displayName` (one entry per language).
- `choices` is optional for every type — omit it when options come from the backend at runtime — **except** `type: enum`, where it is required (members must be known at generation time).
- For `enum`, `value` is a **PascalCase** enum member (`Active`, `InProgress`); it is what the API persists and returns. For `string` + `select`, values may be any string (e.g. `active`).
- Never display the raw `value`: consumers translate it via i18n keys `enums.<field>.<value>` seeded from `displayName`, reused by list columns and select/radio controls.

| Layer      | Enum representation                                |
| ---------- | -------------------------------------------------- |
| YAML       | `enum` with `choices: [{ value, displayName }]`    |
| C#         | `enum` type + `[EnumMember]` attributes            |
| SQL        | `NVARCHAR(50) NOT NULL` (stored as text)           |
| TypeScript | String literal union type                          |
| Zod        | `z.enum([...choices from YAML])`                   |
| i18n       | `displayName` per choice → `enums.<field>.<value>` |

---

## Layout

Optional per-entity block controlling which fields appear in each view and in what order. Fields not listed in a view are hidden from that view.

| Sub-key         | Meaning                                                                                    | Allowed names                                                  |
| --------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `layout.list`   | Ordered columns of the list/table view                                                     | `fields` names + system field names                            |
| `layout.create` | Ordered fields of the create form; all editable                                            | `fields` names only                                            |
| `layout.edit`   | Ordered fields of the edit form; each entry `fieldName: editable` or `fieldName: readonly` | `fields` names + system field names (system → `readonly` only) |

- When `layout` is omitted: all user-defined fields appear in declaration order in every view, editable in create/edit; system-field restrictions still apply.
- A regular field may be `readonly` in `edit` (e.g. locked after creation).
- "Recognized system field name" = any key declared in `system-fields.yaml`.

```yaml
layout:
  list: [id, firstName, isActive, status]
  create: [firstName, email, salary, isActive, status, priority, birthDate]
  edit:
    - firstName: editable
    - email: readonly # regular field locked after creation
    - createdAt: readonly # system field — readonly only
```

There is no separate `find`/`delete` layout section; operations scaffolded per module are list, find, create, update and delete (delete is a per-row soft delete from the list page).

---

## Relationships and lookups

The schema defines **no** relationship, foreign-key or lookup construct: there is no reference type, no lookup control, and `guid` is forbidden on custom fields. Options for `select`/`radiogroup` come either from a static `choices` list or "from the backend at runtime" (by omitting `choices`), but no YAML contract describes that backend source.

---

## Type mapping across the stack

| YAML type  | C#               | SQL Server         | TypeScript                      | Zod                | Default form control     | Notes                                               |
| ---------- | ---------------- | ------------------ | ------------------------------- | ------------------ | ------------------------ | --------------------------------------------------- |
| `int`      | `int`            | `INT`              | `number`                        | `z.number().int()` | `numberfield`            |                                                     |
| `decimal`  | `decimal`        | `DECIMAL(18,2)`    | `number`                        | `z.number()`       | `numberfield`            | default; `precision`/`scale` to override            |
| `string`   | `string`         | `NVARCHAR(256)`    | `string`                        | `z.string()`       | `textfield` / `textarea` | default; `maxLength` to override                    |
| `datetime` | `DateTimeOffset` | `DATETIMEOFFSET`   | `string`                        | `z.coerce.date()`  | `datepicker`             | timezone-aware; ISO 8601 in frontend                |
| `boolean`  | `bool`           | `BIT`              | `boolean`                       | `z.boolean()`      | `checkbox`               |                                                     |
| `enum`     | `string` (enum)  | `NVARCHAR(50)`     | `string` (enum) / literal union | `z.enum([...])`    | `select` / `radiogroup`  | stored as text                                      |
| `guid`     | `Guid`           | `UNIQUEIDENTIFIER` | `string`                        | `z.uuid()`         | `textfield`              | system only; `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |

### Nullability

| YAML `required` | SQL        | C#             |
| --------------- | ---------- | -------------- |
| `true`          | `NOT NULL` | non-nullable   |
| `false`         | `NULL`     | nullable (`?`) |

### SQL defaults

| Column                                                          | SQL DEFAULT                       |
| --------------------------------------------------------------- | --------------------------------- |
| `UNIQUEIDENTIFIER` primary key (`id`)                           | `DEFAULT NEWSEQUENTIALID()`       |
| All other columns (incl. `defaultValue`/`computedValue` fields) | None — managed by the application |

---

## Validation rules

Collect **all** violations (do not stop at the first), group them by file, and suggest unambiguous corrections. Severity: `ERROR` = violates schema, generation will likely fail or be incorrect; `WARN` = unexpected/unrecognized but may be processable (e.g. unknown keys).

Preconditions: `project.yaml` must exist (otherwise nothing to validate); a missing `system-fields.yaml` is reported but other files are still validated.

### project.yaml rules

| Rule                                                                                       | Error message                                                                                                                                |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `project-name` present                                                                     | Missing required field `project-name`                                                                                                        |
| `project-name` kebab-case                                                                  | `project-name` must be kebab-case (e.g. `my-sales-app`)                                                                                      |
| Each segment starts with a letter                                                          | `project-name` segment `{segment}` must start with a letter (it becomes a C# namespace segment)                                              |
| `description` present                                                                      | Missing required field `description`                                                                                                         |
| `displayName` present                                                                      | Missing required field `displayName`                                                                                                         |
| `displayName` covers every language                                                        | `displayName` is missing language `{code}`                                                                                                   |
| `languages` present, non-empty                                                             | Missing or empty `languages` list                                                                                                            |
| `modules` present, non-empty                                                               | Missing or empty `modules` list                                                                                                              |
| Every `modules` path exists                                                                | Module file not found: `{path}`                                                                                                              |
| `branding.primaryColor` matches `#RRGGBB`                                                  | `branding.primaryColor` must be a hex color code (e.g. `#1976D2`)                                                                            |
| `branding.secondaryColor` matches `#RRGGBB`                                                | `branding.secondaryColor` must be a hex color code (e.g. `#FF5722`)                                                                          |
| `azure` present ⇒ `environments` non-empty                                                 | `azure.environments` must be a non-empty list when `azure` is present                                                                        |
| Not both `infrastructure` and `pipeline` `false`                                           | `azure` scaffolds nothing when `infrastructure` and `pipeline` are both `false`; remove the block instead                                    |
| App name / env codes follow Azure naming rules (pattern, lowercase code, name + code ≤ 20) | `{field}` breaks the Azure naming rule: `{rule}`                                                                                             |
| Unique environment `code`                                                                  | Duplicate environment code `{code}`                                                                                                          |
| SKU rules (`F1` or Premium v3/v4; ≤ one `F1`; SQL SKU rule)                                | `azure.environments[{index}].{field}` `{value}` is not an allowed SKU, or a second `F1` environment                                          |
| Pipeline runs ⇒ every env has `serviceConnection`                                          | `azure.environments[{index}]` is missing `serviceConnection`                                                                                 |
| `resourceGroupName` only when `infrastructure: false`                                      | `azure.environments[{index}].resourceGroupName` is derived as `{applicationName}-{code}-rg` when the infrastructure is scaffolded; remove it |
| `documentation` ⇒ non-empty `customerName`                                                 | `documentation.customerName` is required when `documentation` is present                                                                     |
| `documentation` ⇒ valid `platform`                                                         | `documentation.platform` must be `azure-devops-wiki` or `github-repo-docs`                                                                   |
| `documentation.language` valid                                                             | `documentation.language` must be `english` or `french`                                                                                       |
| No unknown top-level keys                                                                  | Unrecognized field `{key}` in `project.yaml`                                                                                                 |
| Missing/partial `auth.entra`                                                               | Never an error                                                                                                                               |

### system-fields.yaml rules

The set of keys is whatever the file declares — do not check hardcoded names.

| Rule                                                                   | Error message                                                                                                                                         |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| At least one entry                                                     | `system-fields.yaml` is empty — at least one system field must be declared                                                                            |
| `displayName` present                                                  | `{key}` is missing `displayName` in `system-fields.yaml`                                                                                              |
| `displayName` covers every language                                    | `{key}.displayName` is missing language `{code}` in `system-fields.yaml`                                                                              |
| `type`, `control`, `required` present                                  | `{key}` is missing `{prop}` in `system-fields.yaml`                                                                                                   |
| `type` is a recognized data type                                       | `{key}.type` `{value}` is not a recognized data type                                                                                                  |
| `required: true` (see conflict below)                                  | `{key}.required` must be `true` — system fields are always non-nullable                                                                               |
| Only allowed properties                                                | `{key}` has unrecognized property `{prop}` in `system-fields.yaml`                                                                                    |
| `defaultValue` valid for type                                          | `{key}.defaultValue` `{value}` is not valid for type `{type}`                                                                                         |
| `computedValue` valid for type                                         | `{key}.computedValue` `{value}` is not valid for type `{type}`                                                                                        |
| Not both, unless boolean `defaultValue: false` + `computedValue: true` | `{key}` cannot have both `defaultValue` and `computedValue` unless it is a `boolean` field combining `defaultValue: false` with `computedValue: true` |

### Module file rules

| Rule                                                   | Error message                                                                                                                     |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `module-name` present                                  | Missing required field `module-name`                                                                                              |
| `module-name` kebab-case                               | `module-name` must be kebab-case                                                                                                  |
| `module-name` = filename                               | `module-name` `{value}` does not match filename `{filename}`                                                                      |
| `icon` present, non-empty                              | Missing required field `icon` / `icon` must be a non-empty string (MUI icon name)                                                 |
| `icon` is a real MUI icon                              | `icon '<value>' is not a recognized @mui/icons-material icon — check https://mui.com/material-ui/material-icons/ for valid names` |
| `entity` present                                       | Missing required field `entity`                                                                                                   |
| `entity.name` PascalCase                               | `entity.name` must be PascalCase (e.g. `Customer`)                                                                                |
| `entity.displayName` present and covers every language | Missing required field `entity.displayName` / `entity.displayName` is missing language `{code}`                                   |
| `entity.fields` non-empty                              | `entity.fields` is missing or empty                                                                                               |
| `systemFields` present and equals `system-fields.yaml` | Missing required field `systemFields` / `systemFields` must be `system-fields.yaml` (path reference, not an inline block)         |

### Per-field rules

| Rule                                             | Error message                                                                          |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `name` camelCase                                 | `fields[{i}].name` must be camelCase                                                   |
| `displayName` present, covers every language     | `{name}` is missing `displayName` / `{name}.displayName` is missing language `{code}`  |
| `required` boolean                               | `{name}.required` must be `true` or `false`                                            |
| `type` recognized                                | `{name}.type` `{value}` is not a recognized data type                                  |
| `type` not `guid`                                | `{name}.type` `guid` is reserved for system fields and cannot be used on custom fields |
| `control` recognized                             | `{name}.control` `{value}` is not a recognized control type                            |
| `control` compatible with `type`                 | `{name}.control` `{control}` is not compatible with type `{type}`                      |
| `inputFormat` recognized                         | `{name}.inputFormat` `{value}` is not a recognized format                              |
| Every choice has `value`                         | `{name}.choices[{i}]` is missing `value`                                               |
| Every choice `displayName` covers every language | `{name}.choices[{i}].displayName` is missing language `{code}`                         |
| `enum` ⇒ `choices`                               | `{name}` has `type: enum` but is missing `choices`                                     |
| No unknown keys                                  | Unrecognized field `{key}` on `{name}`                                                 |

### Layout rules

| Rule                                                     | Error message                                                                                   |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `list` names exist (fields or system)                    | `layout.list` references unknown field `{name}`                                                 |
| No duplicate in `list`                                   | `{name}` appears more than once in `layout.list`                                                |
| `create` names exist in `fields`                         | `layout.create` references unknown field `{name}`                                               |
| No duplicate in `create`                                 | `{name}` appears more than once in `layout.create`                                              |
| No system field in `create`                              | `layout.create` contains system field `{name}` — system fields are not available in create      |
| `edit` entries are single-key maps `editable`/`readonly` | `layout.edit[{i}]` must be `fieldName: editable` or `fieldName: readonly`                       |
| `edit` names exist (fields or system)                    | `layout.edit` references unknown field `{name}`                                                 |
| No duplicate in `edit`                                   | `{name}` appears more than once in `layout.edit`                                                |
| System fields in `edit` are `readonly`                   | `layout.edit` contains system field `{name}` with `editable` — system fields must be `readonly` |

---

## Project naming derivations

Both names come from `project-name` (kebab-case) and must be **derived, never asked** when `project-name` is available.

| Form                 | Derivation                                                  | Example                 | Used for                                                                                                                                                                                    |
| -------------------- | ----------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<root-namespace>`   | Each hyphen-separated segment in PascalCase, joined by dots | `acme-app` → `Acme.App` | .NET solution `<root-namespace>.slnx`; projects `<root-namespace>.Api`, `.Application`, `.Domain`, `.Infrastructure`, `.UnitTests`, `.Database`; C# namespaces; database name (`AcmeAppDb`) |
| `<application-name>` | `project-name` unchanged                                    | `acme-app`              | Azure DevOps pipeline application name, Bicep `applicationName` default, Azure resource and resource group names, API URLs, Entra app registration prefix                                   |

- Without `project.yaml` (existing backend): `<application-name>` = `<root-namespace>` lowercased with dots → hyphens (`Acme.App` → `acme-app`).
- Each segment must start with a letter since it becomes a C# identifier: `sales-v2` → `Sales.V2` (valid); `sales-2024` → `Sales.2024` (invalid).

---

## Azure deployment derivations

`<app>` = `azure.applicationName`, else `<application-name>`. `<code>` = an environment's `code`.

| Step                                  | Runs when                                                 |
| ------------------------------------- | --------------------------------------------------------- |
| Infrastructure (Bicep, `infra/`)      | `azure` present and `azure.infrastructure` is not `false` |
| Pipeline (Azure DevOps, `pipelines/`) | `azure` present and `azure.pipeline` is not `false`       |

| Value                    | Derivation                                                                                                                                           | Example (`acme-app`, `dev`)                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Location                 | `azure.location`, default `canadaeast`                                                                                                               | `canadaeast`                                         |
| Environment display name | `name`, default `<code>` with first letter uppercased                                                                                                | `Dev`                                                |
| Resource group           | `<app>-<code>-rg`; `resourceGroupName` may replace it only when `infrastructure: false`                                                              | `acme-app-dev-rg`                                    |
| Backend App Service      | `<app>-<code>-app-api`                                                                                                                               | `acme-app-dev-app-api`                               |
| Frontend App Service     | `<app>-<code>-app-web`                                                                                                                               | `acme-app-dev-app-web`                               |
| Key Vault                | `<app>-<code>-kv` (≤ 24 chars)                                                                                                                       | `acme-app-dev-kv`                                    |
| Frontend `API_URL`       | `https://<app>-<code>-app-api.azurewebsites.net/api`                                                                                                 | `https://acme-app-dev-app-api.azurewebsites.net/api` |
| App Service plan SKU     | `appServicePlanSku`; default `F1` first env, `P0v3` others                                                                                           | `F1`                                                 |
| Deployment slots         | `true` unless SKU is `F1` (free tier has none; Premium v3/v4 have them)                                                                              | `false`                                              |
| SQL database SKU         | `sqlDatabaseSku`; default `Basic` first env, `GP_S_Gen5_1` others. Tier: `Basic`→`Basic`, `S*`→`Standard`, `P*`→`Premium`, `GP_S_*`→`GeneralPurpose` | `{ name: 'Basic', tier: 'Basic' }`                   |
| SQL serverless settings  | `GP_S_*` only: `sqlAutoPauseDelay` `-1` (never pause), `sqlMinCapacity` `'0.5'`                                                                      | —                                                    |
| `ASPNETCORE_ENVIRONMENT` | `<code>` with first letter uppercased, matching `appsettings.<Env>.json` (`Dev`, `Uat`, `Prod`)                                                      | `Dev`                                                |
| Bicep parameter file     | `main.<code>.bicepparam` (code used unchanged; case-sensitive on Linux agents)                                                                       | `main.dev.bicepparam`                                |

Rules:

- `<app>` matches `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`.
- `<code>` contains only lowercase letters and digits.
- `<app>` + `<code>` ≤ 20 characters.
- `appServicePlanSku` is `F1` or Premium v3/v4 (`P0v3`, `P1v3`, `P1mv3`, `P1v4`…). Rejected: Basic `B*`, Standard `S*`, Premium v1 `P1`–`P3`, Premium v2 `P*v2`.
- At most one environment uses `F1` (one free Linux plan per region and subscription).
- Environments in promotion order, dev first.
- `sqlDatabaseSku`: first env `Basic`, `S0`–`S12`, `P1`–`P15` or `GP_S_Gen5_<n>`; other envs `GP_S_Gen5_<n>` or `S3`–`S12`, `P1`–`P15`. `Basic`, `S0`, `S1`, `S2` never outside dev.
- `serviceConnection` required on every environment when the pipeline step runs.

Database: the backend reads connection string `DefaultConnection`. Infrastructure sets it on the backend App Service without password (`Authentication=Active Directory Default`) using the app's user-assigned identity. After the first deployment of each environment, a member of `azure.sqlAdminGroup` creates the app identity's database user with T-SQL.

---

## Output locations and backend root resolution

- Default output root is `/output.local` at the repository root unless specified: `/output.local/frontend` and `/output.local/backend`. When a `<target-folder>` is provided, generated code goes to `<target-folder>/backend/` and `<target-folder>/frontend/`.

Backend root resolution order:

1. Use `<backend-folder>` if provided by an orchestrator.
2. Otherwise prefer `output.local/backend/` when it contains the .NET solution.
3. Otherwise ask the user, or locate the backend root by finding the clean-architecture projects (`*.Api`, `*.Application`, `*.Domain`, `*.Infrastructure`), whichever fits the calling flow.

---

## Canonical examples

### Example project.yaml

```yaml
project-name: acme-app
description: Acme App - built with the Nexus ing-launchpad structure and functionality.
languages: [en, fr]
displayName:
  en: Acme App
  fr: Application Acme
modules:
  - modules/orders.yaml
  - modules/customers.yaml
  - modules/products.yaml
  - modules/forms.yaml
  - modules/settings.yaml
auth:
  entra:
    tenant-id: "<tenant-id>"
# azure:
#   environments:
#     - code: "dev"
#       appServicePlanSku: "F1"
#       serviceConnection: "<dev-service-connection>"
#     - code: "prod"
#       name: "Production"
#       appServicePlanSku: "P0v3"
#       sqlDatabaseSku: "GP_S_Gen5_1"
#       serviceConnection: "<prod-service-connection>"
# documentation:
#   customerName: "<customer-name>"
#   platform: "azure-devops-wiki"
```

### Example module (orders.yaml)

```yaml
module-name: orders
icon: ShoppingCartRounded
cardDescription:
  en: Track and manage customer orders
  fr: Suivre et gérer les commandes clients
entity:
  name: Order
  displayName: { en: Order, fr: Commande }
  systemFields: system-fields.yaml
  fields:
    - name: orderNumber
      displayName: { en: Order Number, fr: Numéro de commande }
      required: true
      type: string
      control: textfield
    - name: status
      displayName: { en: Status, fr: Statut }
      required: true
      type: enum
      control: select
      choices:
        - value: Pending
          displayName: { en: Pending, fr: En attente }
        - value: InProgress
          displayName: { en: In Progress, fr: En cours }
    - name: totalAmount
      displayName: { en: Total Amount, fr: Montant total }
      required: true
      type: decimal
      control: numberfield
      inputFormat: financial
    - name: orderDate
      displayName: { en: Order Date, fr: Date de commande }
      required: true
      type: datetime
      control: datepicker
  layout:
    list: [id, orderNumber, status, totalAmount, orderDate]
    create: [orderNumber, status, totalAmount, orderDate]
    edit:
      - orderNumber: editable
      - status: editable
      - totalAmount: editable
      - orderDate: editable
      - createdAt: readonly
      - createdBy: readonly
```

Other example modules follow the same shape: `customers` (`Customer`, icon `PeopleRounded`), `products` (`Product`, `InventoryRounded`, `int` stock, `textarea` description), `forms` (`Form`, `DescriptionRounded`), `settings` (`Setting`, `SettingsRounded`).

---

## Known conflicts and gaps

- **System field `required`:** the schema and example files declare `deletedAt`/`deletedBy` with `required: false`, but the system-fields validation rule requires `required: true` on every system field. The soft-delete pair is the intended exception.
- **System field list in layout/visibility:** the schema's System Fields table and the "names available for layout" list only name `id`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, while `system-fields.yaml` also declares `isDeleted`, `deletedAt`, `deletedBy`; validation treats any key declared in `system-fields.yaml` as a system field name.
- **`edit` default `hidden`:** the System Fields table uses `hidden` as an edit default, a value not allowed in `layout.edit` (only `editable`/`readonly`); it means "not listed".
- **`defaultValue` / `computedValue` C# mapping:** schema says `DateTimeOffset.UtcNow` / "current user identity"; type mapping says `TimeProvider.GetUtcNow()` / `IAuthenticatedUserService.GetAuthenticatedUser()`.
- **`maxLength` / `precision` / `scale`:** the type mapping mentions them as overrides for `string`/`decimal`, but the module schema does not declare them and validation rejects unknown field keys.
- **Module name plurality:** schema examples use singular (`customer`, `modules/customer.yaml`), the example input uses plural (`customers`, `orders`); both are kebab-case and must match the filename.
- **Per-module operation selection:** the readme says module files describe "which operations (list, create, update) to scaffold", but the schema has no such key; all operations are scaffolded.
- **Relationships/lookups:** not defined by the schema (see [Relationships and lookups](#relationships-and-lookups)).
- **Language codes:** only `en` and `fr` are illustrated; other codes are allowed as long as every `displayName` covers them.

---

## Sources

- `generate-input-launchpad`
- `standards-launchpad`
- launchpad plugin `input/` examples, `.github/copilot-instructions.md`, and `readme.md`

Extracted from NexusInnovation/nexus-plugin-marketplace plugins/launchpad on 2026-11-24.
