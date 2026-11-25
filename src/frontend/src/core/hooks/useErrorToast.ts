import { useContext } from 'react'

import { ErrorToastContext } from '../components/ErrorToastContext'

export function useErrorToast() {
  const context = useContext(ErrorToastContext)
  if (!context) {
    throw new Error('useErrorToast must be used within an ErrorToastProvider')
  }
  return context
}
