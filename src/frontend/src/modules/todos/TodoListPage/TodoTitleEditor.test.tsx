import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TodoTitleEditor } from './TodoTitleEditor'

function renderEditor(onSave = vi.fn().mockResolvedValue(undefined)) {
  const onCancel = vi.fn()
  render(
    <TodoTitleEditor
      todoId="00000000-0000-0000-0000-000000000001"
      title="Acheter du lait"
      isSaving={false}
      onSave={onSave}
      onCancel={onCancel}
    />,
  )
  return { onSave, onCancel, field: screen.getByRole('textbox') }
}

describe('TodoTitleEditor', () => {
  it('opens prefilled and focused', () => {
    const { field } = renderEditor()

    expect(field).toHaveValue('Acheter du lait')
    expect(field).toHaveFocus()
  })

  it('saves the trimmed title with Enter', async () => {
    const { onSave, field } = renderEditor()

    await userEvent.clear(field)
    await userEvent.type(field, '  Acheter du pain  {Enter}')

    expect(onSave).toHaveBeenCalledExactlyOnceWith('Acheter du pain')
  })

  it('cancels with Escape without saving', async () => {
    const { onSave, onCancel, field } = renderEditor()

    await userEvent.type(field, ' modifié{Escape}')

    expect(onCancel).toHaveBeenCalledOnce()
    expect(onSave).not.toHaveBeenCalled()
  })

  it.each([
    ['', 'The title is required.'],
    ['   ', 'The title is required.'],
    ['x'.repeat(201), 'The title cannot exceed 200 characters.'],
  ])('refuses %j in the field without saving', async (title, message) => {
    const { onSave, field } = renderEditor()

    await userEvent.clear(field)
    if (title) await userEvent.type(field, title)
    await userEvent.keyboard('{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows the translated rule of a 422 in the field', async () => {
    const onSave = vi
      .fn()
      .mockRejectedValue({ errors: { title: ['errors.todo.titleTooLong'] } })
    const { field } = renderEditor(onSave)

    await userEvent.type(field, '{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The title cannot exceed 200 characters.',
    )
    expect(field).toHaveValue('Acheter du lait')
  })
})
