import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  ErrorBoundary,
  type ErrorBoundaryFallbackProps,
  type ErrorBoundaryResetDetails,
} from '../core/components/ErrorBoundary'

function ThrowingComponent(): never {
  throw new Error('boom')
}

function PackageLikeFallback({
  error,
  resetErrorBoundary,
}: ErrorBoundaryFallbackProps) {
  return (
    <div role="alert">
      <p>{error.message}</p>
      <button onClick={() => resetErrorBoundary('retry-click')}>
        Try again
      </button>
    </div>
  )
}

function ResettableBoundary({
  onReset,
}: {
  onReset: (details: ErrorBoundaryResetDetails) => void
}) {
  const [shouldThrow, setShouldThrow] = useState(true)

  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div role="alert">
          <p>{error.message}</p>
          <button
            onClick={() => {
              setShouldThrow(false)
              resetErrorBoundary('retry-click')
            }}
          >
            Recover
          </button>
        </div>
      )}
      onReset={onReset}
    >
      {shouldThrow ? <ThrowingComponent /> : <span>Recovered</span>}
    </ErrorBoundary>
  )
}

describe('ErrorBoundary', () => {
  it('renders the default fallback ui and invokes onError when a child throws', () => {
    const onError = vi.fn()
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    try {
      render(
        <ErrorBoundary onError={onError}>
          <ThrowingComponent />
        </ErrorBoundary>,
      )

      expect(
        screen.getByRole('heading', { name: 'Something went wrong.' }),
      ).toBeTruthy()
      expect(onError).toHaveBeenCalledTimes(1)
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('supports FallbackComponent', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    try {
      render(
        <ErrorBoundary FallbackComponent={PackageLikeFallback}>
          <ThrowingComponent />
        </ErrorBoundary>,
      )

      expect(screen.getByText('boom')).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('supports fallbackRender and resetErrorBoundary', async () => {
    const onReset = vi.fn()
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    try {
      render(<ResettableBoundary onReset={onReset} />)

      expect(screen.getByText('boom')).toBeTruthy()

      fireEvent.click(screen.getByRole('button', { name: 'Recover' }))

      expect(await screen.findByText('Recovered')).toBeTruthy()
      expect(onReset).toHaveBeenCalledWith({
        reason: 'imperative-api',
        args: ['retry-click'],
      })
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('supports a static fallback and resetKeys', async () => {
    const onReset = vi.fn()
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    try {
      const { rerender } = render(
        <ErrorBoundary
          fallback={<div role="alert">Static fallback</div>}
          onReset={onReset}
          resetKeys={[true]}
        >
          <ThrowingComponent />
        </ErrorBoundary>,
      )

      expect(screen.getByText('Static fallback')).toBeTruthy()

      rerender(
        <ErrorBoundary
          fallback={<div role="alert">Static fallback</div>}
          onReset={onReset}
          resetKeys={[false]}
        >
          <span>Recovered by keys</span>
        </ErrorBoundary>,
      )

      expect(await screen.findByText('Recovered by keys')).toBeTruthy()
      expect(onReset).toHaveBeenCalledWith({
        reason: 'keys',
        prev: [true],
        next: [false],
      })
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })

  it('supports fallbackRender directly', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    try {
      render(
        <ErrorBoundary
          fallbackRender={({ error }) => (
            <div role="alert">render prop: {error.message}</div>
          )}
        >
          <ThrowingComponent />
        </ErrorBoundary>,
      )

      expect(screen.getByText('render prop: boom')).toBeTruthy()
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })
})
