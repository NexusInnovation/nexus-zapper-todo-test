# Run report — zapper/run-20261124-2137

## Commits

| SHA | Block | Kind | Build / tests run before commit | Result |
| --- | ----- | ---- | ------------------------------- | ------ |
| 0ad6180 | bdd-runner | test | `pnpm --dir src/frontend build`, `dotnet build src/backend/Nexus.ZapperTodo.slnx`, `pnpm --dir src/frontend lint`, `format:check`, `pnpm --dir src/frontend bdd` (only `Missing step` failures, reset hook passes on missing table), `bdd --grep "@77078-R02( \|$)"` (3 scenarios of that tag only), `pnpm --dir src/frontend regression` | pass (regression 26/26) |
| 1aa99eb | none (out of plan) | style | clean worktree: `dotnet build` (0 warnings), `dotnet test` (4/4), `dotnet format --verify-no-changes` (exit 0) | pass — fixes the pre-existing lint failure (TODO(A02)) |
| c88d7c4 | todo-api | feat | `dotnet build`, `dotnet format --verify-no-changes`, `dotnet test` | pass |
| 2dc63b6 | todo-api | fix | `dotnet build` (0 warnings, CS9107 removed) | pass |
| ab08eb7 | todo-api | test | `dotnet test` (36/36), `bdd --grep` @77080-cocher-et-decocher-un-todo-R05, @77080-R06, @77081-R06 (3/3), full `bdd` (3 pass, others `Missing step` only), `regression` (58/58) | pass |
| 398fdaa | todo-api | fix | `dotnet build` (0 warnings), `dotnet format --verify-no-changes` (0), `dotnet test` (36/36), curl GET/PUT/DELETE `/api/todos/abc` → 400, unknown GUID → 404 | pass — also carried the staged `DashboardPage.tsx` deletion meant for 970058b (router at 398fdaa still references it; restored consistency in 970058b) |
| 970058b | todo-page | feat | `tsc -b`, `pnpm lint`, `format:check`, `vitest` (26/26), `bdd --grep` 77078-R01…R08, 77079-R01…R06, nfr-performance-R01, nfr-security-R01/R02 (24/24) | pass |
| bc07d11 | todo-page | test | same as 970058b + `regression` (69/69) | pass |
| 62fc5a0 | todo-item-edit | feat | `tsc -b`, `pnpm lint`, `bdd --grep` 77080-R01…R08 + cocher-et-decocher R01…R05 (20/20) | pass |
| 23122d7 | todo-item-edit | test | `vitest` (33/33), full `bdd` (46 pass; 17 skipped = missing steps of blocks todo-item-delete / todo-quality only), `regression` (76/76) | pass |
| 1529d96 | todo-item-delete | feat | `tsc -b`, `pnpm lint`, `bdd --grep` 77081-R01…R07 (8/8) | pass |
| 04f24c4 | todo-item-delete | test | `vitest` (34/34; flow test fails when the post-delete reload is removed), `regression` (77/77) | pass |
| e8e544d | todo-quality | feat | `tsc -b`, `pnpm lint`, `format:check`, `bdd --grep` nfr-accessibility-R01, nfr-localization-R01, nfr-other-R01, nfr-performance-R01 | pass — includes the RG-02 regression glue change (TODO(A10)) and the checkbox `aria-disabled` (TODO(A07)) |
| e1e84a8 | todo-quality | test | `vitest` (38/38), full `bdd` (63/63), `regression` (81/81) | pass |
| 761253d | none (out of plan) | refactor | comment-only: `dotnet format --verify-no-changes` (0), `pnpm lint` (0), prettier check | pass — markers TODO(A02), TODO(A10) |
| 6318925 | none (out of plan) | test | comment-only: same checks | pass — markers TODO(A08), TODO(A09), TODO(A10), TODO(A11) |
| 99235a9 | todo-item-edit | test | `playwright test --grep @77080 --repeat-each 6` (120/120), `--grep @77080-R08 --repeat-each 30` (30/30) | pass — fixes a race in the save step glue (see Flakes) |

## Final validation (fresh run, HEAD 99235a9, after the last code change)

All commands run once from the repository root, in this order, on 2026-11-25 (UTC).

