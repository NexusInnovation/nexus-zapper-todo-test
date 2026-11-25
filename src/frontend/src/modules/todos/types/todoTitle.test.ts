import { describe, expect, it } from 'vitest'

import { titleErrorCode, todoTitleSchema } from './todoTitle'

describe('todoTitleSchema', () => {
  it('trims the title before storing it', () => {
    expect(todoTitleSchema.parse('   Acheter du lait   ')).toBe(
      'Acheter du lait',
    )
  })

  it.each(['', '    '])('rejects an empty title %j as required', (title) => {
    const result = todoTitleSchema.safeParse(title)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('errors.todo.titleRequired')
  })

  it('accepts 200 characters, also when surrounded by spaces', () => {
    expect(todoTitleSchema.safeParse('a'.repeat(200)).success).toBe(true)
    expect(todoTitleSchema.safeParse(`  ${'a'.repeat(200)}  `).success).toBe(
      true,
    )
  })

  it('rejects 201 characters as too long', () => {
    const result = todoTitleSchema.safeParse('a'.repeat(201))
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('errors.todo.titleTooLong')
  })
})

describe('titleErrorCode', () => {
  it('reads the first title code of a 422 response', () => {
    expect(titleErrorCode({ title: ['errors.todo.titleTooLong'] })).toBe(
      'errors.todo.titleTooLong',
    )
    expect(titleErrorCode({ other: ['x'] })).toBeUndefined()
  })
})
