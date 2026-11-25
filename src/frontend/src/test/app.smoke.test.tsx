import { render, screen } from '@testing-library/react'
import { RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ErrorToastProvider } from '../core/components/ErrorToastProvider'
import { QueryProvider } from '../core/providers/QueryProvider'
import { router } from '../routes/router'

function renderApp() {
  return render(
    <ErrorToastProvider>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </ErrorToastProvider>,
  )
}

describe('routing', () => {
  it('renders the home page at the default route', async () => {
    window.history.pushState({}, '', '/')

    renderApp()

    expect(
      await screen.findByRole('heading', { name: 'My Todos' }),
    ).toBeTruthy()
  })
})

describe('layout', () => {
  it('renders the Todos shell and highlights the active route', async () => {
    window.history.pushState({}, '', '/')

    renderApp()

    expect(
      await screen.findByRole('heading', { name: 'My Todos' }),
    ).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: 'My Todos' })
        .getAttribute('aria-current'),
    ).toBe('page')
    expect(
      screen.getByRole('navigation', { name: 'Primary navigation' }),
    ).toBeTruthy()
    expect(document.title).toBe('Zapper Todo | My Todos')
  })
})
