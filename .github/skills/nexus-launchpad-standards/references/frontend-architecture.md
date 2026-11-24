# Frontend Architecture Standards (React TypeScript)

Foundation standards for a Nexus launchpad React TypeScript frontend: scaffold, packages, structure, tooling, runtime config, i18n, routing, app shell, error boundary and Entra ID authentication.

## Contents

- [Baseline composition](#baseline-composition)
- [Package manager and Node](#package-manager-and-node)
- [Vite scaffold and boilerplate cleanup](#vite-scaffold-and-boilerplate-cleanup)
- [Standard runtime packages](#standard-runtime-packages)
- [File and folder structure](#file-and-folder-structure)
- [Naming conventions](#naming-conventions)
- [Import aliases](#import-aliases)
- [Linting and formatting](#linting-and-formatting)
- [Testing](#testing)
- [Runtime configuration](#runtime-configuration)
- [Internationalization (i18n)](#internationalization-i18n)
- [Routing](#routing)
- [Layout and app shell](#layout-and-app-shell)
- [Dynamic page titles](#dynamic-page-titles)
- [Global error boundary](#global-error-boundary)
- [Entra ID authentication (MSAL React)](#entra-id-authentication-msal-react)
- [Entra app registration conventions](#entra-app-registration-conventions)
- [Reference file map](#reference-file-map)
- [Conflicts and gaps in the sources](#conflicts-and-gaps-in-the-sources)
- [Sources](#sources)

---

## Baseline composition

A complete frontend skeleton is made of these concerns, applied in this order (each layer assumes the previous ones exist):

| #   | Concern              | Result                                                                                                                             |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Node setup           | nvm + latest Node.js LTS installed and active                                                                                      |
| 2   | App scaffold         | Clean Vite `react-ts` project, boilerplate removed                                                                                 |
| 3   | Node version pin     | `.nvmrc` at the frontend root pinning the active Node version                                                                      |
| 4   | Import aliases       | `@/` → `src/`, `@public/` → `public/`                                                                                              |
| 5   | Linting              | ESLint (`eslint.config.ts`), Prettier, lint-staged, Husky                                                                          |
| 6   | Runtime packages     | MUI + Emotion, TanStack React Query, react-router-dom, zod                                                                         |
| 7   | Testing              | Vitest, Testing Library, jsdom, smoke test                                                                                         |
| 8   | Routing              | `RouterProvider` + Data Router, `/`, `/404`, `/healthcheck`                                                                        |
| 9   | i18n                 | i18next + react-i18next + HTTP backend, `public/locales`, `src/i18n`                                                               |
| 10  | Runtime config       | `window.RUNTIME_CONFIG`, `public/config.js`, `public/configs/config.{env}.js`, `GlobalConfig`                                      |
| 11  | Error boundary       | Custom class `ErrorBoundary` wrapping the app in `main.tsx`                                                                        |
| 12  | Layout               | Responsive `AppShell`, top bar, drawer, dashboard, navigation model                                                                |
| 13  | Form fields          | MUI + react-hook-form atom library (installs `react-hook-form`, `@hookform/resolvers`, `@mui/x-date-pickers`, `date-fns`)          |
| 14  | Data grid            | `AppDataGrid` (MUI X DataGrid) in `src/core/components/molecules/AppDataGrid/`                                                     |
| 15  | Confirm dialog       | `ConfirmDialog` in `src/core/components/molecules/ConfirmDialog/`                                                                  |
| 16  | Delete action button | `DeleteActionButton` atom in `src/core/components/atoms/DeleteActionButton/`                                                       |
| 17  | API response parser  | `src/core/api/parseResponse.ts` exporting `parseResponse` / `parseListResponse` (Zod `safeParse`, logs schema drift, never throws) |

Entra ID authentication is an additional layer applied on top of runtime config, layout and routing.

General rules that apply to every layer:

- Inspect the existing project first; only install what is missing from `package.json`.
- Use current compatible package versions from the official docs at setup time. **No package versions are pinned** by the standard.
- When an existing config/component of the same concern already exists, read it and confirm before replacing it.
- Each layer validates narrowly with `build` (and `test:run` when the test script exists) before moving on; on failure, fix only the files of that layer.
- A layer must not add wiring that belongs to another layer (e.g. the packages step adds no providers; the testing step adds no provider/router/i18n wiring; routing adds no auth wrappers).

---

## Package manager and Node

| Rule                           | Value                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------- |
| Node install                   | Via nvm, latest Node.js LTS (bundles npm)                                         |
| Node pin                       | `.nvmrc` at the frontend project root, containing the active Node.js version      |
| Package manager in the sources | `npm` (`npm create vite@latest`, `npm install`, `npm pkg set`, `npm exec`, `npx`) |

> **Repository rule (overrides the sources):** this repository's owner mandates **pnpm, never npm**. Translate every command: `npm install <pkg>` → `pnpm add <pkg>`, `npm install -D <pkg>` → `pnpm add -D <pkg>`, `npm run <script>` → `pnpm <script>` / `pnpm run <script>`, `npm exec <bin>` / `npx <bin>` → `pnpm exec <bin>` (or `pnpm dlx` for packages not installed), `npm create vite@latest` → `pnpm create vite`. The lockfile is `pnpm-lock.yaml`, never `package-lock.json`. Husky hooks and lint-staged must call `pnpm exec lint-staged`.

---

## Vite scaffold and boilerplate cleanup

Scaffold command (source form): `npm create vite@latest . -- --template react-ts --no-interactive`, run **inside** the target folder so files land at its root (no extra subfolder). `package.json` `name` is the folder name. Then install and build once to verify.

Default target folder: see [conflicts](#conflicts-and-gaps-in-the-sources) (`<cwd>/frontend/` vs `<cwd>/output.local/frontend/`).

Cleanup rules:

| Item                        | Action                                                                                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/assets/`               | Delete entire folder (demo images/SVGs)                                                                                                                                                        |
| `public/icons.svg`          | Delete (demo sprite)                                                                                                                                                                           |
| `README.md` (Vite template) | Delete                                                                                                                                                                                         |
| `public/favicon.svg`        | **Keep** (also used as the app logo)                                                                                                                                                           |
| `src/index.css`             | Delete — Vite default styles conflict with MUI; MUI `CssBaseline` provides the reset. Remove `import './index.css'` from `main.tsx`                                                            |
| `src/App.tsx`               | Replace with minimal Hello World (below)                                                                                                                                                       |
| `.gitignore`                | Must include `.vite/`; keep scaffold entries (`node_modules`, `dist`, `*.local`)                                                                                                               |
| `index.html`                | Must have `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`; `<title>` = project display name (`displayName.en` from the project YAML) when available, otherwise the Vite default |

```tsx
// src/App.tsx (initial scaffold)
function App() {
  return <h1>Hello World</h1>;
}

export default App;
```

```tsx
// src/main.tsx (initial scaffold)
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

---

## Standard runtime packages

All in `dependencies`. No version pinning; use current compatible versions.

| Group        | Packages                                                                                   | Introduced by                                     |
| ------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| UI           | `@mui/material`, `@emotion/react`, `@emotion/styled`                                       | runtime baseline                                  |
| Server state | `@tanstack/react-query`                                                                    | runtime baseline                                  |
| Routing      | `react-router-dom`                                                                         | runtime baseline (routing installs it if missing) |
| Validation   | `zod`                                                                                      | runtime baseline                                  |
| Icons        | `@mui/icons-material`                                                                      | layout                                            |
| i18n         | `i18next`, `react-i18next`, `i18next-http-backend`                                         | i18n                                              |
| Forms        | `react-hook-form`, `@hookform/resolvers`, `@mui/x-date-pickers`, `date-fns`                | form fields                                       |
| Data grid    | `@mui/x-data-grid` (major compatible with `@mui/material`)                                 | data grid                                         |
| Auth         | `@azure/msal-react`, `@azure/msal-browser` (must be `dependencies`, not `devDependencies`) | Entra auth                                        |

Dev dependencies:

| Group             | Packages                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Types for aliases | `@types/node` (must be in `devDependencies`; if found in `dependencies`, move it)                                              |
| Lint              | `eslint`, `@eslint/js`, `globals`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `jiti`     |
| Format / hooks    | `prettier`, `lint-staged`, `husky`                                                                                             |
| Test              | `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `@vitest/coverage-v8`, `jsdom` |

Explicitly **not** used: `react-error-boundary` (a custom class component is used instead), `.env`-based configuration (runtime config is used instead).

---

## File and folder structure

### Uniform scope pattern

Every scope (module, page, sub-module, and deeper) follows the same pattern:

```text
<Scope>/
  <Scope>.tsx          # Entry point — the only .tsx directly at this level
  <Child1>/            # Named folder for any significant child (component, hook, helper…)
    <Child1>.tsx
  <Child2>/
    <Child2>.tsx
  components/          # Small, self-contained components — private or shared at this scope
    SmallThing.tsx     #   (promote to a named folder if it grows significant)
  hooks/               # Small hooks — only if needed at this scope
  types/               # Shared types — only if needed at this scope
  helpers/             # Small helpers — only if needed at this scope
  constants/           # Shared constants — only if needed at this scope
```

### Top-level layout (structure guide)

```text
src/
├── modules/
│   └── <module-name>/
│       ├── <Page1>/
│       │   └── <Page1>.tsx
│       ├── <Page2>/
│       │   └── <Page2>.tsx
│       ├── components/        # Shared across pages in this module
│       ├── store/             # Always at module level, regardless of which pages use it
│       ├── hooks/             # Only if shared across pages
│       └── types/             # Only if shared across pages
└── core/                      # Cross-cutting concerns, never feature-specific
    ├── design/
    │   ├── theme/             # MUI theme configuration
    │   ├── atom/              # Atomic design: basic building blocks
    │   └── molecules/         # Atomic design: composed components
    ├── layout/                # App shell, nav, page wrappers
    ├── configs/               # App-level configuration and constants
    ├── auth/                  # Authentication logic, guards, providers
    └── components/            # Shared UI components (404, 401, ErrorBoundary, etc.)
```

Folders actually produced by the scaffold layers (see [conflicts](#conflicts-and-gaps-in-the-sources) for differences with the guide above): `src/core/config/`, `src/core/auth/`, `src/core/layout/`, `src/core/components/`, `src/core/components/atoms/`, `src/core/components/molecules/`, `src/core/api/`, `src/core/hooks/`, `src/i18n/`, `src/routes/`, `src/routes/pages/`, `src/test/`.

### Anatomy of a scope

| What lives at a scope's root                 | Rule                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<Scope>.tsx`                                | Exactly one entry point — always named after the folder                                                                                                                                                                                                                                                       |
| `<Child>/`                                   | One named folder per **significant** direct child — any artifact (component, hook, helper…) big or complex enough to be a first-class concern. A child deserves its own folder when a developer opening the parent should see it immediately, or when it needs its own private helpers, types or sub-children |
| `components/`                                | Small, self-contained components (private or shared at this scope); flat files; present only when needed                                                                                                                                                                                                      |
| `hooks/`, `types/`, `helpers/`, `constants/` | Present only when shared between ≥2 named children or the entry point                                                                                                                                                                                                                                         |
| `store/`                                     | Module level only — always at `<module-name>/store/`                                                                                                                                                                                                                                                          |

### Leaf folder rules

- `components/` holds small, self-contained components. Test: _would a developer opening this folder need to immediately understand this component to grasp the scope?_ No → `components/`. Yes → named subfolder.
- Heuristic: components under ~100–150 lines with no meaningful subtree live in `components/`; large, complex or structurally central ones get a named subfolder.
- Same logic for non-components: a large hook with its own helpers/types gets a folder, e.g. `useEmployeeSearch/useEmployeeSearch.ts` with its own `helpers/` and `types/`.
- Small hooks, helpers and constants live in the closest ancestor's matching leaf folder — only when shared between ≥2 siblings.
- When an artifact in a leaf folder grows significant, promote it to `<Parent>/<Thing>/<Thing>.ts(x)`.
- `components/` must **never repeat** in a path: `Page/components/Wizard/components/` is wrong — promote `Wizard` to `Page/Wizard/`.

### Placement rules

Core question: **what is the smallest scope that needs this?**

| What you're creating                                              | Where it goes                                                                       |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| A new page                                                        | `src/modules/<module>/<Page>/<Page>.tsx` — entry point always inside its own folder |
| Small self-contained component (private or shared within a scope) | `<Parent>/components/<Comp>.tsx`                                                    |
| Significant component (large, complex, structurally central)      | `<Parent>/<Child>/<Child>.tsx`                                                      |
| Component shared across all pages of a module                     | `src/modules/<module>/components/<Shared>.tsx`                                      |
| Component shared across all modules                               | `src/core/components/<Shared>.tsx`                                                  |
| Hook/type/helper/constant                                         | Closest ancestor's matching leaf folder, only when shared between ≥2 siblings       |
| Module-level state                                                | `src/modules/<module>/store/` — always, regardless of which pages use it            |
| Auth logic, guards, providers                                     | `src/core/auth/`                                                                    |
| MUI theme                                                         | `src/core/design/theme/`                                                            |
| App layout (shell, nav)                                           | `src/core/layout/`                                                                  |
| New feature module                                                | `src/modules/<module-name>/` (kebab-case folder, PascalCase files)                  |

### Examples

```text
src/modules/entities/
  components/
    EntityPreview.tsx           # shared by ListEntities and CreateEntity — flat file
  store/
  ListEntities/
    ListEntities.tsx
  CreateEntity/
    CreateEntity.tsx            # renders EntityModal (small) and Wizard (complex)
    components/
      EntityModal.tsx           # small, self-contained — lives in components/
    Wizard/
      Wizard.tsx                # renders WizardStep1, WizardStep2, WizardStep3
      WizardStep1/
        WizardStep1.tsx
      WizardStep2/
        WizardStep2.tsx
      WizardStep3/
        WizardStep3.tsx
      components/               # only if steps share a component — absent until then
```

CRUD example (form shared by create and details pages → module `components/`; tables render their own rows → named subfolders):

```text
src/modules/
├── employees/
│   ├── components/
│   │   └── EmployeeForm.tsx          # shared leaf — CreateEmployee + EmployeeDetails
│   ├── store/
│   ├── types/
│   │   └── employeeTypes.ts
│   ├── ListEmployees/
│   │   ├── ListEmployees.tsx
│   │   ├── components/
│   │   │   ├── AddButton.tsx
│   │   │   ├── Breadcrumbs.tsx
│   │   │   └── TableHeader.tsx
│   │   └── EmployeesTable/
│   │       ├── EmployeesTable.tsx
│   │       └── components/
│   │           ├── EmployeeRow.tsx
│   │           └── StatusBadge.tsx
│   ├── CreateEmployee/
│   │   └── CreateEmployee.tsx
│   └── EmployeeDetails/
│       └── EmployeeDetails.tsx
└── projects/
    ├── components/
    │   └── ProjectForm.tsx
    ├── store/
    ├── types/
    │   └── projectTypes.ts
    ├── ListProjects/
    │   ├── ListProjects.tsx
    │   ├── components/
    │   │   ├── AddButton.tsx
    │   │   └── TableHeader.tsx
    │   └── ProjectsTable/
    │       ├── ProjectsTable.tsx
    │       └── components/
    │           └── ProjectRow.tsx
    ├── CreateProject/
    │   └── CreateProject.tsx
    └── ProjectDetails/
        └── ProjectDetails.tsx
```

When placement is ambiguous, both options are valid candidates and the choice is made by the developer with a short rationale.

---

## Naming conventions

| Item                  | Convention                                                            | Example                                                            |
| --------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| React component files | PascalCase                                                            | `UserProfile.tsx`, `LoginPage.tsx`                                 |
| Non-component files   | camelCase                                                             | `useAuth.ts`, `formatDate.ts`, `userTypes.ts`                      |
| Extension             | `.tsx` only when the file contains JSX; `.ts` otherwise               |                                                                    |
| Test files            | `<subject>.test.ts` / `<subject>.test.tsx` — **never** `.spec.ts`     | `error-boundary.test.tsx`                                          |
| Module folders        | kebab-case                                                            | `src/modules/purchase-orders/`                                     |
| Scope entry point     | Same name as its folder                                               | `Wizard/Wizard.tsx`                                                |
| Route page components | `{Name}Page` in `src/routes/pages/`                                   | `DashboardPage.tsx`, `NotFoundPage.tsx`                            |
| Runtime config keys   | SCREAMING_SNAKE_CASE, valid JS identifier                             | `API_URL`, `CLIENT_ID`                                             |
| Exports               | Named exports for components/pages; route pages also `export default` | `export function DashboardPage()` + `export default DashboardPage` |

---

## Import aliases

| Alias      | Target    |
| ---------- | --------- |
| `@/`       | `src/`    |
| `@public/` | `public/` |

`vite.config.ts` (merge into existing `resolve.alias`, never remove existing aliases):

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@public": path.resolve(__dirname, "./public"),
    },
  },
});
```

`tsconfig.app.json` → `compilerOptions` (merge into existing `paths`):

```json
"paths": {
  "@/*": ["./src/*"],
  "@public/*": ["./public/*"]
}
```

Requires `@types/node` in `devDependencies`. Validate with `tsc --noEmit`. Usage: `import Foo from '@/components/Foo'`, `import logo from '@public/logo.svg'`. Restart the dev server after changing aliases.

---

## Linting and formatting

### ESLint

- Config file **must** be `eslint.config.ts` (flat config). Never `eslint.config.js`/`.mjs`. Remove legacy `.eslintrc*` and `.eslintignore` (move ignore entries into `globalIgnores`), so there is a single authoritative config.
- Default profile is **non-typed** (no `projectService`) unless type-aware linting is explicitly requested.
- Do not add extra plugins (import-order, accessibility) or formatting rules in ESLint for the baseline.
- `tsconfig.node.json` `include` must contain `vite.config.ts` and `eslint.config.ts`.

```ts
// eslint.config.ts
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {},
  },
  {
    files: ["vite.config.ts", "eslint.config.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
```

Consequence of `react-refresh/only-export-components`: files that export a router or constants must not also export components (e.g. `RouteHydrateFallback` lives in its own file).

### Prettier

`.prettierrc.json` (no extra options unless required):

```json
{
  "semi": false,
  "singleQuote": true
}
```

`.prettierignore`:

```text
dist
node_modules
.husky
```

Locale JSON files are always written as multi-line objects (never single-line object notation) and formatted with Prettier (`prettier --write "public/locales/**/*.json"`).

### lint-staged

`.lintstagedrc.json` — ESLint then Prettier for source files; never add `git add`:

```json
{
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css,html,yml,yaml}": "prettier --write"
}
```

### Husky

| Layout                                 | Setup                                                                                                                     | `.husky/pre-commit`                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Frontend folder **is** the Git root    | `husky init`                                                                                                              | `npm exec lint-staged` (pnpm here: `pnpm exec lint-staged`) |
| Frontend **nested** under the Git root | `prepare` script: `cd <path-to-git-root-from-frontend> && husky <frontend-path-from-git-root>/.husky`, then run `prepare` | see below                                                   |

Nested hook template (POSIX-compliant; source form — in this repository the last line is `pnpm exec lint-staged`):

```sh
#!/usr/bin/env sh
cd <frontend-path-from-git-root> || exit 1
npm exec lint-staged
```

The `prepare` script must chain with `&&`, **never** `;` (scripts run through `cmd.exe` on Windows where `;` does not chain). The hook lives in the frontend project's `.husky/` directory.

### Scripts

| Script         | Command                                       |
| -------------- | --------------------------------------------- |
| `lint`         | `eslint .`                                    |
| `lint:fix`     | `eslint . --fix`                              |
| `format`       | `prettier . --write`                          |
| `format:check` | `prettier . --check`                          |
| `prepare`      | Husky install (nested form above when needed) |

Validation: `eslint .`, `prettier . --check`, `lint-staged --diff="HEAD"`, `prepare` all succeed.

---

## Testing

| Rule       | Value                                                                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runner     | Vitest, environment `jsdom`, `globals: true`                                                                                                                                             |
| Library    | `@testing-library/react`, `@testing-library/user-event`                                                                                                                                  |
| Matchers   | `@testing-library/jest-dom`, imported via the **`/vitest`** entrypoint so matchers type-check under `tsc -b`                                                                             |
| Coverage   | `@vitest/coverage-v8`, provider `v8`, reporters `text` + `html`                                                                                                                          |
| Config     | `vitest.config.ts` **reuses** `vite.config.ts` via `mergeConfig`; never duplicate aliases or plugins                                                                                     |
| Setup file | `src/test/setup.ts`                                                                                                                                                                      |
| Placement  | App-level tests under `src/test/` (`app.smoke.test.tsx`, `layout.test.tsx`, `error-boundary.test.tsx`); components may colocate tests (e.g. `AppDataGrid.test.tsx` beside the component) |
| Naming     | `*.test.ts(x)`, never `.spec`                                                                                                                                                            |
| Scope      | Baseline adds no MUI theme provider, `QueryClientProvider`, `RouterProvider` or i18n bootstrapping in test helpers                                                                       |
| Recovery   | When a test fails after an integration change, fix the integration, not the test                                                                                                         |

Scripts: `test` = `vitest`, `test:run` = `vitest run`, `test:coverage` = `vitest run --coverage`. Keep the script surface small.

```ts
// vitest.config.ts
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.ts",
      coverage: {
        provider: "v8",
        reporter: ["text", "html"],
      },
    },
  }),
);
```

```ts
// src/test/setup.ts (baseline, before i18n)
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

Initial smoke test `src/test/app.smoke.test.tsx` renders `<App />` and expects `Hello World`; once routing exists it renders `RouterProvider` at `/` and expects the `Dashboard` heading:

```tsx
import { render, screen } from "@testing-library/react";
import { RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { router } from "../routes/router";

describe("routing", () => {
  it("renders the home page at the default route", async () => {
    window.history.pushState({}, "", "/");

    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole("heading", { name: "Dashboard" }),
    ).toBeTruthy();
  });
});
```

The i18n-aware setup file (seeding translations from `public/locales`) is shown in [Internationalization](#internationalization-i18n).

---

## Runtime configuration

Configuration is injected at runtime through a `window.RUNTIME_CONFIG` global loaded by a plain `<script>` tag, so per-environment values can be swapped **without rebuilding**. `.env` files are not used for frontend configuration.

| File                             | Role                                                                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/config.js`               | Local development config, used directly by `vite dev`; **committed** so every developer can start without setup                                                                                   |
| `public/configs/config.{env}.js` | One per deployment environment (default: `dev`, `uat`, `prod`); never served by Vite. At deployment (container startup, nginx, or pipeline step) the right file is copied over `public/config.js` |
| `src/core/config/config.ts`      | Global declaration, `Config` type, typed `GlobalConfig` export. Other files in `src/core/config/` (e.g. `api-routes.ts`, `react-query.ts`) are left untouched                                     |
| `index.html`                     | `<script src="/config.js"></script>` as the **first** `<script>` in `<head>`, before the module entry, so the global exists before the bundle runs                                                |

Keys:

| Key         | Type     | Local value                                                                                                                                                                                           | Deployed value                                                                                                   |
| ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `ENV`       | `string` | `development`                                                                                                                                                                                         | the environment name (`dev`, `uat`, `prod`)                                                                      |
| `API_URL`   | `string` | backend `applicationUrl` from `Properties/launchSettings.json` (first profile) + `/api`, e.g. `https://localhost:7035/api`; fallback `https://localhost:5001/api` when the backend does not exist yet | standard pattern `https://{applicationName}-{env}-backend.azurewebsites.net/api`, or custom per-environment URLs |
| `TENANT_ID` | `string` | Entra tenant ID (added by Entra auth)                                                                                                                                                                 | same tenant                                                                                                      |
| `CLIENT_ID` | `string` | dev SPA client ID (added by Entra auth)                                                                                                                                                               | client ID of that environment                                                                                    |

`{applicationName}` is derived from `project-name` in the project YAML (`input/project.yaml`).

```js
// public/config.js
window.RUNTIME_CONFIG = {
  ENV: "development",
  API_URL: "{local-api-url}",
};
```

```js
// public/configs/config.{env}.js
window.RUNTIME_CONFIG = {
  ENV: "{env}",
  API_URL: "{env-api-url}",
};
```

```ts
// src/core/config/config.ts
declare global {
  var RUNTIME_CONFIG: {
    ENV: string;
    API_URL: string;
  };
}

type Config = {
  ENV: string;
  API_URL: string;
};

const rawConfig: Config = {
  ENV: globalThis.RUNTIME_CONFIG?.ENV,
  API_URL: globalThis.RUNTIME_CONFIG?.API_URL,
};

const GlobalConfig = rawConfig;

export { GlobalConfig };
```

### Adding a property

A new key must be added in **all five places**, appended at the end of each object, preserving existing entries:

1. `public/config.js` (local value)
2. every `public/configs/config.{env}.js` (per-environment value)
3. `declare global` → `RUNTIME_CONFIG` shape
4. `Config` type
5. `rawConfig` (`KEY: globalThis.RUNTIME_CONFIG?.KEY`)

Default type is `string`. Unknown values use placeholders (`'PLACEHOLDER'` for strings, `false` for booleans) and must be listed for completion before deploying. Consumers read `GlobalConfig.KEY`.

---

## Internationalization (i18n)

| Rule              | Value                                                                                                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Libraries         | `i18next`, `react-i18next` (`initReactI18next`), `i18next-http-backend`                                                                                                                   |
| Languages         | `supportedLanguages = ['en', 'fr']`, `defaultLanguage = 'en'` (also `fallbackLng`)                                                                                                        |
| Namespaces        | `common` (default, shared shell copy), `dashboard` (home page); `auth` added by Entra auth                                                                                                |
| Locale layout     | `public/locales/{{lng}}/{{ns}}.json` — **all** locales, including English, are loaded over HTTP; English is never bundled in code                                                         |
| Lazy loading      | `useTranslation('<ns>')` loads namespaces on demand; `react.useSuspense: true` + `bindI18n: 'languageChanged loaded'`; the routed outlet/shell is wrapped in `<Suspense fallback={null}>` |
| Bootstrap         | `src/i18n/index.ts`, imported as `import './i18n'` in `main.tsx` before render                                                                                                            |
| Key typing        | `src/i18n/config.ts` holds language/namespace constants and types only (no localized values). A typed `AppResources` interface, when present, must be extended for every new key          |
| Tests             | HTTP backend disabled when `import.meta.env.MODE === 'test'`; `src/test/setup.ts` seeds bundles from the same `public/locales` JSON files                                                 |
| Interpolation     | `escapeValue: false`                                                                                                                                                                      |
| Operational pages | `HealthcheckPage` stays untranslated (plain `alive`)                                                                                                                                      |
| Hardcoded copy    | Once i18n exists, generated shell/page copy must come from locale files, never inline strings; do not create a second translation mechanism                                               |
| Out of baseline   | No per-feature namespace architecture beyond the routed baseline (language switcher belongs to the layout)                                                                                |

```ts
// src/i18n/config.ts
export const supportedLanguages = ["en", "fr"] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage = "en" as const;
export const defaultNamespace = "common" as const;
export const namespaces = ["common", "dashboard"] as const;
export type AppNamespace = (typeof namespaces)[number];
```

```ts
// src/i18n/index.ts
import i18n from "i18next";
import HttpBackend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import {
  defaultLanguage,
  defaultNamespace,
  namespaces,
  supportedLanguages,
} from "./config";

const isTest = import.meta.env.MODE === "test";

function requestLocale(
  _options: unknown,
  url: string,
  _payload: unknown,
  callback: (
    error: Error | null,
    response: { status: number; data: string },
  ) => void,
) {
  void fetch(url)
    .then(async (response) => {
      callback(null, {
        status: response.status,
        data: await response.text(),
      });
    })
    .catch((error: unknown) => {
      callback(
        error instanceof Error
          ? error
          : new Error("Failed to load locale resource."),
        {
          status: 500,
          data: "",
        },
      );
    });
}

const i18nInstance = isTest ? i18n : i18n.use(HttpBackend);

void i18nInstance.use(initReactI18next).init({
  lng: defaultLanguage,
  fallbackLng: defaultLanguage,
  supportedLngs: [...supportedLanguages],
  ns: [...namespaces],
  defaultNS: defaultNamespace,
  ...(isTest
    ? {}
    : {
        backend: {
          loadPath: "/locales/{{lng}}/{{ns}}.json",
          request: requestLocale,
        },
      }),
  interpolation: {
    escapeValue: false,
  },
  react: {
    bindI18n: "languageChanged loaded",
    useSuspense: true,
  },
});

export default i18n;
```

Baseline locale files:

| File                               | Content                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `public/locales/en/common.json`    | `{ "notFound": { "title": "404", "description": "Page not found." } }`       |
| `public/locales/fr/common.json`    | `{ "notFound": { "title": "404", "description": "Page introuvable." } }`     |
| `public/locales/en/dashboard.json` | `{ "title": "Dashboard" }` — later extended with `description` and `modules` |
| `public/locales/fr/dashboard.json` | `{ "title": "Tableau de bord" }`                                             |

(Shown inline for brevity; write them as multi-line JSON.)

Page usage patterns:

```tsx
const { t } = useTranslation("dashboard"); // namespace
const { t } = useTranslation("common", { keyPrefix: "notFound" }); // namespace + key prefix
```

Test setup seeding (requires `"types": ["vite/client", "node"]` in `tsconfig.app.json` `compilerOptions` because it uses Node APIs):

```ts
// src/test/setup.ts (with i18n)
import fs from "node:fs/promises";
import path from "node:path";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

const { default: i18n } = await import("../i18n");

const commonEn = JSON.parse(
  await fs.readFile(
    path.resolve(process.cwd(), "public/locales/en/common.json"),
    "utf8",
  ),
);
const homeEn = JSON.parse(
  await fs.readFile(
    path.resolve(process.cwd(), "public/locales/en/dashboard.json"),
    "utf8",
  ),
);

i18n.addResourceBundle("en", "common", commonEn, true, true);
i18n.addResourceBundle("en", "dashboard", homeEn, true, true);

await i18n.changeLanguage("en");

afterEach(() => {
  cleanup();
});
```

Keep the `@testing-library/jest-dom/vitest` import in the setup file as well (required by the testing baseline). Every new namespace must be registered in `namespaces` and seeded in tests that need it. The English `dashboard.title` stays `Dashboard` so the smoke test remains stable.

---

## Routing

| Rule           | Value                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Router         | `createBrowserRouter` (Data Router) rendered by `<RouterProvider>` in `main.tsx`; `main.tsx` keeps routing ownership      |
| Location       | Dedicated `src/routes/` folder (`router.tsx`, `RouteHydrateFallback.tsx`, `pages/`) — not a single top-level `routes.tsx` |
| Root route     | `path: '/'`, `Component: App`, `HydrateFallback: RouteHydrateFallback` (avoids hydration warnings with lazy routes)       |
| `App.tsx`      | Root layout route rendering an `Outlet` (later wrapped in `Suspense` / replaced by `AppShell`)                            |
| Lazy routes    | Each page loaded with `lazy: async () => { const { X } = await import(...); return { Component: X } }`                    |
| Default route  | Home/dashboard as the `index` route at `/`                                                                                |
| `/404`         | Explicit route, **even though** the catch-all redirects there                                                             |
| Catch-all      | `path: '*'` → `<Navigate to="/404" replace />`                                                                            |
| `/healthcheck` | Explicit route returning plain `alive` text (operational, untranslated)                                                   |
| Pages          | Minimal; no theme provider, layout or auth wiring; `NotFoundPage` has no own `<main>` wrapper (a layout wraps it)         |
| Auth           | No guard in the base router; the Entra layer wraps the root (see below)                                                   |
| Module routes  | `/{module-name}` (list), `/{module-name}/create`, `/{module-name}/:id` (update) are added per module                      |

```tsx
// src/routes/RouteHydrateFallback.tsx
export function RouteHydrateFallback() {
  return null;
}
```

```tsx
// src/routes/router.tsx
import { Navigate, createBrowserRouter } from "react-router-dom";
import App from "../App";
import { RouteHydrateFallback } from "./RouteHydrateFallback";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    HydrateFallback: RouteHydrateFallback,
    children: [
      {
        index: true,
        lazy: async () => {
          const { DashboardPage } = await import("./pages/DashboardPage");
          return { Component: DashboardPage };
        },
      },
      {
        path: "404",
        lazy: async () => {
          const { NotFoundPage } = await import("./pages/NotFoundPage");
          return { Component: NotFoundPage };
        },
      },
      {
        path: "healthcheck",
        lazy: async () => {
          const { HealthcheckPage } = await import("./pages/HealthcheckPage");
          return { Component: HealthcheckPage };
        },
      },
      {
        path: "*",
        element: <Navigate to="/404" replace />,
      },
    ],
  },
]);
```

```tsx
// src/routes/pages/HealthcheckPage.tsx
export function HealthcheckPage() {
  return <>alive</>;
}

export default HealthcheckPage;
```

```tsx
// src/routes/pages/NotFoundPage.tsx (with i18n)
import { useTranslation } from "react-i18next";

export function NotFoundPage() {
  const { t } = useTranslation("common", { keyPrefix: "notFound" });

  return (
    <>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </>
  );
}

export default NotFoundPage;
```

### Final `main.tsx` provider order (without auth)

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "./core/components/ErrorBoundary";
import "./i18n";
import { router } from "./routes/router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
);
```

(The source templates also keep `import './index.css'`; see [conflicts](#conflicts-and-gaps-in-the-sources).)

---

## Layout and app shell

### Rules

- Shell lives under `src/core/layout/`: main shell in named folder `AppShell/`, small optional pieces in `src/core/layout/components/`.
- Full-width fixed top `AppBar` spanning the viewport (drawer sits **behind** it, not beside it); hamburger on the left on small screens; optional language switcher + profile area on the right.
- Left `Drawer` (width `280`): `permanent` on desktop, `temporary` on mobile (`theme.breakpoints.down('md')`), `keepMounted`; company logo (`/favicon.svg`) centred in its header; navigation links in the body.
- Main content area renders the routed `Outlet`, max width `1280`, centred.
- Shared toolbar height token `appShellToolbarHeight = 72` in `AppShell/constants.ts`.
- `AppShell` owns `mobileOpen` state; `ShellDrawer` owns navigation rendering and active-route detection; `ShellTopBar` owns app bar, hamburger, language switcher and profile area.
- Active route is visually identified (selected style, bold label, primary icon colour) and exposed through `aria-current="page"` (via `NavLink`); `/` matches exactly, other routes match `to` or `to/…`.
- Profile area is a neutral placeholder (`Avatar` "U", `layout.profileName`, `layout.profileSubtitle`) until auth replaces it.
- Language switcher only when i18n exists **and** `supportedLanguages.length > 1`, checked at runtime in the top bar.
- No real access control, remote profile data or module business pages in the shell layer; no product-specific theme system.
- `App.tsx` renders `<Suspense fallback={null}><AppShell /></Suspense>` (Suspense required by `useSuspense: true`).
- Shell assets are copied verbatim; no substitutions except `appBrand.label`.

```tsx
// src/App.tsx (with layout)
import { Suspense } from "react";
import { AppShell } from "./core/layout/AppShell/AppShell";

function App() {
  return (
    <Suspense fallback={null}>
      <AppShell />
    </Suspense>
  );
}

export default App;
```

### Navigation model — `src/core/layout/navigation.ts`

Checked-in TypeScript (the frontend never parses YAML at runtime). Only substitution: `appBrand.label` = `displayName.en` from the project YAML (human-readable, not the `project-name` slug). Initially `ModuleId = never` and only the dashboard entry exists; each module appends its own `ModuleId` member and navigation item when its list page is scaffolded. The project YAML is read only for `project-name`, `displayName` and `languages`; module YAML files are not read by the shell layer.

```ts
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import type { SvgIconComponent } from "@mui/icons-material";

export type ModuleId = never; // extended per-module by react-module-list

export type NavigationItem = {
  id: "dashboard" | ModuleId;
  label: string;
  translationKey: string;
  to: string;
  Icon: SvgIconComponent;
};

export const appBrand = {
  label: "sample-project", // replace with displayName.en from project.yaml (human-readable, not project-name slug)
  logoSrc: "/favicon.svg",
};

export const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    translationKey: "navigation.dashboard",
    to: "/",
    Icon: DashboardRoundedIcon,
  },
  // module navigation items are appended here by react-module-list
];
```

### `src/core/layout/AppShell/AppShell.tsx`

```tsx
import { Box, Toolbar, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ShellDrawer } from "./ShellDrawer";
import { ShellTopBar } from "./ShellTopBar";
import { appShellToolbarHeight } from "./constants";

export function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, rgba(248,250,252,0.96) 0%, rgba(255,255,255,1) 24%)",
      }}
    >
      <ShellTopBar
        isMobile={isMobile}
        onMenuClick={() => setMobileOpen((value) => !value)}
      />

      <ShellDrawer
        isMobile={isMobile}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, sm: 3, lg: 4 },
          py: { xs: 2, sm: 3 },
        }}
      >
        <Toolbar sx={{ minHeight: appShellToolbarHeight }} />
        <Box sx={{ mx: "auto", width: "100%", maxWidth: 1280 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
```

```ts
// src/core/layout/AppShell/constants.ts
export const appShellToolbarHeight = 72;
```

### `src/core/layout/AppShell/ShellDrawer.tsx`

```tsx
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import { appBrand, navigationItems } from "../navigation";
import { appShellToolbarHeight } from "./constants";

export const drawerWidth = 280;

function matchesCurrentPath(pathname: string, to: string) {
  if (to === "/") {
    return pathname === "/";
  }

  return pathname === to || pathname.startsWith(`${to}/`);
}

type ShellDrawerProps = {
  isMobile: boolean;
  open: boolean;
  onClose: () => void;
};

export function ShellDrawer({ isMobile, open, onClose }: ShellDrawerProps) {
  const theme = useTheme();
  const location = useLocation();
  const { t } = useTranslation("common");

  const content = (
    <Box
      component="nav"
      aria-label={t("layout.primaryNavigation")}
      sx={{ display: "flex", height: "100%", flexDirection: "column" }}
    >
      <Toolbar
        sx={{
          alignItems: "center",
          justifyContent: "center",
          borderBottom: `1px solid ${theme.palette.divider}`,
          minHeight: appShellToolbarHeight,
        }}
      >
        <Box
          alt={t("layout.companyLogoAlt")}
          component="img"
          src={appBrand.logoSrc}
          sx={{ height: 34, width: 34 }}
        />
      </Toolbar>
      <List sx={{ px: 1.5, py: 2 }}>
        {navigationItems.map(({ id, label, to, translationKey, Icon }) => {
          const isActive = matchesCurrentPath(location.pathname, to);

          return (
            <ListItem key={id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                end={to === "/"}
                onClick={onClose}
                selected={isActive}
                to={to}
                sx={{
                  borderRadius: 2,
                  color: "text.secondary",
                  gap: 1,
                  py: 1.25,
                  "&.active, &.Mui-selected": {
                    backgroundColor: theme.palette.action.selected,
                    color: "text.primary",
                  },
                  "&.active .MuiListItemIcon-root, &.Mui-selected .MuiListItemIcon-root":
                    {
                      color: "primary.main",
                    },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontWeight: isActive ? 700 : 500 }}>
                      {t(translationKey as never, {
                        defaultValue: label,
                      })}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box
      component="aside"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      <Drawer
        ModalProps={{ keepMounted: true }}
        onClose={onClose}
        open={open}
        sx={{
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundColor: "rgba(255,255,255,0.94)",
            backgroundImage: "none",
          },
        }}
        variant={isMobile ? "temporary" : "permanent"}
      >
        {content}
      </Drawer>
    </Box>
  );
}
```

### `src/core/layout/AppShell/ShellTopBar.tsx`

```tsx
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { supportedLanguages } from "../../../i18n/config";
import { appShellToolbarHeight } from "./constants";

type ShellTopBarProps = {
  isMobile: boolean;
  onMenuClick: () => void;
};

export function ShellTopBar({ isMobile, onMenuClick }: ShellTopBarProps) {
  const theme = useTheme();
  const { t } = useTranslation("common");

  return (
    <AppBar
      color="inherit"
      elevation={0}
      position="fixed"
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        backdropFilter: "blur(14px)",
        backgroundColor: "rgba(255,255,255,0.88)",
      }}
    >
      <Toolbar sx={{ gap: 2.5, minHeight: appShellToolbarHeight }}>
        {isMobile ? (
          <IconButton
            aria-label={t("layout.openNavigationMenu")}
            edge="start"
            onClick={onMenuClick}
          >
            <MenuRoundedIcon />
          </IconButton>
        ) : null}

        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 2 }}>
          {supportedLanguages.length > 1 ? <LanguageSwitcher /> : null}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: "center",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 999,
              px: 1.25,
              py: 0.75,
              backgroundColor: "background.paper",
            }}
          >
            <Avatar sx={{ width: 36, height: 36 }}>U</Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t("layout.profileName")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("layout.profileSubtitle")}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
```

### `src/core/layout/components/LanguageSwitcher.tsx`

Outlined small `Button` showing the active language code; opens a `Menu` of all `supportedLanguages`; the active one is `selected`; `i18n.changeLanguage` on select. Labels from `common` → `languageSwitcher.languages.{lang}` with the code as fallback. Driven by `supportedLanguages` at runtime — no code change when languages change.

```tsx
import { Button, Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supportedLanguages, type AppLanguage } from "../../../i18n/config";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation("common");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (lang: AppLanguage) => {
    void i18n.changeLanguage(lang);
    handleClose();
  };

  return (
    <>
      <Button
        aria-label={t("languageSwitcher.ariaLabel")}
        aria-controls={open ? "language-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleOpen}
        size="small"
        variant="outlined"
        sx={{ textTransform: "uppercase", minWidth: 48 }}
      >
        {i18n.language}
      </Button>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {supportedLanguages.map((lang) => (
          <MenuItem
            key={lang}
            onClick={() => handleSelect(lang)}
            selected={i18n.language === lang}
          >
            {t(`languageSwitcher.languages.${lang}` as never, {
              defaultValue: lang,
            })}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
```

### Dashboard home page

`src/routes/pages/DashboardPage.tsx` (copied verbatim, never edited per module): title + description from the `dashboard` namespace, and a responsive card grid (1 / 2 / 3 columns at `xs` / `md` / `xl`) looping over `navigationItems` minus `dashboard` — module cards appear automatically as modules are added.

```tsx
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

`src/core/layout/components/DashboardModuleCard.tsx` contract: props `{ id: string; to: string; label: string; Icon: SvgIconComponent }`; whole card is a `NavLink` to `to`; outlined `Paper` (radius 4, padding 3, min height 120, hover → primary border + shadow); 48×48 icon tile; label from `dashboard` → `modules.{id}.label` (fallback `label`); optional description from `modules.{id}.cardDescription` (hidden when empty, clamped to 4 lines).

```tsx
import { Box, Paper, Stack, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

type DashboardModuleCardProps = {
  id: string;
  to: string;
  label: string;
  Icon: SvgIconComponent;
};

export function DashboardModuleCard({
  id,
  to,
  label,
  Icon,
}: DashboardModuleCardProps) {
  const { t } = useTranslation("dashboard");
  const moduleLabel = t(`modules.${id}.label` as never, {
    defaultValue: label,
  }) as string;
  const description =
    (t(`modules.${id}.cardDescription` as never, {
      defaultValue: "",
    }) as string) || undefined;

  return (
    <NavLink
      to={to}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          p: 3,
          flex: 1,
          minHeight: 120,
          cursor: "pointer",
          transition: "border-color 180ms ease, box-shadow 180ms ease",
          "&:hover": {
            borderColor: "primary.main",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          },
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 48,
              height: 48,
              borderRadius: 2.5,
              bgcolor: "action.hover",
              color: "primary.main",
              flexShrink: 0,
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Box sx={{ display: "grid", gap: 0.75 }}>
            <Typography variant="h6">{moduleLabel}</Typography>
            {description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {description}
              </Typography>
            )}
          </Box>
        </Stack>
      </Paper>
    </NavLink>
  );
}
```

### Shell translation keys

| Namespace   | Key                                                                          | Used by                            |
| ----------- | ---------------------------------------------------------------------------- | ---------------------------------- |
| `common`    | `layout.primaryNavigation`                                                   | drawer `nav` aria-label            |
| `common`    | `layout.companyLogoAlt`                                                      | logo alt text                      |
| `common`    | `layout.openNavigationMenu`                                                  | hamburger aria-label               |
| `common`    | `layout.profileName`, `layout.profileSubtitle`                               | profile placeholder / fallback     |
| `common`    | `layout.signOut`                                                             | sign-out menu item (Entra auth)    |
| `common`    | `navigation.dashboard`, `navigation.<module>`                                | drawer labels via `translationKey` |
| `common`    | `languageSwitcher.ariaLabel`, `languageSwitcher.languages.{lang}`            | language switcher                  |
| `common`    | `appName`                                                                    | page title (see below)             |
| `dashboard` | `title`, `description`, `modules.{id}.label`, `modules.{id}.cardDescription` | dashboard page and cards           |

Seed for `dashboard` locale files:

```json
{
  "title": "Dashboard",
  "description": "Overview of your operational modules and their main entry points.",
  "modules": {}
}
```

Focused layout test (`src/test/app.smoke.test.tsx` if still small, else `src/test/layout.test.tsx`): dashboard heading renders through the shell and the `Dashboard` link has `aria-current="page"`; scope it to the dashboard item only.

---

## Dynamic page titles

The browser tab title is route-based and wired into `AppShell`:

- Hook: `src/core/hooks/useRoutePageTitle.ts`, called in `AppShell` as `useRoutePageTitle(translatedAppName, navItems)`.
- `translatedAppName` = `t('appName')` from `useTranslation('common')` in `AppShell`.
- `navItems` = `navigationItems` mapped to `{ route: item.to, translatedLabel: t(item.translationKey, { defaultValue: item.label }) }`.
- `AppShell` imports the hook from `'../../hooks/useRoutePageTitle'` and `navigationItems` from `'../navigation'`.

The hook's internal implementation and title format are not defined by these sources (see [gaps](#conflicts-and-gaps-in-the-sources)).

---

## Global error boundary

| Rule                          | Value                                                                                                                                                                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Implementation                | Custom **class** component; no `react-error-boundary` package or any new dependency                                                                                                                                                                                               |
| Location                      | `src/core/components/ErrorBoundary.tsx`                                                                                                                                                                                                                                           |
| Placement                     | Wraps `<RouterProvider>` in `main.tsx` (inside `StrictMode`); not in `App.tsx` unless the project already centralizes global wrappers there                                                                                                                                       |
| Fallback props (package-like) | `fallback` (ReactNode), `fallbackRender(props)`, `FallbackComponent` — precedence: `fallbackRender` → `FallbackComponent` → `fallback` → default UI                                                                                                                               |
| Fallback props contract       | `ErrorBoundaryFallbackProps = { error: Error; resetErrorBoundary: (...args: unknown[]) => void }`                                                                                                                                                                                 |
| Reset                         | `resetErrorBoundary(...args)` → `onReset({ reason: 'imperative-api', args })`; changed `resetKeys` (compared with `Object.is`) → `onReset({ reason: 'keys', prev, next })`                                                                                                        |
| Reporting hook                | Optional `onError(error, info)` from `componentDidCatch`; no logging/Application Insights wired by default (callers may use it for `trackException`, a logging endpoint, metrics, or retry coordination)                                                                          |
| Default fallback              | Plain, accessible, not i18n-aware: `<main role="alert"><h1>Something went wrong.</h1><p>An unexpected error occurred.</p></main>`                                                                                                                                                 |
| Non-Error throws              | Normalized to `new Error('Unknown error')`                                                                                                                                                                                                                                        |
| Test                          | `src/test/error-boundary.test.tsx` when the test stack exists; covers default UI + `onError`, `FallbackComponent`, `fallbackRender` + imperative reset, static `fallback` + `resetKeys`; silence `console.error` with `vi.spyOn(...).mockImplementation` and restore in `finally` |

```tsx
// src/core/components/ErrorBoundary.tsx
import {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from "react";

export type ErrorBoundaryResetDetails =
  | {
      reason: "imperative-api";
      args: unknown[];
    }
  | {
      reason: "keys";
      prev: readonly unknown[] | undefined;
      next: readonly unknown[] | undefined;
    };

export type ErrorBoundaryFallbackProps = {
  error: Error;
  resetErrorBoundary: (...args: unknown[]) => void;
};

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  fallbackRender?: (props: ErrorBoundaryFallbackProps) => ReactNode;
  FallbackComponent?: ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, info: ErrorInfo) => void;
  onReset?: (details: ErrorBoundaryResetDetails) => void;
  resetKeys?: readonly unknown[];
};

type ErrorBoundaryState = {
  error: Error | null;
};

function toError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }

  return new Error("Unknown error");
}

function haveResetKeysChanged(
  prevResetKeys: readonly unknown[] | undefined,
  nextResetKeys: readonly unknown[] | undefined,
) {
  if (prevResetKeys === nextResetKeys) {
    return false;
  }

  if (prevResetKeys === undefined || nextResetKeys === undefined) {
    return prevResetKeys !== nextResetKeys;
  }

  if (prevResetKeys.length !== nextResetKeys.length) {
    return true;
  }

  return prevResetKeys.some(
    (resetKey, index) => !Object.is(resetKey, nextResetKeys[index]),
  );
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  componentDidUpdate(
    prevProps: ErrorBoundaryProps,
    prevState: ErrorBoundaryState,
  ) {
    if (this.state.error === null || prevState.error === null) {
      return;
    }

    if (haveResetKeysChanged(prevProps.resetKeys, this.props.resetKeys)) {
      this.props.onReset?.({
        reason: "keys",
        prev: prevProps.resetKeys,
        next: this.props.resetKeys,
      });
      this.reset();
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  resetErrorBoundary = (...args: unknown[]) => {
    this.props.onReset?.({ reason: "imperative-api", args });
    this.reset();
  };

  renderFallback(error: Error) {
    const fallbackProps: ErrorBoundaryFallbackProps = {
      error,
      resetErrorBoundary: this.resetErrorBoundary,
    };

    if (this.props.fallbackRender) {
      return this.props.fallbackRender(fallbackProps);
    }

    if (this.props.FallbackComponent) {
      const FallbackComponent = this.props.FallbackComponent;
      return <FallbackComponent {...fallbackProps} />;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <main role="alert">
        <h1>Something went wrong.</h1>
        <p>An unexpected error occurred.</p>
      </main>
    );
  }

  render() {
    if (this.state.error) {
      return this.renderFallback(this.state.error);
    }

    return this.props.children;
  }
}
```

---

## Entra ID authentication (MSAL React)

### Scope and rules

- Packages `@azure/msal-react` + `@azure/msal-browser` in `dependencies`.
- Auth input comes from the project YAML `auth.entra` block; generated client IDs are **never** written back into `input/project.yaml` (it stays an input file). `client-id` is optional and per environment.

```yaml
auth:
  entra:
    tenant-id: "00000000-0000-0000-0000-000000000000"
    client-id:
      dev: "00000000-0000-0000-0000-000000000000"
      uat: "00000000-0000-0000-0000-000000000000"
      prod: "00000000-0000-0000-0000-000000000000"
```

- Unresolved client IDs use the placeholders `<your-dev-client-id>`, `<your-uat-client-id>`, `<your-prod-client-id>` in runtime config files; never invent fake GUIDs.
- Only the minimal current-user call (`GET {API_URL}/me`) is implemented — no RBAC, general API client, or custom token caching.
- Layout changes are limited to the profile area and the unauthenticated pages; existing providers and `ErrorBoundary` are preserved.

| Concern        | File                                                                          | Contract                                                                                                                                                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Runtime config | `src/core/config/config.ts`, `public/config.js`, `public/configs/config.*.js` | Adds `TENANT_ID`, `CLIENT_ID`; `public/config.js` and `config.dev.js` use the **dev** client ID                                                                                                                                                                                                              |
| MSAL config    | `src/core/auth/msalConfig.ts`                                                 | authority `https://login.microsoftonline.com/{TENANT_ID}`; `redirectUri` and `postLogoutRedirectUri` = `window.location.origin`; `cacheLocation: 'sessionStorage'`; `loginRequest` scopes `openid profile email`; `apiTokenRequest` scope `api://{CLIENT_ID}/access_as_user`                                 |
| MSAL instance  | `src/core/auth/msalInstance.ts`                                               | Singleton `PublicClientApplication`                                                                                                                                                                                                                                                                          |
| Bootstrap      | `src/main.tsx`                                                                | `await msalInstance.initialize()` **before** render; `MsalProvider` around `RouterProvider`; init failure renders the existing `ErrorBoundary` fallback (never a blank page)                                                                                                                                 |
| API fetch      | `src/core/auth/apiFetch.ts`                                                   | Uses singleton (not a hook) so it works in TanStack Query `queryFn`/`mutationFn`; silent token, `InteractionRequiredAuthError` → `acquireTokenRedirect` preserving current URL; prefixes `GlobalConfig.API_URL`; default `Content-Type: application/json`; `Authorization: Bearer …`; throws when no account |
| Current user   | `src/core/auth/useCurrentUser.ts`                                             | TanStack Query, key `['currentUser', homeAccountId ?? null]`, enabled only when authenticated and `inProgress === None`, `retry: false`, throws on non-OK                                                                                                                                                    |
| Guard          | `src/core/auth/AuthGuard.tsx`                                                 | Layout route: render nothing during MSAL interaction; unauthenticated → `/login` with `state.from = pathname + search`; pending `/me` → nothing; error → `/auth-error`; success → `<Outlet />`                                                                                                               |
| Landing        | `src/routes/pages/LandingPage.tsx` at `/login`                                | "Hello {project-name}" + Microsoft login button; `loginRedirect({ ...loginRequest, redirectStartPage: from })`, `from` falls back to `'/'`                                                                                                                                                                   |
| Auth error     | `src/routes/pages/AuthErrorPage.tsx` at `/auth-error`                         | Title, description, retry button → `loginRedirect` with `redirectStartPage: '/'`                                                                                                                                                                                                                             |
| Account hook   | `src/core/auth/useMsalAccount.ts`                                             | Returns `{ account, initials, instance }`; initials = first letters of name parts, max 2, uppercase, fallback `U`. Consumers never call `useMsal()` directly for the account                                                                                                                                 |
| Profile menu   | `src/core/layout/AppShell/TopBarMenuButton.tsx`                               | Prop-less chip (avatar initials, name, username) + `Menu` with Sign Out (`logoutRedirect`); keyboard (Enter/Space) accessible; menu width captured in `menuWidth` state (React-compiler-compatible)                                                                                                          |
| Top bar        | `ShellTopBar.tsx`                                                             | Static profile placeholder replaced by `<TopBarMenuButton />`                                                                                                                                                                                                                                                |
| i18n           | `public/locales/{en,fr}/auth.json`, `common.json`                             | New `auth` namespace (`landing.*`, `authError.*`) registered in `namespaces`; `layout.signOut` in `common`                                                                                                                                                                                                   |

### Canonical code

```ts
// src/core/config/config.ts (with auth)
declare global {
  var RUNTIME_CONFIG: {
    ENV: string;
    API_URL: string;
    TENANT_ID: string;
    CLIENT_ID: string;
  };
}

type Config = {
  ENV: string;
  API_URL: string;
  TENANT_ID: string;
  CLIENT_ID: string;
};

const rawConfig: Config = {
  ENV: globalThis.RUNTIME_CONFIG?.ENV,
  API_URL: globalThis.RUNTIME_CONFIG?.API_URL,
  TENANT_ID: globalThis.RUNTIME_CONFIG?.TENANT_ID,
  CLIENT_ID: globalThis.RUNTIME_CONFIG?.CLIENT_ID,
};

const GlobalConfig = rawConfig;

export { GlobalConfig };
```

```js
// public/config.js (with auth)
window.RUNTIME_CONFIG = {
  ENV: "development",
  API_URL: "<local-backend-url>/api",
  TENANT_ID: "<tenant-id-from-yaml>",
  CLIENT_ID: "<dev-client-id-from-yaml>",
};
```

```js
// public/configs/config.*.js (with auth)
window.RUNTIME_CONFIG = {
  ENV: "<environment-name>",
  API_URL: "<environment-api-url>",
  TENANT_ID: "<environment-tenant-id>",
  CLIENT_ID: "<client-id-for-env-from-yaml>",
};
```

```ts
// src/core/auth/msalConfig.ts
import type { Configuration } from "@azure/msal-browser";
import { GlobalConfig } from "../config/config";

export function getMsalConfig(): Configuration {
  return {
    auth: {
      clientId: GlobalConfig.CLIENT_ID,
      authority: `https://login.microsoftonline.com/${GlobalConfig.TENANT_ID}`,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: "sessionStorage",
    },
  };
}

export function getApiScope() {
  return `api://${GlobalConfig.CLIENT_ID}/access_as_user`;
}

export const apiTokenRequest = {
  scopes: [getApiScope()],
};

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};
```

```ts
// src/core/auth/msalInstance.ts
import { PublicClientApplication } from "@azure/msal-browser";
import { getMsalConfig } from "./msalConfig";

export const msalInstance = new PublicClientApplication(getMsalConfig());
```

```tsx
// src/main.tsx — MSAL initialization and provider nesting
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "./core/auth/msalInstance";
import { ErrorBoundary } from "./core/components/ErrorBoundary";

const root = createRoot(document.getElementById("root")!);

export function AppProviders() {
  return (
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <RouterProvider router={router} />
      </MsalProvider>
    </StrictMode>
  );
}

export function AuthenticationInitializationError(): never {
  throw new Error("Microsoft authentication failed to initialize.");
}

void msalInstance
  .initialize()
  .then(() => {
    root.render(<AppProviders />);
  })
  .catch((error: unknown) => {
    console.error("Failed to initialize Microsoft authentication.", error);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <AuthenticationInitializationError />
        </ErrorBoundary>
      </StrictMode>,
    );
  });
```

When `main.tsx` already has other providers or a global `ErrorBoundary`, keep them and only insert `MsalProvider`.

```ts
// src/core/auth/apiFetch.ts
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { GlobalConfig } from "../config/config";
import { msalInstance } from "./msalInstance";
import { apiTokenRequest } from "./msalConfig";

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const account =
    msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];

  if (!account) {
    throw new Error("No active account. User must be signed in.");
  }

  let accessToken: string;

  try {
    const result = await msalInstance.acquireTokenSilent({
      ...apiTokenRequest,
      account,
    });
    accessToken = result.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect({
        ...apiTokenRequest,
        account,
        redirectStartPage: window.location.pathname + window.location.search,
      });
      // redirect will navigate away; this line is unreachable
      throw error;
    }
    throw error;
  }

  const url = `${GlobalConfig.API_URL}${path}`;
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(url, {
    ...init,
    headers,
  });

  return response;
}
```

Usage in a module hook:

```ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/core/auth/apiFetch";

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => apiFetch("/orders").then((r) => r.json()),
  });
}
```

```ts
// src/core/auth/useCurrentUser.ts
import { InteractionStatus } from "@azure/msal-browser";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./apiFetch";

