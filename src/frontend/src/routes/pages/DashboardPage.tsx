import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { navigationItems } from '../../core/layout/navigation'
import { DashboardModuleCard } from '../../core/layout/components/DashboardModuleCard'

export function DashboardPage() {
  const { t } = useTranslation('dashboard')

  return (
    <Box component="section" sx={{ display: 'grid', gap: 3 }}>
      <Box sx={{ display: 'grid', gap: 1, maxWidth: 780 }}>
        <Typography component="h1" variant="h4">
          {t('title')}
        </Typography>
        <Typography color="text.secondary" variant="body1">
          {t('description')}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(3, minmax(0, 1fr))',
          },
        }}
      >
        {navigationItems
          .filter((item) => item.id !== 'dashboard')
          .map((item) => (
            <DashboardModuleCard
              key={item.id}
              id={item.id}
              to={item.to}
              label={item.label}
              Icon={item.Icon}
            />
          ))}
      </Box>
    </Box>
  )
}

export default DashboardPage
