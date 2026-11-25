import { createContext } from 'react'

export type ErrorToastContextValue = {
  addError: (errorCode: string) => void
}

export const ErrorToastContext = createContext<ErrorToastContextValue | null>(
  null,
)
