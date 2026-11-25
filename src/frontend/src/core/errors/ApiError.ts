export interface ApiError {
  status: number
  errorCode: string
  validationErrors?: Record<string, string[]>
}

/**
 * Parses an unknown thrown value into an ApiError.
 *
 * Handles both ProblemDetails shapes the backend produces:
 *   - ValidationProblemDetails: { errors: { [field]: string[] } }
 *   - ProblemDetails with errorCode extension: { status, errorCode }
 *
 * Falls back to a 500 / 'errors.generic.unexpected' for anything unrecognised.
 */
export function toApiError(error: unknown): ApiError {
  if (error !== null && typeof error === 'object') {
    const obj = error as Record<string, unknown>

    if (
      obj['errors'] !== null &&
      typeof obj['errors'] === 'object' &&
      !Array.isArray(obj['errors'])
    ) {
      return {
        status: 422,
        errorCode: 'errors.generic.validationFailed',
        validationErrors: obj['errors'] as Record<string, string[]>,
      }
    }

    if (typeof obj['errorCode'] === 'string') {
      const status = typeof obj['status'] === 'number' ? obj['status'] : 500
      return { status, errorCode: obj['errorCode'] }
    }
  }

  return { status: 500, errorCode: 'errors.generic.unexpected' }
}
