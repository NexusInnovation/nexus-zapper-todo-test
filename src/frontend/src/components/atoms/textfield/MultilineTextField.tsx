import MuiTextField from '@mui/material/TextField'
import type { TextFieldProps as MuiTextFieldProps } from '@mui/material/TextField'
import type { FocusEvent, MouseEvent } from 'react'
import { useController, useFormContext } from 'react-hook-form'
import type { RegisterOptions } from 'react-hook-form'

type MultilineTextFieldProps = {
  name: string
  readOnly?: boolean
  rules?: RegisterOptions
  rows?: number
  minRows?: number
  maxRows?: number
} & Omit<MuiTextFieldProps, 'multiline' | 'rows' | 'minRows' | 'maxRows'>

function MultilineTextField({
  name,
  readOnly = false,
  rules,
  rows,
  minRows,
  maxRows,
  ...rest
}: MultilineTextFieldProps) {
  const { control } = useFormContext()
  const {
    field: { ref, ...field },
    fieldState,
  } = useController({ name, control, rules })

  const handleReadOnlyFocus = (event: FocusEvent<HTMLInputElement>) => {
    event.currentTarget.blur()
  }

  const handleReadOnlyMouseDown = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault()
  }

  const readonlySx = readOnly
    ? {
        '& .MuiOutlinedInput-root': {
          cursor: 'default',
        },
        '& .MuiInputBase-input': {
          cursor: 'default',
        },
        '& .MuiInputLabel-root': {
          cursor: 'default',
        },
        '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(0, 0, 0, 0.23)',
        },
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
          {
            borderColor: 'rgba(0, 0, 0, 0.23)',
            borderWidth: 1,
          },
      }
    : undefined
  const sx = [
    ...(Array.isArray(rest.sx) ? rest.sx : rest.sx ? [rest.sx] : []),
    ...(readonlySx ? [readonlySx] : []),
  ]

  return (
    <MuiTextField
      size="small"
      {...field}
      {...rest}
      multiline
      rows={rows}
      minRows={minRows}
      maxRows={maxRows}
      error={!!fieldState.error}
      helperText={fieldState.error?.message ?? rest.helperText ?? ' '}
      inputRef={ref}
      sx={sx}
      slotProps={{
        ...rest.slotProps,
        inputLabel: {
          ...rest.slotProps?.inputLabel,
          ...(readOnly ? { shrink: true } : {}),
        },
        input: {
          ...rest.slotProps?.input,
          readOnly,
          ...(readOnly
            ? {
                onFocus: handleReadOnlyFocus,
                onMouseDown: handleReadOnlyMouseDown,
              }
            : {}),
        },
        htmlInput: {
          ...rest.slotProps?.htmlInput,
          ...(readOnly
            ? { tabIndex: -1, onMouseDown: handleReadOnlyMouseDown }
            : {}),
        },
      }}
    />
  )
}

export default MultilineTextField
