import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  it('renders title, message, and button labels when open', () => {
    render(
      <ConfirmDialog
        open
        title="Delete order?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByText('Delete order?')).toBeTruthy()
    expect(screen.getByText('This action cannot be undone.')).toBeTruthy()
    expect(screen.getByText('Delete')).toBeTruthy()
    expect(screen.getByText('Cancel')).toBeTruthy()
  })

  it('does not render when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        title="Delete order?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.queryByText('Delete order?')).toBeNull()
  })

  it('calls onConfirm when the confirm button is clicked', () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open
        title="Delete order?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByText('Delete'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when the cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        open
        title="Delete order?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    )

    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('disables both buttons while isConfirming is true', () => {
    render(
      <ConfirmDialog
        open
        title="Delete order?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isConfirming
      />,
    )

    expect(screen.getByText('Delete').closest('button')).toBeDisabled()
    expect(screen.getByText('Cancel').closest('button')).toBeDisabled()
  })
})
