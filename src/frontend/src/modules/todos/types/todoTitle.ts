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
