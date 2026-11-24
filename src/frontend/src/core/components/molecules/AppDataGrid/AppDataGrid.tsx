import { useMemo } from 'react'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import type { SxProps, Theme } from '@mui/material'
import { DataGridEmptyState } from './DataGridEmptyState'

const PAGE_SIZE = 20

type AppDataGridProps<TRow extends { id: string | number }> = {
  rows: TRow[]
  columns: GridColDef<TRow>[]
  loading: boolean
  emptyMessage: string
  sx?: SxProps<Theme>
  disableVirtualization?: boolean // Disable row/column virtualization. Pass in tests to ensure rows render in jsdom.
}

export function AppDataGrid<TRow extends { id: string | number }>({
  rows,
  columns,
  loading,
  emptyMessage,
  sx,
  disableVirtualization,
}: AppDataGridProps<TRow>) {
  const EmptyDataGridOverlay = useMemo(
    () =>
      function EmptyDataGridState() {
        return <DataGridEmptyState message={emptyMessage} />
      },
    [emptyMessage],
  )

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      checkboxSelection={false}
      disableRowSelectionOnClick
      disableColumnFilter
      disableColumnMenu
      disableColumnResize
      sortingMode="client"
      pageSizeOptions={[PAGE_SIZE]}
      disableVirtualization={disableVirtualization}
      sx={sx}
      initialState={{
        pagination: {
          paginationModel: { pageSize: PAGE_SIZE },
        },
      }}
      slots={{
        noRowsOverlay: EmptyDataGridOverlay,
      }}
    />
  )
}
