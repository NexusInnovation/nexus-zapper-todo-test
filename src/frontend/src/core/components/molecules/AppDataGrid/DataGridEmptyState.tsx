import { Box, Typography } from '@mui/material'

type DataGridEmptyStateProps = {
  message: string
}

export function DataGridEmptyState({ message }: DataGridEmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        height: '100%',
        py: 6,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  )
}
