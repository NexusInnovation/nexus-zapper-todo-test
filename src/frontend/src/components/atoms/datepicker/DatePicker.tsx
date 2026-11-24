import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker'
import type { DatePickerProps as MuiDatePickerProps } from '@mui/x-date-pickers/DatePicker'
import type { FieldRef } from '@mui/x-date-pickers/models'
import type { FocusEvent, MouseEvent } from 'react'
import { useCallback } from 'react'
import { useState } from 'react'
import { get, useController, useFormContext } from 'react-hook-form'
import type { FieldError, RegisterOptions } from 'react-hook-form'

type DatePickerFocusField = Pick<
  FieldRef<never>,
  'focusField' | 'setSelectedSections'
>

type DatePickerProps = {
  name: string
  rules?: RegisterOptions
} & Omit<MuiDatePickerProps, 'value' | 'onChange'>

function DatePicker({ name, onError, rules, ...rest }: DatePickerProps) {
  const { control, formState, trigger } = useFormContext()
  const {
    field: { ref, ...field },
  } = useController({ name, control, rules })

  const [muiError, setMuiError] = useState(false)
  const fieldError: FieldError | undefined = get(formState.errors, name)
  const fieldSlotProps = rest.slotProps?.field
  const fieldSlotPropsObject =
    typeof fieldSlotProps === 'function' ? undefined : fieldSlotProps
  const textFieldSlotProps = rest.slotProps?.textField
  const textFieldSlotPropsObject =
    typeof textFieldSlotProps === 'function' ? undefined : textFieldSlotProps

  const handleFieldRef = useCallback(
    (fieldRef: DatePickerFocusField | null) => {
      if (!fieldRef) {
        return
      }

      ref({
        focus: () => fieldRef.focusField(),
        select: () => fieldRef.setSelectedSections('all'),
        setCustomValidity: () => undefined,
        reportValidity: () => true,
      })
    },
    [ref],
  )

  const handleReadOnlyFocus = (event: FocusEvent<HTMLElement>) => {
    event.currentTarget.blur()
  }

  const handleReadOnlyMouseDown = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const readonlySx = rest.readOnly
    ? {
        '& .MuiPickersInputBase-root': {
          cursor: 'default',
        },
        '& .MuiPickersInputBase-sectionsContainer': {
          cursor: 'default',
        },
        '& .MuiPickersOutlinedInput-sectionsContainer': {
          cursor: 'default',
          userSelect: 'none',
        },
        '& .MuiPickersSectionList-root': {
          userSelect: 'none',
        },
        '& .MuiPickersSectionList-sectionContent': {
          cursor: 'default',
          userSelect: 'none',
        },
        '& .MuiPickersSectionList-sectionContent:focus': {
          outline: 'none',
        },
        '& .MuiPickersOutlinedInput-root:hover .MuiPickersOutlinedInput-notchedOutline':
          {
            borderColor: 'rgba(0, 0, 0, 0.23)',
          },
        '& .MuiPickersOutlinedInput-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline':
          {
            borderColor: 'rgba(0, 0, 0, 0.23)',
            borderWidth: 1,
          },
        '& .MuiPickersOutlinedInput-root.MuiPickersInputBase-focused .MuiPickersOutlinedInput-notchedOutline':
          {
            borderColor: 'rgba(0, 0, 0, 0.23)',
            borderWidth: 1,
          },
        '& .MuiPickersOutlinedInput-root.MuiPickersInputBase-focused:not(.MuiPickersInputBase-error) .MuiPickersOutlinedInput-notchedOutline':
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
    <MuiDatePicker
      {...field}
      {...rest}
      disableOpenPicker={rest.readOnly ? true : rest.disableOpenPicker}
      selectedSections={rest.readOnly ? null : rest.selectedSections}
      sx={sx}
      onError={(error, value) => {
        setMuiError(!!error)
        void trigger(name)
        onError?.(error, value)
      }}
      slotProps={{
        ...rest.slotProps,
        field: {
          ...fieldSlotPropsObject,
          fieldRef: handleFieldRef,
        },
        textField: {
          size: 'small',
          ...textFieldSlotPropsObject,
          ...(rest.readOnly ? { focused: false } : {}),
          ...(rest.readOnly
            ? {
                onFocus: handleReadOnlyFocus,
                onMouseDown: handleReadOnlyMouseDown,
              }
            : {}),
          slotProps: {
            ...textFieldSlotPropsObject?.slotProps,
            inputLabel: {
              ...textFieldSlotPropsObject?.slotProps?.inputLabel,
              ...(rest.readOnly ? { shrink: true } : {}),
            },
            input: {
              ...textFieldSlotPropsObject?.slotProps?.input,
              ...(rest.readOnly
                ? {
                    slotProps: {
                      ...textFieldSlotPropsObject?.slotProps?.input?.slotProps,
                      sectionContent: {
                        ...textFieldSlotPropsObject?.slotProps?.input?.slotProps
                          ?.sectionContent,
                        onClick: handleReadOnlyMouseDown,
                        onFocus: handleReadOnlyFocus,
                        onMouseDown: handleReadOnlyMouseDown,
                      },
                    },
                  }
                : {}),
            },
            htmlInput: {
              ...textFieldSlotPropsObject?.slotProps?.htmlInput,
              ...(rest.readOnly
                ? { tabIndex: -1, onMouseDown: handleReadOnlyMouseDown }
                : {}),
            },
          },
          error: !!fieldError || muiError,
          helperText: fieldError
            ? `${fieldError.message}`
            : (textFieldSlotPropsObject?.helperText ?? ' '),
        },
      }}
      inputRef={ref}
      timezone="system"
    />
  )
}

export default DatePicker
