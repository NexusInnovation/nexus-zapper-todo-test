import { Button, Menu, MenuItem } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supportedLanguages, type AppLanguage } from '../../../i18n/config'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation('common')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelect = (lang: AppLanguage) => {
    void i18n.changeLanguage(lang)
    handleClose()
  }

  return (
    <>
      <Button
        // TODO(A10): the name contains the visible language code (WCAG 2.5.3, label in name; nfr-accessibility-R01).
        aria-label={t('languageSwitcher.ariaLabel', {
          language: i18n.language.toUpperCase(),
        })}
        aria-controls={open ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleOpen}
        size="small"
        variant="outlined"
        sx={{ textTransform: 'uppercase', minWidth: 48 }}
      >
        {i18n.language}
      </Button>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {supportedLanguages.map((lang) => (
          <MenuItem
            key={lang}
            onClick={() => handleSelect(lang)}
            selected={i18n.language === lang}
          >
            {t(`languageSwitcher.languages.${lang}` as never, {
              defaultValue: lang,
            })}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
