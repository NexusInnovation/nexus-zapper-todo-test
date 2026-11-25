import i18n from 'i18next'
import HttpBackend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'
import {
  defaultLanguage,
  defaultNamespace,
  namespaces,
  supportedLanguages,
} from './config'

const isTest = import.meta.env.MODE === 'test'

function requestLocale(
  _options: unknown,
  url: string,
  _payload: unknown,
  callback: (
    error: Error | null,
    response: { status: number; data: string },
  ) => void,
) {
  void fetch(url)
    .then(async (response) => {
      callback(null, {
        status: response.status,
        data: await response.text(),
      })
    })
    .catch((error: unknown) => {
      callback(
        error instanceof Error
          ? error
          : new Error('Failed to load locale resource.'),
        {
          status: 500,
          data: '',
        },
      )
    })
}

const i18nInstance = isTest ? i18n : i18n.use(HttpBackend)

// <html lang> follows the current language (WCAG 3.1.1): fr at start-up, en after switching.
i18nInstance.on('languageChanged', (language) => {
  document.documentElement.lang = language
})

void i18nInstance.use(initReactI18next).init({
  lng: defaultLanguage,
  fallbackLng: defaultLanguage,
  supportedLngs: [...supportedLanguages],
  ns: [...namespaces],
  defaultNS: defaultNamespace,
  ...(isTest
    ? {}
    : {
        backend: {
          loadPath: '/locales/{{lng}}/{{ns}}.json',
          request: requestLocale,
        },
      }),
  interpolation: {
    escapeValue: false,
  },
  react: {
    bindI18n: 'languageChanged loaded',
    useSuspense: true,
  },
})

export default i18n
