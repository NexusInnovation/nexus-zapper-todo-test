import { Alert, Snackbar } from '@mui/material'
import { type ReactNode, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ErrorToastContext } from './ErrorToastContext'

type Toast = { id: string; errorCode: string }

type ErrorToastProviderProps = { children: ReactNode }

export function ErrorToastProvider({ children }: ErrorToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const { t } = useTranslation('common')

  const addError = useCallback((errorCode: string) => {
    setToasts((prev) => [...prev, { id: crypto.randomUUID(), errorCode }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ErrorToastContext.Provider value={{ addError }}>
      {children}
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          onClose={() => dismiss(toast.id)}
        >
          <Alert severity="error" onClose={() => dismiss(toast.id)}>
            {(t as (key: string) => string)(toast.errorCode)}
          </Alert>
        </Snackbar>
      ))}
    </ErrorToastContext.Provider>
  )
}
