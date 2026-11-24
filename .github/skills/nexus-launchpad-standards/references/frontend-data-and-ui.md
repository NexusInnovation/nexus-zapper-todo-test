# Frontend Data Access and UI Component Standards

Canonical conventions and code for API response parsing, entity types, React Query hooks, error toasts, form field atoms, module pages, and shared UI components (AppDataGrid, ConfirmDialog, DeleteActionButton, dashboard) in a Nexus React TypeScript frontend.

## Contents

- [File Placement Summary](#file-placement-summary)
- [Shared API Response Parser](#shared-api-response-parser)
- [Entity Types, Zod Schemas and System Fields](#entity-types-zod-schemas-and-system-fields)
- [React Query Hooks per Operation](#react-query-hooks-per-operation)
- [API Error Handling and Toasts](#api-error-handling-and-toasts)
- [Form Field Atom Library](#form-field-atom-library)
- [YAML Field to Form Control Mapping](#yaml-field-to-form-control-mapping)
- [Module Pages and Routes](#module-pages-and-routes)
- [List Page](#list-page)
- [Create Page](#create-page)
- [Update Page](#update-page)
- [Delete Action](#delete-action)
- [Module i18n Keys](#module-i18n-keys)
- [AppDataGrid](#appdatagrid)
- [ConfirmDialog](#confirmdialog)
- [DeleteActionButton](#deleteactionbutton)
- [Dashboard Page](#dashboard-page)
- [Validation Commands](#validation-commands)
- [Conflicts and Gaps in Sources](#conflicts-and-gaps-in-sources)
- [Sources](#sources)

---

## File Placement Summary

| File                                                                                                                              | Purpose                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/core/api/parseResponse.ts`                                                                                                   | `parseResponse` / `parseListResponse` (Zod `safeParse`)                       |
| `src/core/types/systemFields.ts`                                                                                                  | Shared `systemFieldsSchema` + `SystemFields` (once per project)               |
| `src/core/errors/ApiError.ts`                                                                                                     | `ApiError` interface + `toApiError`                                           |
| `src/core/components/ErrorToastContext.ts`                                                                                        | `ErrorToastContext`                                                           |
| `src/core/components/ErrorToastProvider.tsx`                                                                                      | `ErrorToastProvider` (MUI Snackbar toasts)                                    |
| `src/core/hooks/useErrorToast.ts`                                                                                                 | `useErrorToast` hook                                                          |
| `src/core/components/SuccessToastContext.ts`, `src/core/components/SuccessToastProvider.tsx`, `src/core/hooks/useSuccessToast.ts` | Success toast (same pattern as error toast)                                   |
| `src/core/providers/QueryProvider.tsx`                                                                                            | `QueryClientProvider` with global `QueryCache`/`MutationCache` error handlers |
| `src/core/providers/AppLocalizationProvider.tsx`                                                                                  | MUI `LocalizationProvider` (date-fns, language-aware)                         |
| `src/core/auth/apiFetch.ts`                                                                                                       | Authenticated fetch used by every hook (prerequisite)                         |
| `src/core/components/molecules/AppDataGrid/AppDataGrid.tsx`                                                                       | Generic grid                                                                  |
| `src/core/components/molecules/AppDataGrid/DataGridEmptyState.tsx`                                                                | Empty overlay                                                                 |
| `src/core/components/molecules/AppDataGrid/AppDataGrid.test.tsx`                                                                  | Smoke tests (when test stack exists)                                          |
| `src/core/components/molecules/ConfirmDialog/ConfirmDialog.tsx` (+ `.test.tsx`)                                                   | Reusable confirmation dialog                                                  |
| `src/core/components/atoms/DeleteActionButton/DeleteActionButton.tsx`                                                             | Per-row delete trigger                                                        |
| `src/core/components/atoms/EditActionLinkButton/EditActionLinkButton.tsx`                                                         | Per-row edit link (`IconButton + Link + EditRoundedIcon`)                     |
| `src/core/components/atoms/CreateActionLinkButton/CreateActionLinkButton.tsx`                                                     | Create CTA (`Button + Link + AddRoundedIcon`)                                 |
| `src/components/atoms/form/SelectOption.ts`, `Form.tsx`                                                                           | Form root + option type                                                       |
| `src/components/atoms/textfield/{TextField,NumberField,MultilineTextField}.tsx`                                                   | Text atoms                                                                    |
| `src/components/atoms/datepicker/DatePicker.tsx`                                                                                  | Date atom                                                                     |
| `src/components/atoms/checkbox/Checkbox.tsx`                                                                                      | Checkbox atom                                                                 |
| `src/components/atoms/radio/{Radio,RadioGroup}.tsx`                                                                               | Radio atoms                                                                   |
| `src/components/atoms/select/Select.tsx`                                                                                          | Select atom                                                                   |
| `src/components/atoms/autocomplete/Autocomplete.tsx`                                                                              | Autocomplete atom                                                             |
| `src/modules/{module-name}/types/{Entity}.ts`                                                                                     | `{Entity}Schema` + `{Entity}` type                                            |
| `src/modules/{module-name}/hooks/use{Entity}{List,Find,Create,Update,Delete}.ts`                                                  | Per-operation hooks                                                           |
| `src/modules/{module-name}/{Entity}ListPage/{Entity}ListPage.tsx`                                                                 | List page                                                                     |
| `src/modules/{module-name}/{Entity}CreatePage/{Entity}CreatePage.tsx`                                                             | Create page                                                                   |
| `src/modules/{module-name}/{Entity}UpdatePage/{Entity}UpdatePage.tsx`                                                             | Update page                                                                   |
| `public/locales/{lang}/{module-name}.json`                                                                                        | Module namespace translations                                                 |

Naming: `{module-name}` is kebab-case (also the route segment, query key and API path, e.g. `orders`); `{Entity}` is PascalCase (e.g. `Order`). Example: `src/modules/orders/OrderListPage/OrderListPage.tsx`.

---

## Shared API Response Parser

Rules:

- Lives at `src/core/api/parseResponse.ts`; exports `parseResponse` (single object) and `parseListResponse` (array).
- Uses Zod `safeParse`. On mismatch: **log** the `ZodError` (`console.error`) and **return the raw data cast to `T`**. Never throw on schema drift — drift is a diagnostic signal, not a fatal error, so an additive/temporary backend schema change does not break the UI.
- Transport errors (non-OK HTTP) are handled by the caller (the hook), not the parser.
- `parseListResponse` delegates to `parseResponse` with `schema.array()`.
- Requires `zod` (part of the standard runtime package baseline).
- Hooks use `parseListResponse` for arrays and `parseResponse` for single objects — never a raw cast or `schema.parse()`.

```ts
import type { ZodType } from "zod";

/**
 * Validates an API response against the provided schema.
 *
 * Schema drift is treated as a diagnostic signal, not a fatal error: on a
 * validation failure the `ZodError` is logged and the raw data is returned cast
 * to `T`, so an additive or temporary backend schema change does not break the
 * UI. Transport errors (non-OK responses) are handled by the caller, not here.
 */
export function parseResponse<T>(
  schema: ZodType<T>,
  data: unknown,
  label: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`${label} response failed schema validation`, result.error);
    return data as T;
  }
  return result.data;
}

/** Convenience wrapper around {@link parseResponse} for list (array) responses. */
export function parseListResponse<T>(
  schema: ZodType<T>,
  data: unknown,
  label: string,
): T[] {
  return parseResponse(schema.array(), data, label);
}
```

---

## Entity Types, Zod Schemas and System Fields

Rules:

- The Zod schema is the single source of truth; the TypeScript type is derived with `z.infer` — never declared manually.
- System fields are defined **once per project** in `src/core/types/systemFields.ts` (`systemFieldsSchema`, `SystemFields`). Each entity schema **extends** `systemFieldsSchema` and emits **only** module fields inside `.extend({ ... })`.
- System fields come from the system-fields YAML referenced by `entity.systemFields` (always declared). Emit one line per system field, in file order.
- Module fields come from `entity.fields`, one line per field, in YAML order. Property name = field `name` (camelCase as written in YAML).
- Every Zod primitive is derived from the field's YAML `type` via the central Data Types table (Zod primitive column) — never hardcoded (including `id`, whose `type: guid` maps via the table).
- `enum` fields: `fieldName: z.enum(['Value1', 'Value2', ...])` from the field's `choices` (inferred type is the string union).
- Nullability: append `.nullish()` **only** when `required: false` is explicitly set; default is required. Backend DTOs serialize nullable fields as JSON `null`, so response schemas must accept both `null` and an omitted property.
- Ignore `defaultValue` and `computedValue` on system fields — they are backend generation metadata and do not change the Zod type (e.g. `defaultValue: now` with `type: datetime` still maps to `z.coerce.date()`).

`src/core/types/systemFields.ts`:

```ts
import { z } from "zod";

export const systemFieldsSchema = z.object({
  // System fields — emit one line per entry in the referenced system-fields YAML,
  // in file order, with the Zod primitive mapped from each field's `type`
  // (via the Data Types table). Do NOT hardcode the field set or their types:
  // <systemFieldName>: <zodPrimitive>
});

export type SystemFields = z.infer<typeof systemFieldsSchema>;
```

`src/modules/{module-name}/types/{Entity}.ts`:

```ts
import { z } from 'zod'

import { systemFieldsSchema } from '@/core/types/systemFields'

export const <Entity>Schema = systemFieldsSchema.extend({
  // Module fields — emit one line per entry in the YAML `entity.fields` array,
  // in YAML order, with the Zod primitive mapped from each field's `type`
  // (via the Data Types table). Do NOT hardcode the field set or their types:
  // <fieldName>: <zodPrimitive>
})

export type <Entity> = z.infer<typeof <Entity>Schema>
```

---

## React Query Hooks per Operation

### Common rules

| Rule         | Detail                                                                                                                                                                                                                                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Location     | `src/modules/{module-name}/hooks/use{Entity}{Operation}.ts`                                                                                                                                                                                                                                                                         |
| HTTP         | Always via `apiFetch` from `@/core/auth/apiFetch`, path relative to the API root (`/{module-name}`, `/{module-name}/${id}`)                                                                                                                                                                                                         |
| Errors       | On `!response.ok`, `throw await response.json()` (raw ProblemDetails). No per-hook error handling and no `useErrorToast` in hooks — the global `QueryCache`/`MutationCache` `onError` → `toApiError` pipeline shows the toast. The throw still populates `error`/`isError` so components may also render inline error/empty states. |
| Validation   | Queries pass the JSON through `parseListResponse` / `parseResponse` with `{Entity}Schema` and label `'{Entity}'`                                                                                                                                                                                                                    |
| Query key    | Base key `['{module-name}']` (kebab-case module name); Find uses `['{module-name}', id]`                                                                                                                                                                                                                                            |
| Invalidation | Mutations invalidate `['{module-name}']` on success. React Query matches by prefix, so this also invalidates cached `use{Entity}Find` results — no separate invalidation needed.                                                                                                                                                    |

| Hook                    | Kind                                     | Request                                                  | Returns                              | Query key / invalidation                        |
| ----------------------- | ---------------------------------------- | -------------------------------------------------------- | ------------------------------------ | ----------------------------------------------- |
| `use{Entity}List()`     | `useQuery<{Entity}[]>`                   | `GET /{module-name}`                                     | `{Entity}[]` via `parseListResponse` | `['{module-name}']`                             |
| `use{Entity}Find(id)`   | `useQuery<{Entity}>`                     | `GET /{module-name}/{id}`                                | `{Entity}` via `parseResponse`       | `['{module-name}', id]`, `enabled: Boolean(id)` |
| `use{Entity}Create()`   | `useMutation`                            | `POST /{module-name}`, body `JSON.stringify(values)`     | —                                    | invalidates `['{module-name}']`                 |
| `use{Entity}Update(id)` | `useMutation`                            | `PUT /{module-name}/{id}`, body `JSON.stringify(values)` | `response.json()`                    | invalidates `['{module-name}']`                 |
| `use{Entity}Delete()`   | `useMutation` (`mutationFn(id: string)`) | `DELETE /{module-name}/{id}`                             | nothing                              | invalidates `['{module-name}']`                 |

Prerequisites: `@tanstack/react-query`, `zod`, `src/core/api/parseResponse.ts`, `src/core/errors/ApiError.ts`, `src/core/providers/QueryProvider.tsx`, `src/core/auth/apiFetch.ts`.

### `use{Entity}List`

```ts
import { useQuery } from '@tanstack/react-query'

import { apiFetch } from '@/core/auth/apiFetch'
import { parseListResponse } from '@/core/api/parseResponse'
import { <Entity>Schema, type <Entity> } from '../types/<Entity>'

export function use<Entity>List() {
  return useQuery<<Entity>[]>({
    queryKey: ['<module-name>'],
    queryFn: async () => {
      const response = await apiFetch('/<module-name>')
      if (!response.ok) {
        throw await response.json()
      }
      return parseListResponse(<Entity>Schema, await response.json(), '<Entity>')
    },
  })
}
```

### `use{Entity}Find`

`enabled: Boolean(id)` prevents the query from firing before the route param resolves. Uses the single-object `parseResponse` (not `parseListResponse`).

```ts
import { useQuery } from '@tanstack/react-query'

import { apiFetch } from '@/core/auth/apiFetch'
import { parseResponse } from '@/core/api/parseResponse'
import { <Entity>Schema, type <Entity> } from '../types/<Entity>'

export function use<Entity>Find(id: string | undefined) {
  return useQuery<<Entity>>({
    queryKey: ['<module-name>', id],
    queryFn: async () => {
      const response = await apiFetch(`/<module-name>/${id}`)
      if (!response.ok) {
        throw await response.json()
      }
      return parseResponse(<Entity>Schema, await response.json(), '<Entity>')
    },
    enabled: Boolean(id),
  })
}
```

### `use{Entity}Create`

No canonical template file; the contract is:

- export a `Create{Entity}Input` type matching the create form values, in YAML order (wire types, see [type coercion](#type-values-and-form-defaults));
- call `apiFetch('/{module-name}', { method: 'POST', body: JSON.stringify(values) })`;
- throw `await response.json()` when the response is not OK;
- invalidate `queryKey: ['{module-name}']` on success.

### `use{Entity}Update`

`Update{Entity}Input` contains **only editable** fields from `entity.layout.edit`, in YAML order — readonly fields are displayed but never submitted.

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiFetch } from '@/core/auth/apiFetch'

export type Update<Entity>Input = {
  // one property per editable field from entity.layout.edit, in YAML order
}

export function use<Entity>Update(id: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Update<Entity>Input) => {
      const response = await apiFetch(`/<module-name>/${id}`, {
        method: 'PUT',
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw await response.json()
      }

      return response.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['<module-name>'] })
    },
  })
}
```

### `use{Entity}Delete`

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "@/core/auth/apiFetch"

export function use<Entity>Delete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(`/<module-name>/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw await response.json()
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["<module-name>"] })
    },
  })
}
```

---

## API Error Handling and Toasts

Prerequisites: `@tanstack/react-query`, `@mui/material`, `react-i18next`.

### `ApiError` + `toApiError` — `src/core/errors/ApiError.ts`

```ts
export interface ApiError {
  status: number;
  errorCode: string;
  validationErrors?: Record<string, string[]>;
}

/**
 * Parses an unknown thrown value into an ApiError.
 *
 * Handles both ProblemDetails shapes the backend produces:
 *   - ValidationProblemDetails: { errors: { [field]: string[] } }
 *   - ProblemDetails with errorCode extension: { status, errorCode }
 *
 * Falls back to a 500 / 'errors.generic.unexpected' for anything unrecognised.
 */
export function toApiError(error: unknown): ApiError {
  if (error !== null && typeof error === "object") {
    const obj = error as Record<string, unknown>;

    // ValidationProblemDetails shape: { errors: { [field]: string[] } }
    if (
      obj["errors"] !== null &&
      typeof obj["errors"] === "object" &&
      !Array.isArray(obj["errors"])
    ) {
      return {
        status: 422,
        errorCode: "errors.generic.validationFailed",
        validationErrors: obj["errors"] as Record<string, string[]>,
      };
    }

    // ProblemDetails shape: { status, errorCode }
    if (typeof obj["errorCode"] === "string") {
      const status = typeof obj["status"] === "number" ? obj["status"] : 500;
      return { status, errorCode: obj["errorCode"] };
    }
  }

  return { status: 500, errorCode: "errors.generic.unexpected" };
}
```

| Input shape                                             | Result                                                                            |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `{ errors: { [field]: string[] } }` (object, not array) | `{ status: 422, errorCode: 'errors.generic.validationFailed', validationErrors }` |
| `{ status?, errorCode: string }`                        | `{ status (default 500), errorCode }`                                             |
| anything else                                           | `{ status: 500, errorCode: 'errors.generic.unexpected' }`                         |

Design rules:

- `ApiError` is a plain interface, never thrown — no `extends Error`.
- `errors` detection excludes arrays to avoid false positives on other shapes.
- `toApiError` is a dependency-free plain function (usable in tests, interceptors, query callbacks without mocking).
- Custom `fetch`/`axios` layers must throw an object matching the ProblemDetails shape.
- Error codes pass through unfiltered — adding a backend error code requires **no code change**, only i18n entries.

### Error toast context, provider, hook

`src/core/components/ErrorToastContext.ts`:

```ts
import { createContext } from "react";

export type ErrorToastContextValue = {
  addError: (errorCode: string) => void;
};

export const ErrorToastContext = createContext<ErrorToastContextValue | null>(
  null,
);
```

`src/core/components/ErrorToastProvider.tsx`:

```tsx
import { Alert, Snackbar } from "@mui/material";
import { type ReactNode, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { ErrorToastContext } from "./ErrorToastContext";

type Toast = { id: string; errorCode: string };

type ErrorToastProviderProps = { children: ReactNode };

export function ErrorToastProvider({ children }: ErrorToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { t } = useTranslation("common");

  const addError = useCallback((errorCode: string) => {
    setToasts((prev) => [...prev, { id: crypto.randomUUID(), errorCode }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ErrorToastContext.Provider value={{ addError }}>
      {children}
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open
          anchorOrigin={{
            vertical: "<anchorVertical>",
            horizontal: "<anchorHorizontal>",
          }}
          onClose={() => dismiss(toast.id)}
        >
          <Alert severity="error" onClose={() => dismiss(toast.id)}>
            {(t as (key: string) => string)(toast.errorCode)}
          </Alert>
        </Snackbar>
      ))}
    </ErrorToastContext.Provider>
  );
}
```

| Placeholder          | Values                    | Default  |
| -------------------- | ------------------------- | -------- |
| `<anchorVertical>`   | `top`, `bottom`           | `bottom` |
| `<anchorHorizontal>` | `left`, `center`, `right` | `right`  |

Design rules:

- Toasts stack; each is individually dismissible. No `autoHideDuration` — toasts persist until closed.
- Error codes are resolved through i18n in the `common` namespace; `t` is cast to `(key: string) => string` because codes are dynamic strings (safe because every registered code has locale entries).
- `crypto.randomUUID()` for ids (no polyfill).
- `useErrorToast` (in `src/core/hooks/useErrorToast.ts`) reads `ErrorToastContext` and **throws if called outside `ErrorToastProvider`** — intentional, surfaces misconfigured trees at dev time. Each of the three files has a single export.

### Success toast

The update flow uses `useSuccessToast()` (`const { addSuccess } = useSuccessToast()`, imported from `@/core/hooks/useSuccessToast`). If absent, create `src/core/components/SuccessToastContext.ts`, `src/core/components/SuccessToastProvider.tsx` and `src/core/hooks/useSuccessToast.ts` following the error-toast pattern, with severity `success` and a plain `message` (no error-code lookup), and mount `<SuccessToastProvider>` in `main.tsx` alongside `<ErrorToastProvider>`.

### `QueryProvider` — `src/core/providers/QueryProvider.tsx`

```tsx
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { toApiError } from "../errors/ApiError";
import { useErrorToast } from "../components/ErrorToastProvider";

type QueryProviderProps = { children: ReactNode };

export function QueryProvider({ children }: QueryProviderProps) {
  const { addError } = useErrorToast();
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            addError(toApiError(error).errorCode);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            addError(toApiError(error).errorCode);
          },
        }),
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

Design rules:

- `useState` lazy initializer creates a stable `QueryClient` once (not the `useRef` mutation-during-render anti-pattern).
- `QueryProvider` **must** render inside `ErrorToastProvider`.
- Both `QueryCache` and `MutationCache` `onError` normalise any thrown value to an error code — no per-query/per-mutation toast handling.
- Do **not** add `ReactQueryDevtools` here (teams may add it as a dev-only import in `App`/`main`).

### `main.tsx` wiring

```tsx
<ErrorBoundary>
  <ErrorToastProvider>
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  </ErrorToastProvider>
</ErrorBoundary>
```

```tsx
import { ErrorToastProvider } from "./core/components/ErrorToastProvider";
import { QueryProvider } from "./core/providers/QueryProvider";
```

`AppLocalizationProvider` is the outermost wrapper inside `<StrictMode>` (see [DatePicker](#datepicker)).

### Error i18n entries

Optional typed interface (only if `src/i18n/config.ts` has an `AppResources`-style interface), under `common`:

```ts
errors: {
  generic: {
    unexpected: string;
    notFound: string;
    conflict: string;
    validationFailed: string;
  }
}
```

`public/locales/en/common.json`:

```json
"errors": {
  "generic": {
    "unexpected": "An unexpected error occurred.",
    "notFound": "The requested resource was not found.",
    "conflict": "A conflict occurred. The resource may already exist.",
    "validationFailed": "The request contained invalid data."
  }
}
```

`public/locales/fr/common.json`:

```json
"errors": {
  "generic": {
    "unexpected": "Une erreur inattendue s'est produite.",
    "notFound": "La ressource demandée est introuvable.",
    "conflict": "Un conflit est survenu. La ressource existe peut-être déjà.",
    "validationFailed": "La requête contient des données invalides."
  }
}
```

### Adding an error code

- The code is a dot-path string (e.g. `errors.payment.required`) and must match the backend `DomainErrors` constant **exactly** (shared between backend and frontend).
- Only i18n changes: add the key under the matching nested path in `public/locales/en/common.json` and `public/locales/fr/common.json`; if a typed interface exists in `src/i18n/config.ts`, nest it under `errors` (e.g. `errors: { payment: { required: string } }`).
- Missing French translation placeholder: `"TODO: French translation for <error-code>"`.
- Full-stack: backend adds the exception class (name ends in `Exception`), HTTP status, `DomainErrors.<NestedClass>` constant (use `Generic` only for truly cross-feature errors); backend maps domain exceptions to ProblemDetails / ValidationProblemDetails (404 / 409 / 422), unknown exceptions fall through to 500.

### Error toast test conventions

When `vitest.config.ts` exists, `src/test/error-toast-provider.test.tsx` (`describe`/`it`, sentence-style names) covers: (1) `addError('errors.generic.unexpected')` via `useErrorToast` shows the toast text; (2) clicking the close button removes it. Use vitest-native matchers only — **no** `@testing-library/jest-dom`; presence via `screen.getByText` or `queryByText(...)).not.toBeNull()`, absence via `queryByText(...)).toBeNull()`; add no packages.

---

## Form Field Atom Library

Runtime dependencies: `react-hook-form`, `@hookform/resolvers`, `@mui/x-date-pickers`, `date-fns` (plus `@mui/material`).

### Core design rules

| Rule                                     | Detail                                                                                                                                                                                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RHF wiring lives inside the atom, always | Every atom uses `useFormContext()` + `useController({ name, control, rules })`. Call sites pass only `name`, a label and field-specific props — no `Controller` wrappers, no `checked={props.value}`, no `onChange` boilerplate.       |
| `ref` → `inputRef`                       | `ref` from `useController` is passed as `inputRef` so MUI can focus the field on validation error.                                                                                                                                     |
| Error display                            | `fieldState.error?.message` drives `error` + `helperText` and always takes priority over caller `helperText`; otherwise caller `helperText` shows as-is.                                                                               |
| Reserved helper line                     | Atoms default `helperText` to `" "` so showing an error does not shift nearby fields.                                                                                                                                                  |
| `size="small"`                           | Default on all atoms; callers may override with `size="medium"`.                                                                                                                                                                       |
| Native validation off                    | `<Form>` sets `noValidate` by default so RHF errors render as MUI helper text, not browser popovers.                                                                                                                                   |
| Required marker                          | MUI `required` may be passed for the visible marker, but validation messages must come from RHF `rules` or a resolver.                                                                                                                 |
| Validation                               | Inline `rules` for simple constraints; `zodResolver` passed to `useForm` for schema/cross-field validation (then omit `rules`).                                                                                                        |
| Readonly (text-like, date)               | `readOnly` prop: non-editable, non-focusable (`tabIndex: -1`, blur on focus, mousedown prevented), label shrunk, default cursor, neutral border on hover/focus; DatePicker also disables the open-picker button and section selection. |
| Default exports                          | Atoms are default exports; `SelectOption` is a named type export.                                                                                                                                                                      |

Full form example:

```tsx
<Form formMethods={formMethods} onSubmit={handleSubmit}>
  <TextField name="firstName" label="First name" />
  <NumberField name="age" label="Age" />
  <MultilineTextField name="notes" label="Notes" minRows={3} />
  <DatePicker name="birthDate" label="Birth date" />
  <Checkbox name="termsAccepted" label="I accept the terms" />
  <RadioGroup name="contactPreference">
    <FormControlLabel value="email" control={<Radio />} label="Email" />
    <FormControlLabel value="phone" control={<Radio />} label="Phone" />
  </RadioGroup>
  <Select name="country" label="Country" options={countryOptions} />
  <Autocomplete name="city" label="City" options={cityOptions} />
</Form>
```

Shared RHF pattern:

```tsx
const { control } = useFormContext();
const {
  field: { ref, ...field },
  fieldState,
} = useController({ name, control, rules });
```

### Atom contracts summary

| Atom                 | Path                                                    | Custom props                                                                               | Stored value                                  | Omitted MUI props                                                      |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------- | ---------------------------------------------------------------------- |
| `Form`               | `src/components/atoms/form/Form.tsx`                    | `formMethods`, `onSubmit`, `onInvalid?`, `noValidate` (default `true`) + native form props | —                                             | `onSubmit` (native)                                                    |
| `TextField`          | `src/components/atoms/textfield/TextField.tsx`          | `name`, `readOnly?` (false), `rules?`                                                      | string                                        | `multiline`                                                            |
| `NumberField`        | `src/components/atoms/textfield/NumberField.tsx`        | `name`, `decimal?` (false), `readOnly?` (false), `rules?`                                  | number, or `''` when empty (never `NaN`)      | `type`, `multiline`                                                    |
| `MultilineTextField` | `src/components/atoms/textfield/MultilineTextField.tsx` | `name`, `readOnly?`, `rules?`, `rows?`, `minRows?`, `maxRows?`                             | string (plain `<textarea>`, no rich text)     | `multiline`, `rows`, `minRows`, `maxRows` (re-exposed)                 |
| `DatePicker`         | `src/components/atoms/datepicker/DatePicker.tsx`        | `name`, `rules?`, `readOnly?`                                                              | `Date \| null`                                | `value`, `onChange`                                                    |
| `Checkbox`           | `src/components/atoms/checkbox/Checkbox.tsx`            | `name`, `label?`, `rules?`, `formControlLabelProps?`                                       | boolean                                       | `name`, `checked`, `onChange`, `value`                                 |
| `Radio`              | `src/components/atoms/radio/Radio.tsx`                  | none (`color` default `'primary'`)                                                         | — (no RHF)                                    | —                                                                      |
| `RadioGroup`         | `src/components/atoms/radio/RadioGroup.tsx`             | `name`                                                                                     | string; `"true"`/`"false"` coerced to boolean | `name`, `value`, `onChange`                                            |
| `Select`             | `src/components/atoms/select/Select.tsx`                | `name`, `options: SelectOption[]`, `rules?`                                                | option `id` string                            | `name`                                                                 |
| `Autocomplete`       | `src/components/atoms/autocomplete/Autocomplete.tsx`    | `name`, `label?`, `options`, `onInputChange?`, `rules?`, `textFieldProps?`                 | option `id` string; cleared = `''`            | `name`, `options`, `value`, `onChange`, `onInputChange`, `renderInput` |

All other MUI props of the underlying component are forwarded.

### `SelectOption` — `src/components/atoms/form/SelectOption.ts`

`id` is the stored value; `name` is the displayed label. Used by `Select`, `Autocomplete`, and `RadioGroup` when bound to a list.

```ts
export type SelectOption = {
  id: string;
  name: string;
};
```

### `Form` — `src/components/atoms/form/Form.tsx`

Every form in the application uses `Form` as its root: create with `useForm<T>()`, pass to `<Form formMethods onSubmit>`, use atoms as direct children (no `control` prop-drilling).

```tsx
import type { DetailedHTMLProps, FormHTMLAttributes } from "react";
import { FormProvider } from "react-hook-form";
import type {
  FieldValues,
  SubmitErrorHandler,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";

type FormProps<
  TFieldValues extends FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
> = {
  onSubmit: SubmitHandler<TTransformedValues>;
  onInvalid?: SubmitErrorHandler<TFieldValues>;
  formMethods: UseFormReturn<TFieldValues, unknown, TTransformedValues>;
};

type FormPropsWithHTMLFormProps<
  TFieldValues extends FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
> = Omit<
  DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>,
  "onSubmit"
> &
  FormProps<TFieldValues, TTransformedValues>;

function Form<
  TFieldValues extends FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
>({
  children,
  formMethods,
  noValidate = true,
  onSubmit,
  onInvalid,
  ...rest
}: FormPropsWithHTMLFormProps<TFieldValues, TTransformedValues>) {
  return (
    <FormProvider {...formMethods}>
      <form
        noValidate={noValidate}
        onSubmit={formMethods.handleSubmit(onSubmit, onInvalid)}
        {...rest}
      >
        {children}
      </form>
    </FormProvider>
  );
}

export default Form;
```

Usage:

```tsx
import { useForm } from "react-hook-form";
import Form from "@/components/atoms/form/Form";

type MyFormValues = { firstName: string };

function MyPage() {
  const formMethods = useForm<MyFormValues>({
    defaultValues: { firstName: "" },
  });

  const handleSubmit = (data: MyFormValues) => {
    console.log(data);
  };

  return (
    <Form formMethods={formMethods} onSubmit={handleSubmit}>
      {/* field atoms go here */}
    </Form>
  );
}
```

### TextField

Single-line text. Use `NumberField` for numbers and `MultilineTextField` for multi-line.

```tsx
import MuiTextField from "@mui/material/TextField";
import type { TextFieldProps as MuiTextFieldProps } from "@mui/material/TextField";
import type { FocusEvent, MouseEvent } from "react";
import { useController, useFormContext } from "react-hook-form";
import type { RegisterOptions } from "react-hook-form";

type TextFieldProps = {
  name: string;
  readOnly?: boolean;
  rules?: RegisterOptions;
} & Omit<MuiTextFieldProps, "multiline">;

function TextField({ name, readOnly = false, rules, ...rest }: TextFieldProps) {
  const { control } = useFormContext();
  const {
    field: { ref, ...field },
    fieldState,
  } = useController({ name, control, rules });

  const handleReadOnlyFocus = (event: FocusEvent<HTMLInputElement>) => {
    event.currentTarget.blur();
  };

  const handleReadOnlyMouseDown = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
  };

  const readonlySx = readOnly
    ? {
        "& .MuiOutlinedInput-root": {
          cursor: "default",
        },
        "& .MuiInputBase-input": {
          cursor: "default",
        },
        "& .MuiInputLabel-root": {
          cursor: "default",
        },
        "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "rgba(0, 0, 0, 0.23)",
        },
        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
          {
            borderColor: "rgba(0, 0, 0, 0.23)",
            borderWidth: 1,
          },
      }
    : undefined;
  const sx = [
    ...(Array.isArray(rest.sx) ? rest.sx : rest.sx ? [rest.sx] : []),
    ...(readonlySx ? [readonlySx] : []),
  ];

  return (
    <MuiTextField
      size="small"
      {...field}
      {...rest}
      error={!!fieldState.error}
      helperText={fieldState.error?.message ?? rest.helperText ?? " "}
      inputRef={ref}
      sx={sx}
      slotProps={{
        ...rest.slotProps,
        inputLabel: {
          ...rest.slotProps?.inputLabel,
          ...(readOnly ? { shrink: true } : {}),
        },
        input: {
          ...rest.slotProps?.input,
          readOnly,
          ...(readOnly
            ? {
                onFocus: handleReadOnlyFocus,
                onMouseDown: handleReadOnlyMouseDown,
              }
            : {}),
        },
        htmlInput: {
          ...rest.slotProps?.htmlInput,
          ...(readOnly
            ? { tabIndex: -1, onMouseDown: handleReadOnlyMouseDown }
            : {}),
        },
      }}
    />
  );
}

export default TextField;
```

```tsx
<TextField name="firstName" label="First name" />
<TextField name="email" label="Email" rules={{ required: 'Email is required' }} />
<TextField name="website" label="Website" readOnly />
```

### NumberField

MUI `TextField` with `type="number"` (not a raw `<input>`, so theming applies). Coerces to number (`parseInt(raw, 10)`, or `parseFloat` when `decimal`); empty input stores `''`, never `NaN`. Blocks `e`, `E`, `+` on keydown, paste and drop. Use `rules` for `required`/`min`/`max`; prefer `zodResolver` for decimal ranges/cross-field logic; use `.optional()`/`.nullable()` in Zod for non-required fields. Future currency/percentage support must add an explicit decimal-place setting (e.g. YAML `scale` or a `decimalPlaces` prop) rather than infer precision from `decimal`.

```tsx
import MuiTextField from "@mui/material/TextField";
import type { TextFieldProps as MuiTextFieldProps } from "@mui/material/TextField";
import type {
  ChangeEvent,
  ClipboardEvent,
  DragEvent,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
} from "react";
import { useController, useFormContext } from "react-hook-form";
import type { RegisterOptions } from "react-hook-form";

type NumberFieldProps = {
  name: string;
  decimal?: boolean;
  readOnly?: boolean;
  rules?: RegisterOptions;
} & Omit<MuiTextFieldProps, "type" | "multiline">;

const unsupportedNumberCharacters = /[eE+]/;

const isUnsupportedNumberKey = (key: string) =>
  key.length === 1 && unsupportedNumberCharacters.test(key);

function NumberField({
  name,
  decimal = false,
  readOnly = false,
  rules,
  ...rest
}: NumberFieldProps) {
  const { control } = useFormContext();
  const {
    field: { ref, ...field },
    fieldState,
  } = useController({ name, control, rules });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (raw === "") {
      field.onChange("");
      return;
    }
    if (unsupportedNumberCharacters.test(raw)) {
      return;
    }
    const nextValue = decimal ? parseFloat(raw) : parseInt(raw, 10);
    if (Number.isNaN(nextValue)) {
      return;
    }
    field.onChange(nextValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    rest.onKeyDown?.(event);
    if (event.defaultPrevented) {
      return;
    }
    if (isUnsupportedNumberKey(event.key)) {
      event.preventDefault();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    if (unsupportedNumberCharacters.test(event.clipboardData.getData("text"))) {
      event.preventDefault();
    }
  };

  const handleDrop = (event: DragEvent<HTMLInputElement>) => {
    if (unsupportedNumberCharacters.test(event.dataTransfer.getData("text"))) {
      event.preventDefault();
    }
  };

  const handleReadOnlyFocus = (event: FocusEvent<HTMLInputElement>) => {
    event.currentTarget.blur();
  };

  const handleReadOnlyMouseDown = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
  };

  const readonlySx = readOnly
    ? {
        "& .MuiOutlinedInput-root": {
          cursor: "default",
        },
        "& .MuiInputBase-input": {
          cursor: "default",
        },
        "& .MuiInputLabel-root": {
          cursor: "default",
        },
        "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "rgba(0, 0, 0, 0.23)",
        },
        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
          {
            borderColor: "rgba(0, 0, 0, 0.23)",
            borderWidth: 1,
          },
      }
    : undefined;
  const sx = [
    ...(Array.isArray(rest.sx) ? rest.sx : rest.sx ? [rest.sx] : []),
    ...(readonlySx ? [readonlySx] : []),
  ];

  return (
    <MuiTextField
      size="small"
      {...field}
      {...rest}
      type="number"
      error={!!fieldState.error}
      helperText={fieldState.error?.message ?? rest.helperText ?? " "}
      inputRef={ref}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      sx={sx}
      slotProps={{
        ...rest.slotProps,
        inputLabel: {
          ...rest.slotProps?.inputLabel,
          ...(readOnly ? { shrink: true } : {}),
        },
        input: {
          ...rest.slotProps?.input,
          readOnly,
          ...(readOnly
            ? {
                onFocus: handleReadOnlyFocus,
                onMouseDown: handleReadOnlyMouseDown,
              }
            : {}),
        },
        htmlInput: {
          ...rest.slotProps?.htmlInput,
          onDrop: handleDrop,
          onPaste: handlePaste,
          ...(readOnly
            ? { tabIndex: -1, onMouseDown: handleReadOnlyMouseDown }
            : {}),
        },
      }}
    />
  );
}

export default NumberField;
```

```tsx
<NumberField name="age" label="Age" />
<NumberField name="price" label="Price" decimal />
<NumberField name="quantity" label="Quantity" rules={{ required: 'Required', min: { value: 1, message: 'Min 1' } }} />
```

### MultilineTextField

Same as `TextField` but forces `multiline`; `rows` = fixed rows (disables auto-resize), `minRows`/`maxRows` bound auto-resize.

```tsx
import MuiTextField from "@mui/material/TextField";
import type { TextFieldProps as MuiTextFieldProps } from "@mui/material/TextField";
import type { FocusEvent, MouseEvent } from "react";
import { useController, useFormContext } from "react-hook-form";
import type { RegisterOptions } from "react-hook-form";

type MultilineTextFieldProps = {
  name: string;
  readOnly?: boolean;
  rules?: RegisterOptions;
  rows?: number;
  minRows?: number;
  maxRows?: number;
} & Omit<MuiTextFieldProps, "multiline" | "rows" | "minRows" | "maxRows">;

function MultilineTextField({
  name,
  readOnly = false,
  rules,
  rows,
  minRows,
  maxRows,
  ...rest
}: MultilineTextFieldProps) {
  const { control } = useFormContext();
  const {
    field: { ref, ...field },
    fieldState,
  } = useController({ name, control, rules });

  const handleReadOnlyFocus = (event: FocusEvent<HTMLInputElement>) => {
    event.currentTarget.blur();
  };

  const handleReadOnlyMouseDown = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
  };

  const readonlySx = readOnly
    ? {
        "& .MuiOutlinedInput-root": {
          cursor: "default",
        },
        "& .MuiInputBase-input": {
          cursor: "default",
        },
        "& .MuiInputLabel-root": {
          cursor: "default",
        },
        "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "rgba(0, 0, 0, 0.23)",
        },
        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
          {
            borderColor: "rgba(0, 0, 0, 0.23)",
            borderWidth: 1,
          },
      }
    : undefined;
  const sx = [
    ...(Array.isArray(rest.sx) ? rest.sx : rest.sx ? [rest.sx] : []),
    ...(readonlySx ? [readonlySx] : []),
  ];

  return (
    <MuiTextField
      size="small"
      {...field}
      {...rest}
      multiline
      rows={rows}
      minRows={minRows}
      maxRows={maxRows}
      error={!!fieldState.error}
      helperText={fieldState.error?.message ?? rest.helperText ?? " "}
      inputRef={ref}
      sx={sx}
      slotProps={{
        ...rest.slotProps,
        inputLabel: {
          ...rest.slotProps?.inputLabel,
          ...(readOnly ? { shrink: true } : {}),
        },
        input: {
          ...rest.slotProps?.input,
          readOnly,
          ...(readOnly
            ? {
                onFocus: handleReadOnlyFocus,
                onMouseDown: handleReadOnlyMouseDown,
              }
            : {}),
        },
        htmlInput: {
          ...rest.slotProps?.htmlInput,
          ...(readOnly
            ? { tabIndex: -1, onMouseDown: handleReadOnlyMouseDown }
            : {}),
        },
      }}
    />
  );
}

export default MultilineTextField;
```

```tsx
<MultilineTextField name="notes" label="Notes" minRows={3} />
<MultilineTextField name="description" label="Description" rows={5} rules={{ required: 'Required' }} />
```

### DatePicker

Built on `@mui/x-date-pickers`. MUI picker-level errors (e.g. invalid format) are bridged to RHF through `onError` → `trigger(name)`, so they surface in `fieldState`/`formState.errors`. Registers a MUI `fieldRef` focus adapter with RHF so invalid date fields auto-focus the visible sections. Uses `timezone="system"`. `value`/`onChange` are controlled internally.

`LocalizationProvider` rules:

- Mounted **once at the application root**, never inside components or form pages.
- Uses `AdapterDateFns` and an `adapterLocale` matching the project language (without it date-fns falls back to `en-US`).
- Multi-language projects: `src/core/providers/AppLocalizationProvider.tsx` (own file — defining it in `main.tsx` violates `react-refresh/only-export-components`), with a `dateFnsLocales` map containing only the configured languages (`en` → `enUS`, `fr` → `fr`, …) resolved from the active i18n language; fallback `enUS`. It wraps everything as the **outermost** provider inside `<StrictMode>`.
- Single language, no switcher: wire `LocalizationProvider` directly in `main.tsx` with the matching `adapterLocale`.

```tsx
import type { ReactNode } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { enUS, fr } from "date-fns/locale";
import type { Locale } from "date-fns";
import { useTranslation } from "react-i18next";

const dateFnsLocales: Record<string, Locale> = {
  en: enUS,
  fr,
};

type AppLocalizationProviderProps = { children: ReactNode };

export function AppLocalizationProvider({
  children,
}: AppLocalizationProviderProps) {
  const { i18n } = useTranslation();
  const adapterLocale = dateFnsLocales[i18n.language] ?? enUS;

  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={adapterLocale}
    >
      {children}
    </LocalizationProvider>
  );
}
```

```tsx
import { AppLocalizationProvider } from "./core/providers/AppLocalizationProvider";

<StrictMode>
  <AppLocalizationProvider>
    {/* existing providers / app shell */}
  </AppLocalizationProvider>
</StrictMode>;
```

Single-language example:

```tsx
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { fr } from "date-fns/locale";

<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
  <App />
</LocalizationProvider>;
```

`src/components/atoms/datepicker/DatePicker.tsx`:

```tsx
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import type { DatePickerProps as MuiDatePickerProps } from "@mui/x-date-pickers/DatePicker";
import type { FieldRef } from "@mui/x-date-pickers/models";
import type { FocusEvent, MouseEvent } from "react";
import { useCallback } from "react";
import { useState } from "react";
import { get, useController, useFormContext } from "react-hook-form";
import type { RegisterOptions } from "react-hook-form";

type DatePickerFocusField = Pick<
  FieldRef<never>,
  "focusField" | "setSelectedSections"
>;

type DatePickerProps = {
  name: string;
  rules?: RegisterOptions;
} & Omit<MuiDatePickerProps, "value" | "onChange">;

function DatePicker({ name, onError, rules, ...rest }: DatePickerProps) {
  const { control, formState, trigger } = useFormContext();
  const {
    field: { ref, ...field },
  } = useController({ name, control, rules });

  const [muiError, setMuiError] = useState(false);
  const fieldError = get(formState.errors, name);
  const fieldSlotProps = rest.slotProps?.field;
  const fieldSlotPropsObject =
    typeof fieldSlotProps === "function" ? undefined : fieldSlotProps;
  const textFieldSlotProps = rest.slotProps?.textField;
  const textFieldSlotPropsObject =
    typeof textFieldSlotProps === "function" ? undefined : textFieldSlotProps;

  const handleFieldRef = useCallback(
    (fieldRef: DatePickerFocusField | null) => {
      if (!fieldRef) {
        return;
      }

      ref({
        focus: () => fieldRef.focusField(),
        select: () => fieldRef.setSelectedSections("all"),
        setCustomValidity: () => undefined,
        reportValidity: () => true,
      });
    },
    [ref],
  );

  const handleReadOnlyFocus = (event: FocusEvent<HTMLElement>) => {
    event.currentTarget.blur();
  };

  const handleReadOnlyMouseDown = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const readonlySx = rest.readOnly
    ? {
        "& .MuiPickersInputBase-root": {
          cursor: "default",
        },
        "& .MuiPickersInputBase-sectionsContainer": {
          cursor: "default",
        },
        "& .MuiPickersOutlinedInput-sectionsContainer": {
          cursor: "default",
          userSelect: "none",
        },
        "& .MuiPickersSectionList-root": {
          userSelect: "none",
        },
        "& .MuiPickersSectionList-sectionContent": {
          cursor: "default",
          userSelect: "none",
        },
        "& .MuiPickersSectionList-sectionContent:focus": {
          outline: "none",
        },
        "& .MuiPickersOutlinedInput-root:hover .MuiPickersOutlinedInput-notchedOutline":
          {
            borderColor: "rgba(0, 0, 0, 0.23)",
          },
        "& .MuiPickersOutlinedInput-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline":
          {
            borderColor: "rgba(0, 0, 0, 0.23)",
            borderWidth: 1,
          },
        "& .MuiPickersOutlinedInput-root.MuiPickersInputBase-focused .MuiPickersOutlinedInput-notchedOutline":
          {
            borderColor: "rgba(0, 0, 0, 0.23)",
            borderWidth: 1,
          },
        "& .MuiPickersOutlinedInput-root.MuiPickersInputBase-focused:not(.MuiPickersInputBase-error) .MuiPickersOutlinedInput-notchedOutline":
          {
            borderColor: "rgba(0, 0, 0, 0.23)",
            borderWidth: 1,
          },
      }
    : undefined;
  const sx = [
    ...(Array.isArray(rest.sx) ? rest.sx : rest.sx ? [rest.sx] : []),
    ...(readonlySx ? [readonlySx] : []),
  ];

  return (
    <MuiDatePicker
      {...field}
      {...rest}
      disableOpenPicker={rest.readOnly ? true : rest.disableOpenPicker}
      selectedSections={rest.readOnly ? null : rest.selectedSections}
      sx={sx}
      onError={(error, value) => {
        setMuiError(!!error);
        void trigger(name);
        onError?.(error, value);
      }}
      slotProps={{
        ...rest.slotProps,
        field: {
          ...fieldSlotPropsObject,
          fieldRef: handleFieldRef,
        },
        textField: {
          size: "small",
          ...textFieldSlotPropsObject,
          ...(rest.readOnly ? { focused: false } : {}),
          ...(rest.readOnly
            ? {
                onFocus: handleReadOnlyFocus,
                onMouseDown: handleReadOnlyMouseDown,
              }
            : {}),
          slotProps: {
            ...textFieldSlotPropsObject?.slotProps,
            inputLabel: {
              ...textFieldSlotPropsObject?.slotProps?.inputLabel,
              ...(rest.readOnly ? { shrink: true } : {}),
            },
            input: {
              ...textFieldSlotPropsObject?.slotProps?.input,
              ...(rest.readOnly
                ? {
                    slotProps: {
                      ...textFieldSlotPropsObject?.slotProps?.input?.slotProps,
                      sectionContent: {
                        ...textFieldSlotPropsObject?.slotProps?.input?.slotProps
                          ?.sectionContent,
                        onClick: handleReadOnlyMouseDown,
                        onFocus: handleReadOnlyFocus,
                        onMouseDown: handleReadOnlyMouseDown,
                      },
                    },
                  }
                : {}),
            },
            htmlInput: {
              ...textFieldSlotPropsObject?.slotProps?.htmlInput,
              ...(rest.readOnly
                ? { tabIndex: -1, onMouseDown: handleReadOnlyMouseDown }
                : {}),
            },
          },
          error: !!fieldError || muiError,
          helperText: fieldError
            ? `${fieldError.message}`
            : (textFieldSlotPropsObject?.helperText ?? " "),
        },
      }}
      inputRef={ref}
      timezone="system"
    />
  );
}

export default DatePicker;
```

```tsx
<DatePicker name="birthDate" label="Birth date" />
<DatePicker name="startDate" label="Start date" rules={{ required: "Start date is required" }} />
<DatePicker name="startDate" label="Start date" disablePast />
```

### Checkbox

Value is always a `boolean`. Wraps in `FormControlLabel` when `label` is given. For required acceptance (e.g. terms) use `z.literal(true)` in a Zod schema rather than inline `rules`.

```tsx
import MuiCheckbox from "@mui/material/Checkbox";
import type { CheckboxProps as MuiCheckboxProps } from "@mui/material/Checkbox";
import { FormControlLabel } from "@mui/material";
import type { FormControlLabelProps } from "@mui/material";
import { useController, useFormContext } from "react-hook-form";
import type { RegisterOptions } from "react-hook-form";

type CheckboxProps = {
  name: string;
  label?: string;
  rules?: RegisterOptions;
  formControlLabelProps?: Omit<FormControlLabelProps, "control" | "label">;
} & Omit<MuiCheckboxProps, "name" | "checked" | "onChange" | "value">;

function Checkbox({
  name,
  label,
  rules,
  formControlLabelProps,
  ...rest
}: CheckboxProps) {
  const { control } = useFormContext();
  const { field } = useController({ name, control, rules });

  const checkbox = (
    <MuiCheckbox
      {...rest}
      checked={!!field.value}
      onChange={(e) => field.onChange(e.target.checked)}
      slotProps={{
        ...rest.slotProps,
        input: { ref: field.ref },
      }}
    />
  );

  if (label) {
    return (
      <FormControlLabel
        {...formControlLabelProps}
        control={checkbox}
        label={label}
      />
    );
  }

  return checkbox;
}

export default Checkbox;
```

```tsx
<Checkbox name="termsAccepted" label="I accept the terms and conditions" />
<Checkbox name="newsletter" label="Subscribe to newsletter" />

{/* Without label — caller wraps it */}
<FormControlLabel
  control={<Checkbox name="active" />}
  label="Active"
/>
```

### Radio and RadioGroup

`Radio` is a thin presentational wrapper with **no RHF coupling**, used as `control` in `FormControlLabel`. `RadioGroup` is RHF-wired and converts `"true"`/`"false"` to booleans so yes/no fields work without custom resolver logic. Validate with `zodResolver` (`z.string().min(1, 'Required')` or `z.literal(true)`).

```tsx
import MuiRadio from "@mui/material/Radio";
import type { RadioProps as MuiRadioProps } from "@mui/material/Radio";
import type { ReactElement } from "react";

export type RadioProps = MuiRadioProps;

export default function Radio({
  color = "primary",
  ...props
}: RadioProps): ReactElement {
  return <MuiRadio color={color} {...props} />;
}
```

```tsx
import MuiRadioGroup from "@mui/material/RadioGroup";
import type { RadioGroupProps as MuiRadioGroupProps } from "@mui/material/RadioGroup";
import type { ChangeEvent } from "react";
import { useController, useFormContext } from "react-hook-form";

type RadioGroupProps = {
  name: string;
} & Omit<MuiRadioGroupProps, "name" | "value" | "onChange">;

// Converts 'true'/'false' string values emitted by radio inputs back to booleans
// so boolean-typed fields work naturally without custom resolver logic.
function parseValue(raw: string): boolean | string {
  if (raw === "true") return true;
  if (raw === "false") return false;
  return raw;
}

function RadioGroup({ name, children, ...rest }: RadioGroupProps) {
  const { control } = useFormContext();
  const { field } = useController({ name, control });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    field.onChange(parseValue(event.target.value));
  };

  return (
    <MuiRadioGroup
      {...rest}
      value={
        field.value !== undefined && field.value !== null
          ? String(field.value)
          : ""
      }
      onChange={handleChange}
    >
      {children}
    </MuiRadioGroup>
  );
}

export default RadioGroup;
```

```tsx
import { FormControlLabel } from "@mui/material";
import Radio from "@/components/atoms/radio/Radio";
import RadioGroup from "@/components/atoms/radio/RadioGroup";

{
  /* String value */
}
<RadioGroup name="contactPreference">
  <FormControlLabel value="email" control={<Radio />} label="Email" />
  <FormControlLabel value="phone" control={<Radio />} label="Phone" />
</RadioGroup>;

{
  /* Boolean value — parseValue handles string → boolean coercion */
}
<RadioGroup name="hasConsented">
  <FormControlLabel value="true" control={<Radio />} label="Yes" />
  <FormControlLabel value="false" control={<Radio />} label="No" />
</RadioGroup>;
```

### Select

`MenuItem` per option; `id` stored, `name` displayed; label id `${name}-label`. Validate against the `id` string.

```tsx
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
} from "@mui/material";
import MuiSelect from "@mui/material/Select";
import type { SelectProps as MuiSelectProps } from "@mui/material/Select";
import { get, useController, useFormContext } from "react-hook-form";
import type { RegisterOptions } from "react-hook-form";
import type { SelectOption } from "../form/SelectOption";

type SelectProps = {
  name: string;
  options: SelectOption[];
  rules?: RegisterOptions;
} & Omit<MuiSelectProps, "name">;

function Select({ name, options, rules, ...rest }: SelectProps) {
  const { formState, control } = useFormContext();
  const {
    field: { ref, ...field },
  } = useController({ name, control, rules });

  const fieldError = get(formState.errors, name);
  const size = rest.size ?? "small";

  return (
    <FormControl size={size} error={!!fieldError}>
      <InputLabel id={`${name}-label`}>{rest.label}</InputLabel>
      <MuiSelect
        labelId={`${name}-label`}
        size={size}
        {...field}
        {...rest}
        inputRef={ref}
      >
        {options.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.name}
          </MenuItem>
        ))}
      </MuiSelect>
      <FormHelperText>
        {fieldError ? `${fieldError.message}` : " "}
      </FormHelperText>
    </FormControl>
  );
}

export default Select;
```

```tsx
import type { SelectOption } from '@/components/atoms/form/SelectOption';

const countryOptions: SelectOption[] = [
  { id: 'CA', name: 'Canada' },
  { id: 'US', name: 'United States' },
];

<Select name="country" label="Country" options={countryOptions} />
<Select name="status" label="Status" options={statusOptions} rules={{ required: 'Status is required' }} />
```

### Autocomplete

Client-side filtering by default; async server-side lookup through `onInputChange` (caller updates `options`). Stores the option `id` (not the object); cleared selection = `''`. Inner `TextField` defaults to `size="small"`, overridable via `textFieldProps`.

```tsx
import MuiAutocomplete from "@mui/material/Autocomplete";
import type { AutocompleteProps as MuiAutocompleteProps } from "@mui/material/Autocomplete";
import MuiTextField from "@mui/material/TextField";
import type { TextFieldProps as MuiTextFieldProps } from "@mui/material/TextField";
import { useController, useFormContext } from "react-hook-form";
import type { RegisterOptions } from "react-hook-form";
import type { SelectOption } from "../form/SelectOption";

type AutocompleteProps = {
  name: string;
  label?: string;
  options: SelectOption[];
  onInputChange?: (value: string) => void;
  rules?: RegisterOptions;
  textFieldProps?: Partial<MuiTextFieldProps>;
} & Omit<
  MuiAutocompleteProps<SelectOption, false, false, false>,
  "name" | "options" | "value" | "onChange" | "onInputChange" | "renderInput"
>;

function Autocomplete({
  name,
  label,
  options,
  onInputChange,
  rules,
  textFieldProps,
  ...rest
}: AutocompleteProps) {
  const { control } = useFormContext();
  const {
    field: { ref, value, onChange, name: fieldName, onBlur },
    fieldState,
  } = useController({ name, control, rules });

  const selectedOption = options.find((o) => o.id === value) ?? null;

  return (
    <MuiAutocomplete<SelectOption>
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      {...rest}
      options={options}
      value={selectedOption}
      onChange={(_, newValue) => onChange(newValue?.id ?? "")}
      onBlur={onBlur}
      onInputChange={(_, inputValue) => onInputChange?.(inputValue)}
      renderInput={(params) => (
        <MuiTextField
          {...params}
          label={label}
          size="small"
          {...textFieldProps}
          inputRef={ref}
          error={!!fieldState.error}
          helperText={
            fieldState.error?.message ?? textFieldProps?.helperText ?? " "
          }
          slotProps={{
            ...params.slotProps,
            ...textFieldProps?.slotProps,
            htmlInput: {
              ...params.slotProps.htmlInput,
              name: fieldName,
            },
          }}
        />
      )}
    />
  );
}

export default Autocomplete;
```

```tsx
{
  /* Client-side filtering */
}
<Autocomplete name="city" label="City" options={cityOptions} />;

{
  /* Async lookup — caller drives the options list */
}
<Autocomplete
  name="memberId"
  label="Member"
  options={memberOptions}
  onInputChange={(query) => fetchMembers(query)}
  rules={{ required: "Member is required" }}
/>;
```

### Existing atom files

Existing atom files are not overwritten; divergences from the canonical templates to flag are: missing props, missing RHF wiring, incorrect value coercion, structural divergence (e.g. missing `readOnly` wiring on `slotProps.input`, missing readonly label shrink/focus opt-out). Cosmetic differences (import order, blank lines) are not divergences.

---

## YAML Field to Form Control Mapping

Rules apply after the module YAML has passed schema validation. YAML is parsed with a structured parser (no ad hoc string slicing). Never invent fields not declared or explicitly listed in a layout block. Unknown field names in a layout → stop and report.

### Field selection and order

| Operation | Source                                                                                                                                                         | System fields                                                         | Mode         |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------ |
| Create    | `entity.layout.create` (exact ordered list) or, if absent, all `entity.fields` in declaration order                                                            | **Never rendered**, even if listed                                    | all editable |
| Update    | `entity.layout.edit` (exact ordered list of single-key maps `- fieldName: editable` / `- otherField: readonly`) or, if absent, all `entity.fields` as editable | Only as **readonly**; labels from the referenced `system-fields.yaml` | per entry    |

```yaml
- fieldName: editable
- otherField: readonly
```

Render order must match YAML order exactly. Locale labels: fall back to English, then to the field name.

### Control mapping

| YAML `control` | Component                                       | Import                                                                                |
| -------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| `textfield`    | `TextField`                                     | `import TextField from '@/components/atoms/textfield/TextField'`                      |
| `textarea`     | `MultilineTextField`                            | `import MultilineTextField from '@/components/atoms/textfield/MultilineTextField'`    |
| `numberfield`  | `NumberField`                                   | `import NumberField from '@/components/atoms/textfield/NumberField'`                  |
| `checkbox`     | `Checkbox`                                      | `import Checkbox from '@/components/atoms/checkbox/Checkbox'`                         |
| `radiogroup`   | `RadioGroup` + `Radio` + MUI `FormControlLabel` | `Radio`, `RadioGroup`, `FormControl`, `FormControlLabel`, `FormLabel`, `SelectOption` |
| `select`       | `Select`                                        | `Select` + `SelectOption`                                                             |
| `datepicker`   | `DatePicker`                                    | `import DatePicker from '@/components/atoms/datepicker/DatePicker'`                   |

- Use only compatible control/type combinations from the central input schema; never generate a mismatched control (stop and fix YAML/schema instead).
- `select` / `radiogroup` on an `enum` require `choices`. For `string` selections without `choices`, generate an empty options array only when options will come from a later backend lookup, and report the placeholder.
- `SelectOption` and `RadioGroup` store strings; numeric selections are rejected by the input schema until atoms support numeric coercion.
- `NumberField` gets `decimal` only for `type: decimal`.

### Type values and form defaults

YAML type → TypeScript type comes from the central type mapping. React Hook Form `defaultValues`:

| Field kind                | Default                                   |
| ------------------------- | ----------------------------------------- |
| Text-like, `enum`, `guid` | `''`                                      |
| Numeric                   | `''` (`NumberField` stores empty as `''`) |
| Date/time                 | `null` (DatePicker)                       |
| Boolean                   | `false` (Checkbox)                        |

UI-only types (`number | ''`, `Date | null`) apply only to `{Entity}FormValues`. `Create{Entity}Input` / `Update{Entity}Input` use the real wire types (`number`, `Date`): coerce required numeric fields with `Number(values.field)` and required dates with a non-null assertion (`values.field!`) in the submit handler (required validation guarantees a value).

### Required fields

- Must be visually identifiable: pass `required` and, where the atom supports `rules`, an inline rule:

```tsx
rules={{ required: t('validation.required', { field: t('fields.<field-name>') }) }}
```

- `Checkbox`: `formControlLabelProps={{ required: true }}` for the marker; **no** `rules.required` for booleans where `false` is valid.
- `RadioGroup`: wrap in `FormControl required` + `FormLabel`.
- Required `DatePicker`: add `rules` so the message renders in DatePicker helper text.
- No schema validation libraries are added by generated module forms (inline RHF rules only).
- Never add required rules to readonly fields.

### Readonly fields (update forms only)

| Atom                                                           | Readonly mechanism                    |
| -------------------------------------------------------------- | ------------------------------------- |
| `TextField`, `MultilineTextField`, `NumberField`, `DatePicker` | `readOnly` (omit `rules`)             |
| `Checkbox`, `Select`                                           | `disabled`                            |
| `RadioGroup`                                                   | `disabled` on each `FormControlLabel` |

Readonly fields keep their YAML order and are never rendered in create forms.

### Generated field JSX

Labels are always `label={t('fields.<field-name>')}`.

```tsx
<TextField
  name="<field-name>"
  label={t("fields.<field-name>")}
  fullWidth
  required
  rules={{
    required: t("validation.required", { field: t("fields.<field-name>") }),
  }}
/>
```

```tsx
<MultilineTextField
  name="<field-name>"
  label={t("fields.<field-name>")}
  fullWidth
  minRows={3}
/>
```

```tsx
<NumberField
  name="<field-name>"
  label={t("fields.<field-name>")}
  fullWidth
  decimal
/>
```

```tsx
<Checkbox name="<field-name>" label={t("fields.<field-name>")} />
<Checkbox name="<field-name>" label={t("fields.<field-name>")} formControlLabelProps={{ required: true }} />
```

Select options generated inside the component from `choices`:

```tsx
const <fieldName>Options: SelectOption[] = [
  { id: '<choice-value>', name: t('enums.<field-name>.<choice-value>') },
]
```

```tsx
<Select
  name="<field-name>"
  label={t('fields.<field-name>')}
  options={<fieldName>Options}
  fullWidth
/>
```

```tsx
<FormControl required>
  <FormLabel>{t('fields.<field-name>')}</FormLabel>
  <RadioGroup name="<field-name>">
    {<fieldName>Options.map((option) => (
      <FormControlLabel
        key={option.id}
        value={option.id}
        control={<Radio />}
        label={option.name}
      />
    ))}
  </RadioGroup>
</FormControl>
```

```tsx
<DatePicker
  name="<field-name>"
  label={t("fields.<field-name>")}
  rules={{
    required: t("validation.required", { field: t("fields.<field-name>") }),
  }}
  fullWidth
  required
/>
```

---

## Module Pages and Routes

| Page                 | Path                                                                  | Route                   | Router entry     |
| -------------------- | --------------------------------------------------------------------- | ----------------------- | ---------------- |
| `{Entity}ListPage`   | `src/modules/{module-name}/{Entity}ListPage/{Entity}ListPage.tsx`     | `/{module-name}`        | `index: true`    |
| `{Entity}CreatePage` | `src/modules/{module-name}/{Entity}CreatePage/{Entity}CreatePage.tsx` | `/{module-name}/create` | `path: 'create'` |
| `{Entity}UpdatePage` | `src/modules/{module-name}/{Entity}UpdatePage/{Entity}UpdatePage.tsx` | `/{module-name}/:id`    | `path: ':id'`    |

Routing rules (`src/routes/router.tsx`):

- One nested module route `path: '{module-name}'` as a child of the root layout route (`path: '/'`), placed after existing module routes and before any wildcard/catch-all.
- Children order is mandatory: `index: true` → `path: 'create'` → `path: ':id'`, so `create` is never matched as an `:id`.
- Pages are loaded only via `lazy` + dynamic `import()`; **no static imports** of page components.
- Page components are **named exports** (`export function {Entity}ListPage()`), using `useTranslation('{module-name}')`.

```tsx
{
  path: '<module-name>',
  children: [
    {
      index: true,
      lazy: async () => {
        const { <Entity>ListPage } = await import('../modules/<module-name>/<Entity>ListPage/<Entity>ListPage')
        return { Component: <Entity>ListPage }
      },
    },
    {
      path: 'create',
      lazy: async () => {
        const { <Entity>CreatePage } = await import('../modules/<module-name>/<Entity>CreatePage/<Entity>CreatePage')
        return { Component: <Entity>CreatePage }
      },
    },
    {
      path: ':id',
      lazy: async () => {
        const { <Entity>UpdatePage } = await import('../modules/<module-name>/<Entity>UpdatePage/<Entity>UpdatePage')
        return { Component: <Entity>UpdatePage }
      },
    },
  ],
},
```

Page shell pattern (create/update shells identical with `create.title` / `update.title`; the update shell does not read the route param until it needs it):

```tsx
import { useTranslation } from 'react-i18next'

export function <Entity>ListPage() {
  const { t } = useTranslation('<module-name>')

  return (
    <section>
      <h1>{t('list.title')}</h1>
    </section>
  )
}
```

### Navigation registration (`src/core/layout/navigation.ts`)

- Icon comes from the module YAML `icon` (e.g. `ShoppingCartRounded`); component name = value + `Icon` (e.g. `ShoppingCartRoundedIcon`). It must exist in `@mui/icons-material` (check `https://unpkg.com/@mui/icons-material/<IconComponentName>.js`; 404 → fix the YAML icon name).
- Add the import, extend the `ModuleId` union, append the entry after all existing module entries.

```ts
import <IconComponentName> from '@mui/icons-material/<IconComponentName>'

export type ModuleId = "existing-module" | "<module-name>";

{
  id: '<module-name>',
  label: '<entity-display-name>',
  translationKey: 'navigation.<module-name>',
  to: '/<module-name>',
  Icon: <IconComponentName>,
},
```

`label` = English `entity.displayName`.

### i18n namespace registration

Add the module to `namespaces` in `src/i18n/config.ts`:

```ts
export const namespaces = [
  "common",
  "dashboard" /* existing modules */,
  "<module-name>",
] as const;
```

---

## List Page

Columns: `entity.layout.list` order; if absent, `id` followed by every `entity.fields` entry in declaration order. Field definitions resolve from `entity.fields` (module fields) or the system-fields YAML (e.g. `id`).

| YAML `type`              | `GridColDef.type`     | Extra                                                                                                                                          |
| ------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `int`, `decimal`         | `'number'`            | —                                                                                                                                              |
| `boolean`                | `'boolean'`           | —                                                                                                                                              |
| `datetime`               | `'dateTime'`          | **must** add `valueGetter: (value: string \| null) => (value ? new Date(value) : null)` (API returns ISO strings; MUI `dateTime` needs `Date`) |
| `string`, `enum`, `guid` | omit (default string) | `enum` **must** add `valueFormatter` resolving `enums.<fieldName>.<value>` with `defaultValue: value`                                          |

Generation rules:

- One column per visible field, `headerName: t('list.columns.<fieldName>')`, `flex: 1`; add `type` only when the table yields one.
- The action column is **always last**, `headerName: ''`, fixed width (`80` edit-only, `120` with delete), `sortable: false`, `filterable: false`.
- Columns are memoized with `useMemo<GridColDef<{Entity}>[]>(..., [t])`.
- Create CTA uses the shared `CreateActionLinkButton` (never repeat `Button + Link + AddRoundedIcon` per page); edit uses `EditActionLinkButton` with `to={`/{module-name}/${row.id}`}`.
- `rows={data ?? []}`, `loading={isLoading}`, `emptyMessage={t('list.empty')}`, `sx={{ flex: 1 }}`; section is a flex column so the grid fills vertical space.

```tsx
import { useMemo } from 'react'
import type { GridColDef } from '@mui/x-data-grid'
import { useTranslation } from 'react-i18next'

import { CreateActionLinkButton } from '@/core/components/atoms/CreateActionLinkButton/CreateActionLinkButton'
import { AppDataGrid } from '@/core/components/molecules/AppDataGrid/AppDataGrid'
import { EditActionLinkButton } from '@/core/components/atoms/EditActionLinkButton/EditActionLinkButton'
import { use<Entity>List } from '../hooks/use<Entity>List'
import type { <Entity> } from '../types/<Entity>'

export function <Entity>ListPage() {
  const { t } = useTranslation('<module-name>')
  const { data, isLoading } = use<Entity>List()

  const columns = useMemo<GridColDef<<Entity>>[]>(
    () => [
      // One entry per visible field (Step 5), in layout.list order:
      { field: '<fieldName>', headerName: t('list.columns.<fieldName>'), flex: 1 },
      // datetime columns MUST add a valueGetter — the API returns an ISO string but MUI's
      // 'dateTime' column type only accepts Date objects:
      // {
      //   field: 'orderDate',
      //   headerName: t('list.columns.orderDate'),
      //   type: 'dateTime',
      //   flex: 1,
      //   valueGetter: (value: string | null) => (value ? new Date(value) : null),
      // },
      // enum columns MUST add a valueFormatter:
      // {
      //   field: 'status',
      //   headerName: t('list.columns.status'),
      //   flex: 1,
      //   valueFormatter: (value: string) =>
      //     value ? t(`enums.status.${value}` as never, { defaultValue: value }) : '',
      // },
      {
        field: 'actions',
        headerName: '',
        width: 80,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <EditActionLinkButton
            to={`/<module-name>/${row.id}`}
            ariaLabel={t('list.actions.edit')}
          />
        ),
      },
    ],
    [t],
  )

  return (
    <section style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0 }}>{t('list.title')}</h1>
        <CreateActionLinkButton to="/<module-name>/create">
          {t('list.actions.create')}
        </CreateActionLinkButton>
      </div>
      <AppDataGrid
        rows={data ?? []}
        columns={columns}
        loading={isLoading}
        emptyMessage={t('list.empty')}
        sx={{ flex: 1 }}
      />
    </section>
  )
}
```

---

## Create Page

Shared form-page rules (create and update):

- Always imports `Button`, `Stack` (`@mui/material`, combined into one import), `useForm`, `useTranslation`, and `Form`; only atom imports that are used (`noUnusedLocals` / `noUnusedParameters` are on).
- `type {Entity}FormValues = { /* one property per rendered field, in YAML order */ }`.
- Fields stacked one per line in a `Stack spacing={2}` — **no** custom grid, columns, cards, wizards or grouped layouts.
- Submit button `type="submit" variant="contained"` labelled `t('<operation>.submit')`, disabled while the mutation is pending.

```tsx
import { Button, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Form from "@/components/atoms/form/Form";
```

```tsx
type <Entity>FormValues = {
  // one property per rendered field, in YAML order
}

const formMethods = useForm<<Entity>FormValues>({
  defaultValues: {
    // generated defaults
  },
})
```

```tsx
return (
  <section>
    <h1>{t("<operation>.title")}</h1>

    <Form formMethods={formMethods} onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {/* generated fields, one field component per line in YAML order */}
        <Button type="submit" variant="contained">
          {t("<operation>.submit")}
        </Button>
      </Stack>
    </Form>
  </section>
);
```

Create-specific:

```tsx
import { useNavigate } from "react-router-dom";
import { use<Entity>Create } from "../hooks/use<Entity>Create";
```

```tsx
const navigate = useNavigate()
const create<Entity> = use<Entity>Create()

const handleSubmit = async (values: <Entity>FormValues) => {
  await create<Entity>.mutateAsync(values)
  navigate('/<module-name>')
}
```

- Submits `POST /api/{module-name}`; navigates back to `/{module-name}` on success.
- No readonly or system fields.

---

## Update Page

```tsx
import { useNavigate, useParams } from "react-router-dom";
import { use<Entity>Find } from "../hooks/use<Entity>Find";
import { use<Entity>Update, type Update<Entity>Input } from "../hooks/use<Entity>Update";
```

- `{Entity}FormValues` contains **every rendered field** (editable + readonly) — superset of `Update{Entity}Input` (editable only).
- Prefill with `useForm`'s `values` option (re-syncs when data changes). **Do not** fetch with a manual `useEffect`/`fetch` and **do not** call `formMethods.reset()`.

```tsx
const { id } = useParams<{ id: string }>()
const navigate = useNavigate()
const <entityVar>Query = use<Entity>Find(id)
const update<Entity> = use<Entity>Update(id)

const formMethods = useForm<<Entity>FormValues>({
  defaultValues: {
    // generated empty defaults, same rules as create forms (see control-mapping.md)
  },
  values: <entityVar>Query.data
    ? {
        // map every rendered field from <entityVar>Query.data, in YAML order
      }
    : undefined,
})
```

Submit narrows to editable fields (coercing UI types to wire types), shows a success toast, then navigates back:

```tsx
const { addSuccess } = useSuccessToast()

const handleSubmit = async (values: <Entity>FormValues) => {
  await update<Entity>.mutateAsync({
    // one property per editable field, e.g. orderNumber: values.orderNumber
  })
  addSuccess(t('update.success'))
  navigate('/<module-name>')
}
```

```tsx
<Button type="submit" variant="contained" disabled={update<Entity>.isPending}>
  {t('update.submit')}
</Button>
```

- Wired to `GET /api/{module-name}/{id}` (prefill) and `PUT /api/{module-name}/{id}` (save).
- `useSuccessToast` imported from `@/core/hooks/useSuccessToast`.

---

## Delete Action

Delete is **per-row only** (no batch/bulk UI) and lives in the list page action column. `ConfirmDialog` and `DeleteActionButton` are shared components created once at frontend scaffold time; module wiring never recreates them.

Changes to `{Entity}ListPage` (leave data columns, create button and loading/empty states untouched):

```tsx
import { useMemo, useState } from 'react'
import { DeleteActionButton } from '@/core/components/atoms/DeleteActionButton/DeleteActionButton'
import { ConfirmDialog } from '@/core/components/molecules/ConfirmDialog/ConfirmDialog'
import { use<Entity>Delete } from '../hooks/use<Entity>Delete'
```

(merge `useState` into the existing `react` import — no duplicate import line). Before the `columns` memo:

```tsx
const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
const delete<Entity> = use<Entity>Delete()

const handleConfirmDelete = async () => {
  if (!pendingDeleteId) return
  try {
    await delete<Entity>.mutateAsync(pendingDeleteId)
  } finally {
    setPendingDeleteId(null)
  }
}
```

The dialog always closes after the attempt (`finally`). Success → row disappears via list invalidation; failure → global `MutationCache` toast (no local error handling).

Actions column (only `width` 80 → 120 and `renderCell` change):

```tsx
{
  field: 'actions',
  headerName: '',
  width: 120,
  sortable: false,
  filterable: false,
  renderCell: ({ row }) => (
    <>
      <EditActionLinkButton
        to={`/<module-name>/${row.id}`}
        ariaLabel={t('list.actions.edit')}
      />
      <DeleteActionButton
        onClick={() => setPendingDeleteId(row.id)}
        ariaLabel={t('list.actions.delete')}
      />
    </>
  ),
},
```

`ConfirmDialog` as a sibling of `AppDataGrid` inside `</section>`:

```tsx
<ConfirmDialog
  open={pendingDeleteId !== null}
  title={t('list.confirmDelete.title')}
  message={t('list.confirmDelete.message')}
  confirmLabel={t('list.confirmDelete.confirm')}
  cancelLabel={t('list.confirmDelete.cancel')}
  onConfirm={handleConfirmDelete}
  onCancel={() => setPendingDeleteId(null)}
  isConfirming={delete<Entity>.isPending}
/>
```

---

## Module i18n Keys

Locale JSON files are always written as expanded multi-line objects (prettier style), never single-line objects. Existing keys are preserved; existing `<operation>.submit` is never overwritten.

### `public/locales/{lang}/{module-name}.json`

| Key                                 | en                                      | fr                                                                                                                                                |
| ----------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list.title`                        | `<entity-displayName-en> List`          | `Liste des <module-label-fr-plural>` (natural French; fallback singular with article/elision, e.g. `Liste de la commande`, `Liste de l'appareil`) |
| `list.columns.<fieldName>`          | field `displayName`                     | field `displayName`                                                                                                                               |
| `list.actions.create`               | short "New `<entity-displayName>`"      | (localized)                                                                                                                                       |
| `list.actions.edit`                 | `Edit`                                  | `Modifier`                                                                                                                                        |
| `list.actions.delete`               | `Delete`                                | `Supprimer`                                                                                                                                       |
| `list.empty`                        | short "No `<entity-plural>` to display" | (localized)                                                                                                                                       |
| `list.confirmDelete.title`          | `Delete <entity-displayName>?`          | `Supprimer <entity-displayName> ?`                                                                                                                |
| `list.confirmDelete.message`        | `This action cannot be undone.`         | `Cette action est irréversible.`                                                                                                                  |
| `list.confirmDelete.confirm`        | `Delete`                                | `Supprimer`                                                                                                                                       |
| `list.confirmDelete.cancel`         | `Cancel`                                | `Annuler`                                                                                                                                         |
| `create.title`                      | `New <entity-display-name>`             | natural French (`Nouvelle commande`, `Nouveau client`, `Nouveau paramètre`)                                                                       |
| `create.submit` / `update.submit`   | `Save`                                  | (localized)                                                                                                                                       |
| `update.title`                      | `Edit <entity-display-name>`            | natural French (`Modifier la commande`, `Modifier le client`, `Modifier le paramètre`)                                                            |
| `update.success`                    | e.g. `<Entity> updated successfully.`   | (localized)                                                                                                                                       |
| `fields.<field-name>`               | field `displayName`                     | field `displayName`                                                                                                                               |
| `enums.<field-name>.<choice-value>` | choice `displayName`                    | choice `displayName`                                                                                                                              |
| `validation.required`               | `{{field}} is required`                 | `Le champ {{field}} est obligatoire`                                                                                                              |

- `enums` only for fields with `choices`; omit the block when no enum fields. No duplicate `choices` keys.
- `displayName` per language from the YAML; missing language falls back to English.

```json
{
  "fields": {
    "<field-name>": "<field displayName in this language>"
  },
  "enums": {
    "<field-name>": {
      "<choice-value>": "<choice displayName in this language>"
    }
  },
  "validation": {
    "required": "{{field}} is required"
  },
  "<operation>": {
    "submit": "Save"
  }
}
```

### Other namespaces

- `common.json`: `navigation.<module-name>` = entity `displayName` per language; `errors.generic.*` (see [error i18n](#error-i18n-entries)).
- `dashboard.json`: `modules.<module-name>.label` = entity `displayName`; `modules.<module-name>.cardDescription` from YAML `cardDescription` (omit only that key when absent); plus `title` and `description` used by `DashboardPage`.

```json
{
  "modules": {
    "<module-name>": {
      "label": "<entity-displayName-in-that-language>",
      "cardDescription": "<cardDescription-in-that-language>"
    }
  }
}
```

---

## AppDataGrid

Package: `@mui/x-data-grid` (**Community**), major version matched to the installed `@mui/material` major per current MUI X installation docs (e.g. `@mui/material` v9 → `@mui/x-data-grid` v8). No version hardcoded.

### Locked behaviour (not overridable by callers)

| Concern     | Setting                                                                                             | Rationale                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Selection   | `checkboxSelection={false}`, `disableRowSelectionOnClick`                                           | Selection not supported; both needed to avoid a half-disabled model                                                    |
| Filtering   | `disableColumnFilter`                                                                               | Hides filter icon                                                                                                      |
| Column menu | `disableColumnMenu`                                                                                 | Key prop: removes reorder/hide/pin/filter/sort menu                                                                    |
| Resize      | `disableColumnResize`                                                                               | No drag-to-resize                                                                                                      |
| Sorting     | `sortingMode="client"`                                                                              | Per-column sortable by default; callers set `sortable: false` per column                                               |
| Pagination  | client-side, `pageSizeOptions={[20]}`, initial `pageSize: 20`                                       | Single option hides the page-size selector; full dataset fetched once (performance not guaranteed past ~1 000 entries) |
| Loading     | `loading` prop → built-in MUI skeleton rows                                                         | `noRowsOverlay` suppressed while loading                                                                               |
| Empty       | `slots.noRowsOverlay` → `DataGridEmptyState` with caller-supplied **pre-translated** `emptyMessage` |                                                                                                                        |
| Height      | no `autoHeight`                                                                                     | Avoids layout shift; parent is a flex column and grid gets `sx={{ flex: 1 }}`                                          |

Props: `rows`, `columns: GridColDef<TRow>[]`, `loading`, `emptyMessage`, `sx?`, `disableVirtualization?` (pass in tests so rows render in jsdom). `TRow extends { id: string | number }`.

Action column convention: the **last** column is reserved for per-row actions, fully caller-defined via `renderCell` (AppDataGrid has no special handling, keeping it decoupled from navigation/mutation logic).

```tsx
import { EditActionLinkButton } from '@/core/components/atoms/EditActionLinkButton/EditActionLinkButton'

{
  field: 'actions',
  headerName: '',
  width: 80,
  sortable: false,
  filterable: false,
  renderCell: ({ row }) => (
    <EditActionLinkButton
      to={`/my-module/${row.id}`}
      ariaLabel={t('list.actions.edit')}
    />
  ),
}
```

`AppDataGrid.tsx`:

```tsx
import { useMemo } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { SxProps, Theme } from "@mui/material";
import { DataGridEmptyState } from "./DataGridEmptyState";

const PAGE_SIZE = 20;

type AppDataGridProps<TRow extends { id: string | number }> = {
  rows: TRow[];
  columns: GridColDef<TRow>[];
  loading: boolean;
  emptyMessage: string;
  sx?: SxProps<Theme>;
  disableVirtualization?: boolean; // Disable row/column virtualization. Pass in tests to ensure rows render in jsdom.
};

export function AppDataGrid<TRow extends { id: string | number }>({
  rows,
  columns,
  loading,
  emptyMessage,
  sx,
  disableVirtualization,
}: AppDataGridProps<TRow>) {
  const EmptyDataGridOverlay = useMemo(
    () =>
      function EmptyDataGridState() {
        return <DataGridEmptyState message={emptyMessage} />;
      },
    [emptyMessage],
  );

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      checkboxSelection={false}
      disableRowSelectionOnClick
      disableColumnFilter
      disableColumnMenu
      disableColumnResize
      sortingMode="client"
      pageSizeOptions={[PAGE_SIZE]}
      disableVirtualization={disableVirtualization}
      sx={sx}
      initialState={{
        pagination: {
          paginationModel: { pageSize: PAGE_SIZE },
        },
      }}
      slots={{
        noRowsOverlay: EmptyDataGridOverlay,
      }}
    />
  );
}
```

`DataGridEmptyState.tsx`:

```tsx
import { Box, Typography } from "@mui/material";

type DataGridEmptyStateProps = {
  message: string;
};

export function DataGridEmptyState({ message }: DataGridEmptyStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        height: "100%",
        py: 6,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
```

`AppDataGrid.test.tsx` (created only when a Vitest setup such as `src/test/setup.ts` exists):

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { GridColDef } from "@mui/x-data-grid";
import { AppDataGrid } from "./AppDataGrid";

// MUI DataGrid relies on ResizeObserver which is not available in jsdom.
// Must be a class (constructor) to satisfy the ResizeObserver interface.
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

type TestRow = { id: number; name: string };

const columns: GridColDef<TestRow>[] = [
  { field: "id", headerName: "ID", width: 100 },
  { field: "name", headerName: "Name", width: 200 },
];

const rows: TestRow[] = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

describe("AppDataGrid", () => {
  it("renders rows when data is provided", () => {
    render(
      <AppDataGrid
        rows={rows}
        columns={columns}
        loading={false}
        emptyMessage="No rows"
        disableVirtualization
      />,
    );

    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });

  it("renders the empty state when rows is empty and loading is false", () => {
    render(
      <AppDataGrid
        rows={[]}
        columns={columns}
        loading={false}
        emptyMessage="No rows"
        disableVirtualization
      />,
    );

    expect(screen.getByText("No rows")).toBeTruthy();
  });

  it("does not render the empty state while loading", () => {
    render(
      <AppDataGrid
        rows={[]}
        columns={columns}
        loading={true}
        emptyMessage="No rows"
        disableVirtualization
      />,
    );

    // MUI DataGrid suppresses noRowsOverlay when loading is true.
    expect(screen.queryByText("No rows")).toBeNull();
  });
});
```

jest-dom matchers, when used, are registered once in `src/test/setup.ts` via `@testing-library/jest-dom/vitest` — never imported inside a test file.

---

## ConfirmDialog

Standalone molecule at `src/core/components/molecules/ConfirmDialog/ConfirmDialog.tsx`, not module- or entity-specific; used before any destructive action (delete, archive, revoke…).

| Prop           | Type         | Required             | Purpose                                             |
| -------------- | ------------ | -------------------- | --------------------------------------------------- |
| `open`         | `boolean`    | Yes                  | Visibility; caller owns open/closed state           |
| `title`        | `string`     | Yes                  | Heading, e.g. "Delete order?"                       |
| `message`      | `string`     | Yes                  | Consequence of confirming                           |
| `confirmLabel` | `string`     | Yes                  | Destructive/confirm button label                    |
| `cancelLabel`  | `string`     | Yes                  | Cancel button label                                 |
| `onConfirm`    | `() => void` | Yes                  | Confirm click                                       |
| `onCancel`     | `() => void` | Yes                  | Cancel click or dismiss                             |
| `isConfirming` | `boolean`    | No (default `false`) | Disables both buttons while the action is in flight |

Design rules:

- No internal visibility state; derive `open` from caller state (e.g. `pendingId !== null`). Render it as a sibling of the primary content, not inside a conditional that would unmount it.
- No default copy; all strings passed in, translated via i18n — never hardcoded.
- `onConfirm` does not close the dialog. For async actions, clear pending state in `finally` once settled; `onCancel` clears it immediately.
- `isConfirming` disables **both** buttons, blocks Escape (`disableEscapeKeyDown`) and backdrop close, so the user cannot lose track of the in-flight request.
- Confirm button `color="error" variant="contained" autoFocus` (sensible default for destructive actions).
- No `children` / render props — strings and callbacks only.

```tsx
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isConfirming = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      disableEscapeKeyDown={isConfirming}
      onClose={() => {
        if (isConfirming) return;
        onCancel();
      }}
    >
      <DialogTitle sx={{ p: 3, pb: 1 }}>{title}</DialogTitle>
      <DialogContent sx={{ px: 3, pb: 2 }}>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onCancel} disabled={isConfirming}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={isConfirming}
          autoFocus
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

Usage example:

```tsx
import { useState } from "react";
import { ConfirmDialog } from "@/core/components/molecules/ConfirmDialog/ConfirmDialog";

function Example() {
  const [pendingId, setPendingId] = useState<string | null>(null);

  return (
    <ConfirmDialog
      open={pendingId !== null}
      title="Delete this item?"
      message="This action cannot be undone."
      confirmLabel="Delete"
      cancelLabel="Cancel"
      onConfirm={() => {
        // perform the action, then:
        setPendingId(null);
      }}
      onCancel={() => setPendingId(null)}
    />
  );
}
```

`ConfirmDialog.test.tsx` (when `vitest.config.ts` exists):

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders title, message, and button labels when open", () => {
    render(
      <ConfirmDialog
        open
        title="Delete order?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Delete order?")).toBeTruthy();
    expect(screen.getByText("This action cannot be undone.")).toBeTruthy();
    expect(screen.getByText("Delete")).toBeTruthy();
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("does not render when closed", () => {
    render(
      <ConfirmDialog
        open={false}
        title="Delete order?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByText("Delete order?")).toBeNull();
  });

  it("calls onConfirm when the confirm button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Delete order?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Delete"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Delete order?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables both buttons while isConfirming is true", () => {
    render(
      <ConfirmDialog
        open
        title="Delete order?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isConfirming
      />,
    );

    expect(screen.getByText("Delete").closest("button")).toBeDisabled();
    expect(screen.getByText("Cancel").closest("button")).toBeDisabled();
  });
});
```

---

## DeleteActionButton

Atom at `src/core/components/atoms/DeleteActionButton/DeleteActionButton.tsx` (requires `@mui/material` and `@mui/icons-material`). Click-driven (`onClick`), unlike `EditActionLinkButton` which navigates via `to`; intended to open a confirmation step, not to route. Props: `onClick`, `ariaLabel`, `disabled?`.

```tsx
import { IconButton } from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";

type DeleteActionButtonProps = {
  onClick: () => void;
  ariaLabel: string;
  disabled?: boolean;
};

export function DeleteActionButton({
  onClick,
  ariaLabel,
  disabled,
}: DeleteActionButtonProps) {
  return (
    <IconButton
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      size="small"
    >
      <DeleteRoundedIcon fontSize="small" />
    </IconButton>
  );
}
```

---

## Dashboard Page

`DashboardPage` loops over `navigationItems` (excluding `dashboard`) and renders one `DashboardModuleCard` per module — appending a module to `navigation.ts` is enough; no manual dashboard patching. Uses the `dashboard` namespace (`title`, `description`).

```tsx
// Example: DashboardPage.tsx after navigation.ts has been extended with the "orders" module entry.
// DashboardPage loops over navigationItems automatically — no manual patching required.
// This file is copied verbatim by react-layout-setup. Module entries appear here
// automatically once react-module-list appends them to navigation.ts.

import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { navigationItems } from "../../core/layout/navigation";
import { DashboardModuleCard } from "../../core/layout/components/DashboardModuleCard";

export function DashboardPage() {
  const { t } = useTranslation("dashboard");

  return (
    <Box component="section" sx={{ display: "grid", gap: 3 }}>
      <Box sx={{ display: "grid", gap: 1, maxWidth: 780 }}>
        <Typography component="h1" variant="h4">
          {t("title")}
        </Typography>
        <Typography color="text.secondary" variant="body1">
          {t("description")}
        </Typography>
      </Box>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        {navigationItems
          .filter((item) => item.id !== "dashboard")
          .map((item) => (
            <DashboardModuleCard
              key={item.id}
              id={item.id}
              to={item.to}
              label={item.label}
              Icon={item.Icon}
            />
          ))}
      </Box>
    </Box>
  );
}

export default DashboardPage;
```

---

## Validation Commands

After generating frontend code, sources format with prettier and build (and run tests when Vitest is configured); a failing build caused by the change must be fixed before the work is done. Commands as written in the sources:

```bash
npx prettier --write "src/modules/<module-name>/**/*.{ts,tsx}" "public/locales/**/*.json"
npm run build
npm test -- --run
```

---

## Conflicts and Gaps in Sources

| Topic                                                                               | Conflict / gap                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List hook URL                                                                       | The list-hook flow and checklist say the URL is built from `GlobalConfig.API_URL` (requires `src/core/config/config.ts`); the canonical template uses `apiFetch('/{module-name}')`. The template (`apiFetch`) is followed by every other hook. (`react-query-hook-launchpad`)                                             |
| `ApiError` kind                                                                     | Reference code is a plain **interface** ("not a class"); skill summaries call it a class. (`react-query-error-handling-launchpad`, `error-handling-launchpad`)                                                                                                                                                            |
| `KNOWN_API_ERROR_CODES`                                                             | The error-handling scaffold intro mentions adding `KNOWN_API_ERROR_CODES`, but the reference states codes pass through unfiltered and defines no such constant. (`react-query-error-handling-launchpad`)                                                                                                                  |
| `useErrorToast` location                                                            | Declared as `src/core/hooks/useErrorToast.ts`, but the `QueryProvider` template imports it from `../components/ErrorToastProvider`; no canonical `useErrorToast.ts` body is provided (only "throws outside the provider"). (`react-query-error-handling-launchpad`)                                                       |
| Success toast                                                                       | `useSuccessToast` / `SuccessToastProvider` are described but have no canonical code; the create flow does not show a success toast while update does. (`react-module-form-launchpad`)                                                                                                                                     |
| `use{Entity}Create`                                                                 | No template asset; only a textual contract. (`react-module-form-launchpad`)                                                                                                                                                                                                                                               |
| jest-dom                                                                            | Error-toast tests forbid `@testing-library/jest-dom`; the AppDataGrid flow says its test uses `toBeInTheDocument` (the asset actually uses `toBeTruthy`); the ConfirmDialog test uses `toBeDisabled()` (jest-dom). (`react-query-error-handling-launchpad`, `react-datagrid-launchpad`, `react-confirm-dialog-launchpad`) |
| Radio reference name                                                                | Module-form flow references `radiogroup.md`; the actual atom reference is `radio.md`. (`react-module-form-launchpad`, `react-form-fields-launchpad`)                                                                                                                                                                      |
| `EditActionLinkButton`, `CreateActionLinkButton`, `DashboardModuleCard`, `apiFetch` | Used but no canonical code in these sources.                                                                                                                                                                                                                                                                              |
| Package manager                                                                     | Sources use `npm` / `npx` commands.                                                                                                                                                                                                                                                                                       |

---

## Sources

`react-api-parser-launchpad`, `react-query-hook-launchpad`, `react-query-error-handling-launchpad`, `react-form-fields-launchpad`, `react-module-form-launchpad`, `react-module-list-launchpad`, `react-module-create-launchpad`, `react-module-update-launchpad`, `react-module-delete-launchpad`, `react-datagrid-launchpad`, `react-confirm-dialog-launchpad`, `react-delete-action-button-launchpad`, `error-handling-launchpad`

Extracted from NexusInnovation/nexus-plugin-marketplace plugins/launchpad on 2026-11-24.
