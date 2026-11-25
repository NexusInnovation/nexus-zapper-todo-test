export const supportedLanguages = ['en', 'fr'] as const
export type AppLanguage = (typeof supportedLanguages)[number]

export const defaultLanguage = 'fr' as const
export const defaultNamespace = 'common' as const
export const namespaces = ['common', 'dashboard', 'todos'] as const
export type AppNamespace = (typeof namespaces)[number]
