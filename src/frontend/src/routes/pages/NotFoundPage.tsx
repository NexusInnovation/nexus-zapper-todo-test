import { useTranslation } from 'react-i18next'

export function NotFoundPage() {
  const { t } = useTranslation('common', { keyPrefix: 'notFound' })

  return (
    <>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </>
  )
}

export default NotFoundPage
