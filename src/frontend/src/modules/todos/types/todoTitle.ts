import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { z } from 'zod'

export const todoTitleMaxLength = 200

// Error codes shared with the backend DomainErrors and translated in the `common` namespace.
export const todoTitleErrors = {
  required: 'errors.todo.titleRequired',
  tooLong: 'errors.todo.titleTooLong',
} as const

/** Same rules as the server: trimmed, required, at most 200 characters after trimming. */
export const todoTitleSchema = z
  .string()
  .trim()
  .min(1, todoTitleErrors.required)
  .max(todoTitleMaxLength, todoTitleErrors.tooLong)

export const todoTitleFormSchema = z.object({ title: todoTitleSchema })

export type TodoTitleFormInput = z.input<typeof todoTitleFormSchema>
export type TodoTitleFormValues = z.output<typeof todoTitleFormSchema>

/** Picks the translated rule a 422 response reports for the title, if any. */
export function titleErrorCode(
  validationErrors: Record<string, string[]> | undefined,
): string | undefined {
  const codes = validationErrors?.['title'] ?? validationErrors?.['Title']
  return codes?.[0]
}

const zodTitleResolver = zodResolver(todoTitleFormSchema)

/**
 * Title form resolver whose error message is the translated rule: the TextField atom renders the
 * message as is, so the shared error codes are translated here.
 */
export function translatedTitleResolver(
  translate: (key: string) => string,
): Resolver<TodoTitleFormInput, unknown, TodoTitleFormValues> {
  return async (values, context, options) => {
    const result = await zodTitleResolver(values, context, options)
    const titleError = result.errors.title
    if (titleError?.message) {
      return {
        values: {},
        errors: {
          title: { ...titleError, message: translate(titleError.message) },
        },
      }
    }
    return result
  }
}
