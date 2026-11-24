import { Box, Toolbar, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router-dom'
import { useRoutePageTitle } from '../../hooks/useRoutePageTitle'
import { navigationItems } from '../navigation'
import { ShellDrawer } from './ShellDrawer'
import { ShellTopBar } from './ShellTopBar'
import { appShellToolbarHeight } from './constants'

export function AppShell() {
  const { t } = useTranslation('common')
  const navItems = useMemo(
    () =>
      navigationItems.map((item) => ({
        route: item.to,
        translatedLabel: t(item.translationKey as never, {
          defaultValue: item.label,
        }) as string,
      })),
    [t],
  )
  useRoutePageTitle(t('appName'), navItems)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, rgba(248,250,252,0.96) 0%, rgba(255,255,255,1) 24%)',
      }}
    >
      <ShellTopBar
        isMobile={isMobile}
        onMenuClick={() => setMobileOpen((value) => !value)}
      />

      <ShellDrawer
        isMobile={isMobile}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, sm: 3, lg: 4 },
          py: { xs: 2, sm: 3 },
        }}
      >
        <Toolbar sx={{ minHeight: appShellToolbarHeight }} />
        <Box sx={{ mx: 'auto', width: '100%', maxWidth: 1280 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
