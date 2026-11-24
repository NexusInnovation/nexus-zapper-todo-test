import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { supportedLanguages } from '../../../i18n/config'
import { appShellToolbarHeight } from './constants'

type ShellTopBarProps = {
  isMobile: boolean
  onMenuClick: () => void
}

export function ShellTopBar({ isMobile, onMenuClick }: ShellTopBarProps) {
  const theme = useTheme()
  const { t } = useTranslation('common')

  return (
    <AppBar
      color="inherit"
      elevation={0}
      position="fixed"
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(14px)',
        backgroundColor: 'rgba(255,255,255,0.88)',
      }}
    >
      <Toolbar sx={{ gap: 2.5, minHeight: appShellToolbarHeight }}>
        {isMobile ? (
          <IconButton
            aria-label={t('layout.openNavigationMenu')}
            edge="start"
            onClick={onMenuClick}
          >
            <MenuRoundedIcon />
          </IconButton>
        ) : null}

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
          {supportedLanguages.length > 1 ? <LanguageSwitcher /> : null}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: 'center',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 999,
              px: 1.25,
              py: 0.75,
              backgroundColor: 'background.paper',
            }}
          >
            <Avatar sx={{ width: 36, height: 36 }}>U</Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t('layout.profileName')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('layout.profileSubtitle')}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