export function useCurrentUser() {
  const isAuthenticated = useIsAuthenticated();
  const { accounts, inProgress } = useMsal();
  const enabled = isAuthenticated && inProgress === InteractionStatus.None;

  return useQuery({
    queryKey: ["currentUser", accounts[0]?.homeAccountId ?? null],
    queryFn: async () => {
      const response = await apiFetch("/me");

      if (!response.ok) {
        throw new Error(
          `The current user request failed with status ${response.status}.`,
        );
      }

      return true;
    },
    enabled,
    retry: false,
  });
}
```

```tsx
// src/core/auth/AuthGuard.tsx
import { InteractionStatus } from "@azure/msal-browser";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentUser } from "./useCurrentUser";

export function AuthGuard() {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();
  const location = useLocation();
  const { isPending, isError } = useCurrentUser();

  if (inProgress !== InteractionStatus.None) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  if (isPending) {
    return null;
  }

  if (isError) {
    return <Navigate to="/auth-error" replace />;
  }

  return <Outlet />;
}
```

```tsx
// src/routes/pages/LandingPage.tsx
import { useMsal } from "@azure/msal-react";
import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { loginRequest } from "../../core/auth/msalConfig";

export function LandingPage() {
  const { instance } = useMsal();
  const { t } = useTranslation("auth");
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/";

  const handleLogin = () => {
    void instance.loginRedirect({ ...loginRequest, redirectStartPage: from });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 3,
        px: 2,
      }}
    >
      <Typography variant="h3" component="h1">
        {t("landing.title")}
      </Typography>
      <Typography color="text.secondary" variant="body1">
        {t("landing.subtitle")}
      </Typography>
      <Button onClick={handleLogin} size="large" variant="contained">
        {t("landing.loginButton")}
      </Button>
    </Box>
  );
}

