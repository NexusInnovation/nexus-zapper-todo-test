import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

import { type ApiError, toApiError } from '../errors/ApiError'
import { useErrorToast } from '../hooks/useErrorToast'

// TODO(A04): extends the standard QueryProvider with a `localErrors` meta so the list and the forms
// keep their errors in place (plan) while every other error still reaches the global toast.
/**
 * Errors a query or mutation renders itself instead of the global toast:
 * `'all'` for every error, or the list of HTTP statuses handled locally.
 */
export type LocalErrors = 'all' | number[]

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: { localErrors?: LocalErrors }
    mutationMeta: { localErrors?: LocalErrors }
  }
}

function isHandledLocally(apiError: ApiError, localErrors?: LocalErrors) {
  return (
    localErrors === 'all' || (localErrors?.includes(apiError.status) ?? false)
  )
}

type QueryProviderProps = { children: ReactNode }

export function QueryProvider({ children }: QueryProviderProps) {
  const { addError } = useErrorToast()
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            const apiError = toApiError(error)
            if (!isHandledLocally(apiError, query.meta?.localErrors)) {
              addError(apiError.errorCode)
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            const apiError = toApiError(error)
            if (!isHandledLocally(apiError, mutation.meta?.localErrors)) {
              addError(apiError.errorCode)
            }
          },
        }),
      }),
  )

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
