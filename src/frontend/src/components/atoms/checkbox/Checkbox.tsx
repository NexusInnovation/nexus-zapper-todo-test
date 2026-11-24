import MuiCheckbox from '@mui/material/Checkbox'
import type { CheckboxProps as MuiCheckboxProps } from '@mui/material/Checkbox'
import { FormControlLabel } from '@mui/material'
import type { FormControlLabelProps } from '@mui/material'
import { useController, useFormContext } from 'react-hook-form'
import type { RegisterOptions } from 'react-hook-form'

type CheckboxProps = {
  name: string
  label?: string
  rules?: RegisterOptions
  formControlLabelProps?: Omit<FormControlLabelProps, 'control' | 'label'>
} & Omit<MuiCheckboxProps, 'name' | 'checked' | 'onChange' | 'value'>

function Checkbox({
  name,
  label,
  rules,
  formControlLabelProps,
  ...rest
}: CheckboxProps) {
  const { control } = useFormContext()
  const { field } = useController({ name, control, rules })

  const checkbox = (
    <MuiCheckbox
      {...rest}
      checked={!!field.value}
      onChange={(e) => field.onChange(e.target.checked)}
      slotProps={{
        ...rest.slotProps,
        input: { ref: field.ref },
      }}
    />
  )

  if (label) {
    return (
      <FormControlLabel
        {...formControlLabelProps}
        control={checkbox}
        label={label}
      />
    )
  }

  return checkbox
}

export default Checkbox