export default LandingPage;
```

```tsx
// src/routes/pages/AuthErrorPage.tsx
import { useMsal } from "@azure/msal-react";
import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { loginRequest } from "../../core/auth/msalConfig";

export function AuthErrorPage() {
  const { instance } = useMsal();
  const { t } = useTranslation("auth");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 3,
        px: 2,
        textAlign: "center",
      }}
    >
      <Typography variant="h4" component="h1">
        {t("authError.title")}
      </Typography>
      <Typography color="text.secondary" variant="body1" sx={{ maxWidth: 480 }}>
        {t("authError.description")}
      </Typography>
      <Button
        onClick={() =>
          void instance.loginRedirect({
            ...loginRequest,
            redirectStartPage: "/",
          })
        }
        variant="contained"
      >
        {t("authError.retryButton")}
      </Button>
    </Box>
  );
}

export default AuthErrorPage;
```

Router with auth — public routes **before** the protected root; existing child routes kept intact under `App`:

```tsx
import { AuthGuard } from '../core/auth/AuthGuard'

// inside createBrowserRouter([...])
{
  path: '/login',
  lazy: async () => {
    const { LandingPage } = await import('./pages/LandingPage')
    return { Component: LandingPage }
  },
},
{
  path: '/auth-error',
  lazy: async () => {
    const { AuthErrorPage } = await import('./pages/AuthErrorPage')
    return { Component: AuthErrorPage }
  },
},
{
  path: '/',
  Component: AuthGuard,
  children: [
    {
      path: '/',
      Component: App,
      HydrateFallback: RouteHydrateFallback,
      children: [
        // existing home, module, 404, and healthcheck routes
      ],
    },
  ],
},
```

```ts
// src/core/auth/useMsalAccount.ts
import { useMsal } from "@azure/msal-react";

