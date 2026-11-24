import MuiRadio from '@mui/material/Radio'
import type { RadioProps as MuiRadioProps } from '@mui/material/Radio'
import type { ReactElement } from 'react'

export type RadioProps = MuiRadioProps

export default function Radio({
  color = 'primary',
  ...props
}: RadioProps): ReactElement {
  return <MuiRadio color={color} {...props} />
}
