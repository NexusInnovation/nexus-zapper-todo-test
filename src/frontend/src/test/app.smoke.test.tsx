import { render, screen } from '@testing-library/react'
import { RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { router } from '../routes/router'

describe('routing', () => {
  it('renders the home page at the default route', async () => {
    window.history.pushState({}, '', '/')

    render(<RouterProvider router={router} />)

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeTruthy()
  })
})

describe('layout', () => {
  it('renders the dashboard shell and highlights the active route', async () => {
    window.history.pushState({}, '', '/')

    render(<RouterProvider router={router} />)

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: 'Dashboard' })
        .getAttribute('aria-current'),
    ).toBe('page')
    expect(
      screen.getByRole('navigation', { name: 'Primary navigation' }),
    ).toBeTruthy()
    expect(document.title).toBe('Zapper Todo | Dashboard')
  })
})