export function useMsalAccount() {
  const { instance, accounts } = useMsal();
  const account = accounts[0];
  const initials =
    account?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  return { account, initials, instance };
}
```

```tsx
// src/core/layout/AppShell/TopBarMenuButton.tsx
import { Avatar, Box, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMsalAccount } from "../../auth/useMsalAccount";

export function TopBarMenuButton() {
  const theme = useTheme();
  const { t } = useTranslation("common");
  const { account, initials, instance } = useMsalAccount();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [menuWidth, setMenuWidth] = useState<number | undefined>(undefined);
  const menuOpen = Boolean(anchorEl);

  const handleSignOut = () => {
    setAnchorEl(null);
    void instance.logoutRedirect();
  };

  return (
    <>
      <Stack
        aria-expanded={menuOpen ? "true" : undefined}
        aria-haspopup="menu"
        role="button"
        tabIndex={0}
        direction="row"
        spacing={1.5}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setMenuWidth(event.currentTarget.offsetWidth);
            setAnchorEl(event.currentTarget);
          }
        }}
        onClick={(event) => {
          setMenuWidth(event.currentTarget.offsetWidth);
          setAnchorEl(event.currentTarget);
        }}
        sx={{
          alignItems: "center",
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 999,
          px: 1.25,
          py: 0.75,
          backgroundColor: "background.paper",
          cursor: "pointer",
        }}
      >
        <Avatar sx={{ width: 36, height: 36 }}>{initials}</Avatar>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {account?.name ?? t("layout.profileName")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {account?.username ?? t("layout.profileSubtitle")}
          </Typography>
        </Box>
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        elevation={2}
        slotProps={{
          paper: {
            style: { minWidth: menuWidth },
            sx: {
              mt: 0.5,
              borderRadius: 2,
            },
          },
        }}
      >
        <MenuItem onClick={handleSignOut}>{t("layout.signOut")}</MenuItem>
      </Menu>
    </>
  );
}
```

### Auth locale content

`landing`/`authError` live in the dedicated `auth` namespace — **not** in `common`. `namespaces` becomes `['common', 'dashboard', 'auth'] as const`.

| Key (`auth`)                | en                                                                | fr                                                                 |
| --------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| `landing.title`             | `Hello {project-name}`                                            | `Bonjour {project-name}`                                           |
| `landing.subtitle`          | `Sign in with your Microsoft account to continue.`                | `Connectez-vous avec votre compte Microsoft pour continuer.`       |
| `landing.loginButton`       | `Sign in with Microsoft`                                          | `Se connecter avec Microsoft`                                      |
| `authError.title`           | `Authentication failed`                                           | `Authentification échouée`                                         |
| `authError.description`     | `We could not verify your identity. Please try signing in again.` | `Nous n'avons pas pu vérifier votre identité. Veuillez réessayer.` |
| `authError.retryButton`     | `Try again`                                                       | `Réessayer`                                                        |
| `common` → `layout.signOut` | `Sign out`                                                        | `Se déconnecter`                                                   |

