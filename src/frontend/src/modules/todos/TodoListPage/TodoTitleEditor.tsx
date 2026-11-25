import { Box, Button } from '@mui/material'
import type { KeyboardEvent } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import Form from '@/components/atoms/form/Form'
import TextField from '@/components/atoms/textfield/TextField'
import { toApiError } from '@/core/errors/ApiError'
import {
  titleErrorCode,
  todoTitleErrors,
  translatedTitleResolver,
  type TodoTitleFormInput,
  type TodoTitleFormValues,
} from '../types/todoTitle'

type TodoTitleEditorProps = {
  todoId: string
  title: string
  isSaving: boolean
  /** Sends the trimmed title; rejects with the API error when the server refuses it. */
  onSave: (title: string) => Promise<unknown>
  onCancel: () => void
}

/** Inline title field: Enter or « Enregistrer » saves, Escape or « Annuler » cancels. */
export function TodoTitleEditor({
  todoId,
  title,
  isSaving,
  onSave,
  onCancel,
}: TodoTitleEditorProps) {
  const { t } = useTranslation('todos')
  const { t: tCommon } = useTranslation('common')
  const translateCode = tCommon as (key: string) => string
  const formMethods = useForm<TodoTitleFormInput, unknown, TodoTitleFormValues>(
    {
      resolver: translatedTitleResolver(translateCode),
      defaultValues: { title },
      mode: 'onSubmit',
      reValidateMode: 'onSubmit',
    },
  )
  const hasError = !!formMethods.formState.errors.title

  const onSubmit = async (values: TodoTitleFormValues) => {
    try {
      await onSave(values.title)
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.status === 422) {
        formMethods.setError(
          'title',
          {
            message: translateCode(
              titleErrorCode(apiError.validationErrors) ??
                todoTitleErrors.required,
            ),
          },
          { shouldFocus: true },
        )
      }
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      if (!isSaving) onCancel()
    }
  }

  return (
    <Form
      formMethods={formMethods}
      onSubmit={onSubmit}
      aria-label={t('edit.formLabel')}
      style={{ flexGrow: 1, minWidth: 0 }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <TextField
          name="title"
          id={`todo-edit-title-${todoId}`}
          label={t('edit.titleLabel')}
          autoFocus
          autoComplete="off"
          onKeyDown={onKeyDown}
          sx={{ flex: '1 1 16rem' }}
          slotProps={{
            formHelperText: hasError ? { role: 'alert' } : undefined,
          }}
        />
        <Button type="submit" variant="contained" disabled={isSaving}>
          {t('edit.save')}
        </Button>
        <Button
          type="button"
          variant="text"
          onClick={onCancel}
          disabled={isSaving}
        >
          {t('edit.cancel')}
        </Button>
      </Box>
    </Form>
  )
}
