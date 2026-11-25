import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ErrorBoundary } from './core/components/ErrorBoundary'
import { ErrorToastProvider } from './core/components/ErrorToastProvider'
import { AppLocalizationProvider } from './core/providers/AppLocalizationProvider'
import { QueryProvider } from './core/providers/QueryProvider'
import './i18n'
import { router } from './routes/router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppLocalizationProvider>
      <ErrorBoundary>
        <ErrorToastProvider>
          <QueryProvider>
            <RouterProvider router={router} />
          </QueryProvider>
        </ErrorToastProvider>
      </ErrorBoundary>
    </AppLocalizationProvider>
  </StrictMode>,
)