If a typed `AppResources` interface exists, add `auth: { landing: { title; subtitle; loginButton }; authError: { title; description; retryButton } }` (all `string`) and `layout.signOut: string` under `common`.

---

## Entra app registration conventions

| Rule                                    | Value                                                                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registrations                           | One per environment: `dev`, `uat`, `prod`. `dev` is shared by local development and any dev deployment                                                              |
| Display name                            | `useraccess-{ApplicationName}-{env}`, lower-cased (legacy `useraccess-{ApplicationName}-local` is renamed in place to `-dev`)                                       |
| `ApplicationName`                       | Resolved from explicit input, an existing registration naming pattern / `entra-app-registrations.json`, or `project-name` from the project YAML                     |
| Type                                    | SPA platform; `spa.redirectUris` per environment; `web.homePageUrl` = redirect URI                                                                                  |
| Default redirect URI                    | `http://localhost:5173` unless a deployed frontend URL is provided                                                                                                  |
| Sign-in audience                        | `AzureADMyOrg` (default; alternatives `AzureADMultipleOrgs`, `AzureADandPersonalMicrosoftAccount`, `PersonalMicrosoftAccount`)                                      |
| Exposed API                             | `identifierUris = ['api://{client-id}']`, delegated scope `access_as_user` (type `User`, enabled), `requestedAccessTokenVersion = 2`; existing scopes preserved     |
| Service principal                       | Created for each registration if missing                                                                                                                            |
| Idempotency                             | By display name; existing registrations updated in place; duplicate display names are an error                                                                      |
| Permissions                             | Requires Entra rights to create app registrations (e.g. `Application Developer` or higher)                                                                          |
| Login                                   | Azure CLI; when a tenant ID is supplied and the CLI is logged out or on another tenant, a tenant-scoped device-code login (`--allow-no-subscriptions`) is attempted |
| Output (`entra-app-registrations.json`) | `tenantId`, `clientIds.{dev,uat,prod}`, `runtimeConfig.{env}.TENANT_ID` / `.CLIENT_ID`, `applications.{env}` metadata                                               |

