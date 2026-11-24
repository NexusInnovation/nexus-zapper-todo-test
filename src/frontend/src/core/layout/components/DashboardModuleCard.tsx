import { Box, Paper, Stack, Typography } from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

type DashboardModuleCardProps = {
  id: string
  to: string
  label: string
  Icon: SvgIconComponent
}

export function DashboardModuleCard({
  id,
  to,
  label,
  Icon,
}: DashboardModuleCardProps) {
  const { t } = useTranslation('dashboard')
  const moduleLabel = t(`modules.${id}.label` as never, {
    defaultValue: label,
  }) as string
  const description =
    (t(`modules.${id}.cardDescription` as never, {
      defaultValue: '',
    }) as string) || undefined

  return (
    <NavLink
      to={to}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          p: 3,
          flex: 1,
          minHeight: 120,
          cursor: 'pointer',
          transition: 'border-color 180ms ease, box-shadow 180ms ease',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          },
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 48,
              height: 48,
              borderRadius: 2.5,
              bgcolor: 'action.hover',
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Box sx={{ display: 'grid', gap: 0.75 }}>
            <Typography variant="h6">{moduleLabel}</Typography>
            {description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {description}
              </Typography>
            )}
          </Box>
        </Stack>
      </Paper>
    </NavLink>
  )
}
