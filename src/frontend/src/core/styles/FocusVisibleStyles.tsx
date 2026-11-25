import { GlobalStyles } from '@mui/material'

const focusRing = {
  outline: '2px solid #1565c0',
  outlineOffset: '2px',
}

/**
 * Visible keyboard focus on every control (WCAG 2.4.7): a 2px ring contrasting with the white
 * page, on top of the MUI ripples. `.Mui-focusVisible` carries it for the controls whose native
 * input is visually hidden (checkbox). `html:root` outranks the MUI `outline: 0` resets.
 */
export function FocusVisibleStyles() {
  return (
    <GlobalStyles
      styles={{
        'html:root :focus-visible': focusRing,
        'html:root .Mui-focusVisible': focusRing,
      }}
    />
  )
}
