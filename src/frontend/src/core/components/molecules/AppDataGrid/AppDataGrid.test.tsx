import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { GridColDef } from '@mui/x-data-grid'
import { AppDataGrid } from './AppDataGrid'

// MUI DataGrid relies on ResizeObserver which is not available in jsdom.
// Must be a class (constructor) to satisfy the ResizeObserver interface.
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

type TestRow = { id: number; name: string }

const columns: GridColDef<TestRow>[] = [
  { field: 'id', headerName: 'ID', width: 100 },
  { field: 'name', headerName: 'Name', width: 200 },
]

const rows: TestRow[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
]

describe('AppDataGrid', () => {
  it('renders rows when data is provided', () => {
    render(
      <AppDataGrid
        rows={rows}
        columns={columns}
        loading={false}
        emptyMessage="No rows"
        disableVirtualization
      />,
    )

    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.getByText('Bob')).toBeTruthy()
  })

  it('renders the empty state when rows is empty and loading is false', () => {
    render(
      <AppDataGrid
        rows={[]}
        columns={columns}
        loading={false}
        emptyMessage="No rows"
        disableVirtualization
      />,
    )

    expect(screen.getByText('No rows')).toBeTruthy()
  })

  it('does not render the empty state while loading', () => {
    render(
      <AppDataGrid
        rows={[]}
        columns={columns}
        loading={true}
        emptyMessage="No rows"
        disableVirtualization
      />,
    )

    // MUI DataGrid suppresses noRowsOverlay when loading is true.
    expect(screen.queryByText('No rows')).toBeNull()
  })
})
