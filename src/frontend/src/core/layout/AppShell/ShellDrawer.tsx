import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import { appBrand, navigationItems } from '../navigation'
import { appShellToolbarHeight } from './constants'

export const drawerWidth = 280

function matchesCurrentPath(pathname: string, to: string) {
  if (to === '/') {
    return pathname === '/'
  }

  return pathname === to || pathname.startsWith(`${to}/`)
}

type ShellDrawerProps = {
  isMobile: boolean
  open: boolean
  onClose: () => void
}

export function ShellDrawer({ isMobile, open, onClose }: ShellDrawerProps) {
  const theme = useTheme()
  const location = useLocation()
  const { t } = useTranslation('common')

  const content = (
    <Box
      component="nav"
      aria-label={t('layout.primaryNavigation')}
      sx={{ display: 'flex', height: '100%', flexDirection: 'column' }}
    >
      <Toolbar
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          minHeight: appShellToolbarHeight,
        }}
      >
        <Box
          alt={t('layout.companyLogoAlt')}
          component="img"
          src={appBrand.logoSrc}
          sx={{ height: 34, width: 34 }}
        />
      </Toolbar>
      <List sx={{ px: 1.5, py: 2 }}>
        {navigationItems.map(({ id, label, to, translationKey, Icon }) => {
          const isActive = matchesCurrentPath(location.pathname, to)

          return (
            <ListItem key={id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                end={to === '/'}
                onClick={onClose}
                selected={isActive}
                to={to}
                sx={{
                  borderRadius: 2,
                  color: 'text.secondary',
                  gap: 1,
                  py: 1.25,
                  '&.active, &.Mui-selected': {
                    backgroundColor: theme.palette.action.selected,
                    color: 'text.primary',
                  },
                  '&.active .MuiListItemIcon-root, &.Mui-selected .MuiListItemIcon-root':
                    {
                      color: 'primary.main',
                    },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontWeight: isActive ? 700 : 500 }}>
                      {t(translationKey as never, {
                        defaultValue: label,
                      })}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
    </Box>
  )

  return (
    <Box
      component="aside"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      <Drawer
        ModalProps={{ keepMounted: true }}
        onClose={onClose}
        open={open}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'rgba(255,255,255,0.94)',
            backgroundImage: 'none',
          },
        }}
        variant={isMobile ? 'temporary' : 'permanent'}
      >
        {content}
      </Drawer>
    </Box>
  )
}