| # | Condition | Command | Exit | Started | Duration | Result |
| - | --------- | ------- | ---- | ------- | -------- | ------ |
| 2 | build | `dotnet build src/backend/Nexus.ZapperTodo.slnx` | 0 | 04:04:25Z | 2 s | 0 warnings, 0 errors |
| 2 | build | `pnpm --dir src/frontend install --frozen-lockfile` | 0 | 04:04:27Z | 0 s | lockfile up to date |
| 2 | build | `pnpm --dir src/frontend build` | 0 | 04:04:27Z | 6 s | built; Vite warns that one chunk is above 500 kB (warning only) |
| 3 | lint | `dotnet format src/backend/Nexus.ZapperTodo.slnx --verify-no-changes` | 0 | 04:04:33Z | 12 s | 0 errors |
| 3 | lint | `pnpm --dir src/frontend lint` | 0 | 04:04:45Z | 3 s | 0 errors, 0 warnings |
| 3 | lint | `pnpm --dir src/frontend format:check` | 0 | 04:04:48Z | 1 s | all files formatted |
| 2 | unit-test | `dotnet test src/backend/Nexus.ZapperTodo.slnx` | 0 | 04:04:49Z | 6 s | 36/36 passed |
| 2 | unit-test | `pnpm --dir src/frontend test:run` | 0 | 04:04:55Z | 9 s | 38/38 passed (9 files) |
| 4 | security | `dotnet list src/backend/Nexus.ZapperTodo.slnx package --vulnerable --include-transitive` | 0 | 04:05:04Z | 6 s | no vulnerable package (6 projects) |
| 4 | security | `pnpm --dir src/frontend audit --audit-level high` | 0 | 04:05:10Z | 0 s | no known vulnerabilities |
| 2 | e2e | `pnpm --dir src/frontend exec playwright test` | 0 | 04:05:10Z | 53 s | 63/63 passed |
| 1 | BDD (dataset) | `pnpm --dir src/frontend seed:volume` | 0 | 04:06:03Z | 2 s | 100 000 Todos |
| 1 | BDD | `pnpm --dir src/frontend bdd` (after removing the previous `cucumber.json`) | 0 | 04:06:05Z | 54 s | 63/63 scenarios, 325/325 steps passed; none failed, undefined, pending, skipped or ambiguous |
| 1 | regression | `pnpm --dir src/frontend regression` (after removing the previous `regression.xml`) | 0 | 04:06:59Z | 35 s | 81/81 passed (scenarios, vitest, dotnet) |

Results recorded: `.zapper/behaviour-driven-development/stories/*/results.md` and README « Last run »;
`.zapper/regression-baseline/areas/*/results.md` and README « Last run » (evidence run: `baseline`
and `baseline-commit` unchanged).

## Non-functional requirements

| Requirement | Evidence | Result |
| ----------- | -------- | ------ |
| nfr-performance-R01 | first usable list on 100 000 Todos, warm servers, production bundle (A11): 329 ms (BDD) and 347 ms (e2e), threshold < 2 000 ms; the list loads one page from the server | passed |
| nfr-security-R01, R02 | anonymous access; HTML and script titles rendered as text, never executed | passed |
| nfr-accessibility-R01 | labelled controls, keyboard-only journey, visible focus, announced errors, axe WCAG 2.1 AA: 0 violations on the page, in edit mode and with the delete dialog | passed (automated part) |
| nfr-accessibility (`@manual`) | « Audit WCAG 2.1 AA manuel » with a screen reader (NVDA / VoiceOver) | manual — not run, not counted as passed |
| nfr-localization-R01 | French by default, switch to English and back, translated errors; fr/en key parity unit test | passed |
| nfr-other-R01 | Todos kept server-side across sessions (second browser context) | passed |

## Existing tests changed (regression baseline)

| Test | Area | Requirement | Decision |
| ---- | ---- | ----------- | -------- |
| `src/frontend/src/test/app.smoke.test.tsx` | RG-01 | 77079-R01 | A08 |
| `src/frontend/e2e/steps/regression/shell.steps.ts` (glue of the regression scenarios) | RG-02 | nfr-accessibility-R01 | A10 |
| `src/backend/tests/Nexus.ZapperTodo.UnitTests/Infrastructure/InfrastructureServiceRegistrationTests.cs` | RG-04 | 77078-R08, 77079-R06 | A09 (+ `using` order by A02) |

No `.feature` file of the baseline or of the BDD suite was modified.

## Flakes and incidents

- **77080-R08 (e2e)**: failed once in a fresh run (save step poll timeout). Reproduced 3/20 serially:
  the glue read the field count, then `aria-invalid`; when the editor closed in between,
  `getAttribute` waited for a removed element. Fixed in 99235a9 (one non-waiting read), 150/150 after.
  Test glue only; the application behaved correctly (editor closed, title saved).
- **RG-02**: one failure under heavy machine load during block 6, not reproduced (28/28, then 81/81
  in each later full run).
- **398fdaa**: this `todo-api` fix commit also carried the staged deletion of `DashboardPage.tsx`
  meant for 970058b (todo-page); the tree is consistent again from 970058b. History not rewritten.

## Environment

- Playwright browsers were missing on the machine: installed into `/ms-playwright`
  (`PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`, `pnpm exec playwright install chromium`). No project change.
- SQL Server at `127.0.0.1:1433`, `ConnectionStrings__DefaultConnection` from the environment.
- dotnet 10.0.404, node 24, pnpm 12.8.1; shared 4-core machine (timing variance).

## Open questions and risks

- The `@manual` accessibility audit (screen reader) needs a human before release; it covers A07 too.
- Performance is measured locally (A11); a measure in a deployed environment is a follow-up.
- Vite chunk-size warning (> 500 kB bundle): no requirement is affected; code splitting is a possible
  follow-up.
- Run cost: not available (the CLI exposes no usage here).

## Final status

All goal conditions are met on HEAD 99235a9: BDD 63/63 and regression 81/81; build, unit
(36 + 38) and e2e (63/63) green; lint 0 errors; security 0 high or critical. Run decisions A01–A11
are recorded in `decisions.md` (A03 superseded), each assumed one with its `TODO(A<nn>)` in the code.