Mapping of generated values:

| Generated value              | Destination                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `runtimeConfig.dev`          | `public/config.js` and `public/configs/config.dev.js`                              |
| `runtimeConfig.uat`          | `public/configs/config.uat.js`                                                     |
| `runtimeConfig.prod`         | `public/configs/config.prod.js`                                                    |
| `clientIds.dev` + `tenantId` | backend `appsettings.json`, `appsettings.Development.json`, `appsettings.Dev.json` |
| `clientIds.uat`              | backend `appsettings.Uat.json`                                                     |
| `clientIds.prod`             | backend `appsettings.Prod.json`                                                    |

`entra-app-registrations.json` is a **temporary handoff artifact**: keep it until the backend auth step consuming it has completed, then delete it (and verify deletion) unless explicitly kept for troubleshooting. When registration fails only for lack of Entra permissions during scaffolding, continue with placeholders and create the registrations later; any other failure (missing Azure CLI, malformed tenant ID, invalid redirect URI) is a blocker. A later "create registrations" pass must not silently keep placeholders and must leave no Entra placeholders in frontend config or backend appsettings.

---

## Reference file map

```text
<frontend-root>/
├── .nvmrc
├── .gitignore                    # includes .vite/
├── .husky/pre-commit
├── .lintstagedrc.json
├── .prettierrc.json
├── .prettierignore
├── eslint.config.ts
├── index.html                    # favicon link, <title>, <script src="/config.js"> first in <head>
├── package.json                  # lint, lint:fix, format, format:check, prepare, test, test:run, test:coverage
├── tsconfig.app.json             # paths @/*, @public/*; types ["vite/client", "node"]
├── tsconfig.node.json            # includes vite.config.ts, eslint.config.ts
├── vite.config.ts                # resolve.alias
├── vitest.config.ts              # mergeConfig(viteConfig, …)
├── public/
│   ├── favicon.svg
│   ├── config.js
│   ├── configs/config.{dev,uat,prod}.js
│   └── locales/{en,fr}/{common,dashboard,auth}.json
└── src/
    ├── main.tsx                  # StrictMode → (MsalProvider) → ErrorBoundary → RouterProvider; import './i18n'
    ├── App.tsx                   # <Suspense fallback={null}><AppShell /></Suspense>
    ├── i18n/{config.ts,index.ts}
    ├── core/
    │   ├── api/parseResponse.ts
    │   ├── auth/{msalConfig.ts,msalInstance.ts,apiFetch.ts,useCurrentUser.ts,AuthGuard.tsx,useMsalAccount.ts}
    │   ├── components/ErrorBoundary.tsx
    │   ├── components/atoms/DeleteActionButton/
    │   ├── components/molecules/{AppDataGrid,ConfirmDialog}/
    │   ├── config/config.ts
    │   ├── hooks/useRoutePageTitle.ts
    │   └── layout/
    │       ├── navigation.ts
    │       ├── AppShell/{AppShell.tsx,ShellDrawer.tsx,ShellTopBar.tsx,TopBarMenuButton.tsx,constants.ts}
    │       └── components/{LanguageSwitcher.tsx,DashboardModuleCard.tsx}
    ├── modules/<module-name>/…
    ├── routes/
    │   ├── router.tsx
    │   ├── RouteHydrateFallback.tsx
    │   └── pages/{DashboardPage,NotFoundPage,HealthcheckPage,LandingPage,AuthErrorPage}.tsx
    └── test/{setup.ts,app.smoke.test.tsx,layout.test.tsx,error-boundary.test.tsx}
```

