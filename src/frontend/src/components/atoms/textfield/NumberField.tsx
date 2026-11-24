import MuiTextField from '@mui/material/TextField'
import type { TextFieldProps as MuiTextFieldProps } from '@mui/material/TextField'
import type {
  ChangeEvent,
  ClipboardEvent,
  DragEvent,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
} from 'react'
import { useController, useFormContext } from 'react-hook-form'
import type { RegisterOptions } from 'react-hook-form'

type NumberFieldProps = {
  name: string
  decimal?: boolean
  readOnly?: boolean
  rules?: RegisterOptions
} & Omit<MuiTextFieldProps, 'type' | 'multiline'>

const unsupportedNumberCharacters = /[eE+]/

const isUnsupportedNumberKey = (key: string) =>
  key.length === 1 && unsupportedNumberCharacters.test(key)

function NumberField({
  name,
  decimal = false,
  readOnly = false,
  rules,
  ...rest
}: NumberFieldProps) {
  const { control } = useFormContext()
  const {
    field: { ref, ...field },
    fieldState,
  } = useController({ name, control, rules })

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    if (raw === '') {
      field.onChange('')
      return
    }
    if (unsupportedNumberCharacters.test(raw)) {
      return
    }
    const nextValue = decimal ? parseFloat(raw) : parseInt(raw, 10)
    if (Number.isNaN(nextValue)) {
      return
    }
    field.onChange(nextValue)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    rest.onKeyDown?.(event)
    if (event.defaultPrevented) {
      return
    }
    if (isUnsupportedNumberKey(event.key)) {
      event.preventDefault()
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    if (unsupportedNumberCharacters.test(event.clipboardData.getData('text'))) {
      event.preventDefault()
    }
  }

  const handleDrop = (event: DragEvent<HTMLInputElement>) => {
    if (unsupportedNumberCharacters.test(event.dataTransfer.getData('text'))) {
      event.preventDefault()
    }
  }

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
      type="number"
      error={!!fieldState.error}
      helperText={fieldState.error?.message ?? rest.helperText ?? ' '}
      inputRef={ref}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
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
          onDrop: handleDrop,
          onPaste: handlePaste,
          ...(readOnly
            ? { tabIndex: -1, onMouseDown: handleReadOnlyMouseDown }
            : {}),
        },
      }}
    />
  )
}

export default NumberField
