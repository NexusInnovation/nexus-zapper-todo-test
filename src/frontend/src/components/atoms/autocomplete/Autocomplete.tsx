import MuiAutocomplete from '@mui/material/Autocomplete'
import type { AutocompleteProps as MuiAutocompleteProps } from '@mui/material/Autocomplete'
import MuiTextField from '@mui/material/TextField'
import type { TextFieldProps as MuiTextFieldProps } from '@mui/material/TextField'
import { useController, useFormContext } from 'react-hook-form'
import type { RegisterOptions } from 'react-hook-form'
import type { SelectOption } from '../form/SelectOption'

type AutocompleteProps = {
  name: string
  label?: string
  options: SelectOption[]
  onInputChange?: (value: string) => void
  rules?: RegisterOptions
  textFieldProps?: Partial<MuiTextFieldProps>
} & Omit<
  MuiAutocompleteProps<SelectOption, false, false, false>,
  'name' | 'options' | 'value' | 'onChange' | 'onInputChange' | 'renderInput'
>

function Autocomplete({
  name,
  label,
  options,
  onInputChange,
  rules,
  textFieldProps,
  ...rest
}: AutocompleteProps) {
  const { control } = useFormContext()
  const {
    field: { ref, value, onChange, name: fieldName, onBlur },
    fieldState,
  } = useController({ name, control, rules })

  const selectedOption = options.find((o) => o.id === value) ?? null

  return (
    <MuiAutocomplete<SelectOption>
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      {...rest}
      options={options}
      value={selectedOption}
      onChange={(_, newValue) => onChange(newValue?.id ?? '')}
      onBlur={onBlur}
      onInputChange={(_, inputValue) => onInputChange?.(inputValue)}
      renderInput={(params) => (
        <MuiTextField
          {...params}
          label={label}
          size="small"
          {...textFieldProps}
          inputRef={ref}
          error={!!fieldState.error}
          helperText={
            fieldState.error?.message ?? textFieldProps?.helperText ?? ' '
          }
          slotProps={{
            ...params.slotProps,
            ...textFieldProps?.slotProps,
            htmlInput: {
              ...params.slotProps.htmlInput,
              name: fieldName,
            },
          }}
        />
      )}
    />
  )
}

export default Autocomplete
