import type { ZodType } from 'zod'

/**
 * Validates an API response against the provided schema.
 *
 * Schema drift is treated as a diagnostic signal, not a fatal error: on a
 * validation failure the `ZodError` is logged and the raw data is returned cast
 * to `T`, so an additive or temporary backend schema change does not break the
 * UI. Transport errors (non-OK responses) are handled by the caller, not here.
 */
export function parseResponse<T>(
  schema: ZodType<T>,
  data: unknown,
  label: string,
): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    console.error(`${label} response failed schema validation`, result.error)
    return data as T
  }
  return result.data
}

/** Convenience wrapper around {@link parseResponse} for list (array) responses. */
export function parseListResponse<T>(
  schema: ZodType<T>,
  data: unknown,
  label: string,
): T[] {
  return parseResponse(schema.array(), data, label)
}
