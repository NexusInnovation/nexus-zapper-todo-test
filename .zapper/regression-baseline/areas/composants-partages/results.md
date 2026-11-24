# Results: Composants partagés de l'interface (RG-03)

Run: 2026-11-24T23:03:20.942Z · Command: `pnpm --dir src/frontend regression`

| Source | Item | Status |
| --- | --- | --- |
| existing test | src/frontend/src/core/components/molecules/AppDataGrid/AppDataGrid.test.tsx :: AppDataGrid > renders rows when data is provided | passed |
| existing test | src/frontend/src/core/components/molecules/AppDataGrid/AppDataGrid.test.tsx :: AppDataGrid > renders the empty state when rows is empty and loading is false | passed |
| existing test | src/frontend/src/core/components/molecules/AppDataGrid/AppDataGrid.test.tsx :: AppDataGrid > does not render the empty state while loading | passed |
| existing test | src/frontend/src/core/components/molecules/ConfirmDialog/ConfirmDialog.test.tsx :: ConfirmDialog > renders title, message, and button labels when open | passed |
| existing test | src/frontend/src/core/components/molecules/ConfirmDialog/ConfirmDialog.test.tsx :: ConfirmDialog > does not render when closed | passed |
| existing test | src/frontend/src/core/components/molecules/ConfirmDialog/ConfirmDialog.test.tsx :: ConfirmDialog > calls onConfirm when the confirm button is clicked | passed |
| existing test | src/frontend/src/core/components/molecules/ConfirmDialog/ConfirmDialog.test.tsx :: ConfirmDialog > calls onCancel when the cancel button is clicked | passed |
| existing test | src/frontend/src/core/components/molecules/ConfirmDialog/ConfirmDialog.test.tsx :: ConfirmDialog > disables both buttons while isConfirming is true | passed |
