# Results: Coquille de l'application et navigation (RG-01)

Run: 2026-11-24T23:03:20.942Z · Command: `pnpm --dir src/frontend regression`

| Source | Item | Status |
| --- | --- | --- |
| regression scenario | La page de vérification de disponibilité répond | passed |
| regression scenario | Une adresse inconnue mène à la page introuvable | passed |
| regression scenario | Ouvrir la navigation sur un écran étroit | passed |
| existing test | src/frontend/src/test/app.smoke.test.tsx :: routing > renders the home page at the default route | passed |
| existing test | src/frontend/src/test/app.smoke.test.tsx :: layout > renders the dashboard shell and highlights the active route | passed |
| existing test | src/frontend/src/test/error-boundary.test.tsx :: ErrorBoundary > renders the default fallback ui and invokes onError when a child throws | passed |
| existing test | src/frontend/src/test/error-boundary.test.tsx :: ErrorBoundary > supports FallbackComponent | passed |
| existing test | src/frontend/src/test/error-boundary.test.tsx :: ErrorBoundary > supports fallbackRender and resetErrorBoundary | passed |
| existing test | src/frontend/src/test/error-boundary.test.tsx :: ErrorBoundary > supports a static fallback and resetKeys | passed |
| existing test | src/frontend/src/test/error-boundary.test.tsx :: ErrorBoundary > supports fallbackRender directly | passed |
