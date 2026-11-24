import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import type { SvgIconComponent } from '@mui/icons-material'

export type ModuleId = never // extended per-module by react-module-list

export type NavigationItem = {
  id: 'dashboard' | ModuleId
  label: string
  translationKey: string
  to: string
  Icon: SvgIconComponent
}

export const appBrand = {
  label: 'Zapper Todo',
  logoSrc: '/favicon.svg',
}

export const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    translationKey: 'navigation.dashboard',
    to: '/',
    Icon: DashboardRoundedIcon,
  },
  // module navigation items are appended here by react-module-list
]
