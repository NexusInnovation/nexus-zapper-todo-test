import MuiRadioGroup from '@mui/material/RadioGroup'
import type { RadioGroupProps as MuiRadioGroupProps } from '@mui/material/RadioGroup'
import type { ChangeEvent } from 'react'
import { useController, useFormContext } from 'react-hook-form'

type RadioGroupProps = {
  name: string
} & Omit<MuiRadioGroupProps, 'name' | 'value' | 'onChange'>

// Converts 'true'/'false' string values emitted by radio inputs back to booleans
// so boolean-typed fields work naturally without custom resolver logic.
function parseValue(raw: string): boolean | string {
  if (raw === 'true') return true
  if (raw === 'false') return false
  return raw
}

function RadioGroup({ name, children, ...rest }: RadioGroupProps) {
  const { control } = useFormContext()
  const { field } = useController({ name, control })

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    field.onChange(parseValue(event.target.value))
  }

  return (
    <MuiRadioGroup
      {...rest}
      value={
        field.value !== undefined && field.value !== null
          ? String(field.value)
          : ''
      }
      onChange={handleChange}
    >
      {children}
    </MuiRadioGroup>
  )
}

export default RadioGroup
