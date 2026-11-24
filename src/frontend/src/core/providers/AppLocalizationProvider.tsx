import type { ReactNode } from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { enUS, fr } from 'date-fns/locale'
import type { Locale } from 'date-fns'
import { useTranslation } from 'react-i18next'

const dateFnsLocales: Record<string, Locale> = {
  en: enUS,
  fr,
}

type AppLocalizationProviderProps = { children: ReactNode }

export function AppLocalizationProvider({
  children,
}: AppLocalizationProviderProps) {
  const { i18n } = useTranslation()
  const adapterLocale = dateFnsLocales[i18n.language] ?? enUS

  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={adapterLocale}
    >
      {children}
    </LocalizationProvider>
  )
}