---

## Conflicts and gaps in the sources

| #   | Topic                   | Conflict / gap                                                                                                                                                                                                                                                                                             |
| --- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Package manager         | All sources use npm. This repository requires pnpm (see [Package manager and Node](#package-manager-and-node)).                                                                                                                                                                                            |
| 2   | Default frontend folder | `react-app-init-launchpad`: `<cwd>/frontend/`; `frontend-create-launchpad`: `<cwd>/output.local/frontend/`.                                                                                                                                                                                                |
| 3   | `src/index.css`         | `react-app-init-launchpad` deletes it (its checklist instead says "is empty"), but the `main.tsx` templates in `react-routing-setup-launchpad`, `react-i18n-setup-launchpad` and `react-error-boundary-launchpad` still `import './index.css'`. Either keep an empty file or drop the import consistently. |
| 4   | Home page name          | `react-routing-setup-launchpad` and `react-layout-setup-launchpad` use `DashboardPage.tsx`; `react-i18n-setup-launchpad` requires/patches `HomePage.tsx` and mentions a `home` namespace while its code uses `dashboard`. `DashboardPage` + `dashboard` namespace is the effective standard.               |
| 5   | Smoke test heading      | `react-i18n-setup-launchpad` says keep the `Home` heading expectation; routing and layout tests expect `Dashboard`.                                                                                                                                                                                        |
| 6   | Core folder names       | `react-file-structure-launchpad` lists `core/design/{theme,atom,molecules}` and `core/configs/`; scaffolding layers use `core/components/{atoms,molecules}/`, `core/config/`, `core/api/`, `core/hooks/`.                                                                                                  |
| 7   | Typed i18n keys         | `react-i18n-setup-launchpad` promises "typed translation keys from a lightweight schema", but its `config.ts` only types languages/namespaces; no `i18next` module augmentation / `AppResources` file is defined (only referenced conditionally).                                                          |
| 8   | Shell locale values     | Layout keys (`layout.*`, `navigation.dashboard`, `languageSwitcher.*`, `appName`) are referenced but their en/fr values are not specified.                                                                                                                                                                 |
| 9   | Page titles             | `useRoutePageTitle` is wired but its implementation/format is defined outside these sources (`react-page-title-nexus`).                                                                                                                                                                                    |
| 10  | Current-user helper     | `react-entra-auth-launchpad` flow names `currentUser.ts` (plain helper); its reference defines `useCurrentUser.ts` (TanStack Query hook). The reference version is the canonical code. The guard also requires a `QueryClientProvider`, which no source in this set wires into `main.tsx`.                 |
| 11  | Auth locale keys        | Entra flow checklist says `common` includes `landing`/`authError`; its i18n reference says they go in the `auth` namespace and **not** `common`. The reference is authoritative.                                                                                                                           |
| 12  | Redirect URI default    | Entra references say omitted redirect URIs default to `http://localhost:5173`; the script itself skips any environment whose redirect URI is missing or not absolute. Pass the URIs explicitly.                                                                                                            |
| 13  | `ApplicationName`       | Reference example passes `"<project-name> frontend"` (with a space), producing `useraccess-<project-name> frontend-<env>`; other paths resolve it from `project-name` alone.                                                                                                                               |
| 14  | `/me` path              | Docs say `/api/me`; code calls `apiFetch('/me')` relying on `API_URL` ending with `/api`.                                                                                                                                                                                                                  |
| 15  | Code style in templates | Some templates use double quotes/semicolons (`config.ts`, `vitest.config.ts`, layout assets) while Prettier baseline is `semi: false, singleQuote: true`; Prettier normalizes them.                                                                                                                        |
| 16  | Layout test location    | Guide prefers updating `app.smoke.test.tsx` when small, otherwise `layout.test.tsx`.                                                                                                                                                                                                                       |

---

## Sources

`frontend-create-launchpad`, `react-app-init-launchpad`, `react-packages-standard-launchpad`, `react-file-structure-launchpad`, `react-import-alias-launchpad`, `react-linting-setup-launchpad`, `react-testing-setup-launchpad`, `react-config-management-launchpad`, `react-i18n-setup-launchpad`, `react-routing-setup-launchpad`, `react-layout-setup-launchpad`, `react-error-boundary-launchpad`, `react-entra-auth-launchpad`

Extracted from NexusInnovation/nexus-plugin-marketplace plugins/launchpad on 2026-11-24.
