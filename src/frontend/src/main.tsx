import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ErrorBoundary } from './core/components/ErrorBoundary'
import { AppLocalizationProvider } from './core/providers/AppLocalizationProvider'
import './i18n'
import { router } from './routes/router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppLocalizationProvider>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </AppLocalizationProvider>
  </StrictMode>,
)
