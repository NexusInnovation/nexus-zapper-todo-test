import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded'
import type { SvgIconComponent } from '@mui/icons-material'

export type ModuleId = 'todos' // extended per-module by react-module-list

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
    id: 'todos',
    label: 'My Todos',
    translationKey: 'navigation.todos',
    to: '/',
    Icon: ChecklistRoundedIcon,
  },
  // module navigation items are appended here by react-module-list
]
