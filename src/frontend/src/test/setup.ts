import '@testing-library/jest-dom/vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

const { default: i18n } = await import('../i18n')

async function readLocale(language: string, namespace: string) {
  const file = path.resolve(
    process.cwd(),
    'public/locales',
    language,
    `${namespace}.json`,
  )
  return JSON.parse(await fs.readFile(file, 'utf8')) as Record<string, unknown>
}

i18n.addResourceBundle(
  'en',
  'common',
  await readLocale('en', 'common'),
  true,
  true,
)
i18n.addResourceBundle(
  'en',
  'dashboard',
  await readLocale('en', 'dashboard'),
  true,
  true,
)

await i18n.changeLanguage('en')

afterEach(() => {
  cleanup()
})
