import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
} from '@mui/material'
import MuiSelect from '@mui/material/Select'
import type { SelectProps as MuiSelectProps } from '@mui/material/Select'
import { get, useController, useFormContext } from 'react-hook-form'
import type { FieldError, RegisterOptions } from 'react-hook-form'
import type { SelectOption } from '../form/SelectOption'

type SelectProps = {
  name: string
  options: SelectOption[]
  rules?: RegisterOptions
} & Omit<MuiSelectProps, 'name'>

function Select({ name, options, rules, ...rest }: SelectProps) {
  const { formState, control } = useFormContext()
  const {
    field: { ref, ...field },
  } = useController({ name, control, rules })

  const fieldError: FieldError | undefined = get(formState.errors, name)
  const size = rest.size ?? 'small'

  return (
    <FormControl size={size} error={!!fieldError}>
      <InputLabel id={`${name}-label`}>{rest.label}</InputLabel>
      <MuiSelect
        labelId={`${name}-label`}
        size={size}
        {...field}
        {...rest}
        inputRef={ref}
      >
        {options.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.name}
          </MenuItem>
        ))}
      </MuiSelect>
      <FormHelperText>
        {fieldError ? `${fieldError.message}` : ' '}
      </FormHelperText>
    </FormControl>
  )
}

export default Select
