import { Box, Button } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import Form from '@/components/atoms/form/Form'
import TextField from '@/components/atoms/textfield/TextField'
import { toApiError } from '@/core/errors/ApiError'
import { useTodoCreate } from '../hooks/useTodoCreate'
import {
  titleErrorCode,
  todoTitleErrors,
  translatedTitleResolver,
  type TodoTitleFormInput,
  type TodoTitleFormValues,
} from '../types/todoTitle'

export function TodoCreateForm() {
  const { t } = useTranslation('todos')
  const { t: tCommon } = useTranslation('common')
  const createTodo = useTodoCreate()
  const translateCode = tCommon as (key: string) => string
  const formMethods = useForm<TodoTitleFormInput, unknown, TodoTitleFormValues>(
    {
      resolver: translatedTitleResolver(translateCode),
      defaultValues: { title: '' },
      mode: 'onSubmit',
      reValidateMode: 'onSubmit',
    },
  )
  const hasError = !!formMethods.formState.errors.title

  const onSubmit = async ({ title }: TodoTitleFormValues) => {
    try {
      await createTodo.mutateAsync({ title })
      formMethods.reset({ title: '' })
      formMethods.setFocus('title')
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.status === 422) {
        formMethods.setError('title', {
          message: translateCode(
            titleErrorCode(apiError.validationErrors) ??
              todoTitleErrors.required,
          ),
        })
        formMethods.setFocus('title')
      }
    }
  }

  return (
    <Form
      formMethods={formMethods}
      onSubmit={onSubmit}
      aria-label={t('create.formLabel')}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <TextField
          name="title"
          id="todo-create-title"
          label={t('create.titleLabel')}
          placeholder={t('create.titlePlaceholder')}
          fullWidth
          autoComplete="off"
          slotProps={{
            formHelperText: hasError ? { role: 'alert' } : undefined,
          }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={createTodo.isPending}
          sx={{ flexShrink: 0, minHeight: 40 }}
        >
          {t('create.submit')}
        </Button>
      </Box>
    </Form>
  )
}
