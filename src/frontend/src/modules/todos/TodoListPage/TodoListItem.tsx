import { Box, Button, Checkbox, ListItem, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { DeleteActionButton } from '@/core/components/atoms/DeleteActionButton/DeleteActionButton'
import { toApiError } from '@/core/errors/ApiError'
import { useTodoUpdate, type TodoChange } from '../hooks/useTodoUpdate'
import type { Todo } from '../types/Todo'
import { TodoTitleEditor } from './TodoTitleEditor'

type TodoListItemProps = {
  todo: Todo
  isEditing: boolean
  onEditingChange: (editing: boolean) => void
  onDelete: () => void
}

export function TodoListItem({
  todo,
  isEditing,
  onEditingChange,
  onDelete,
}: TodoListItemProps) {
  const { t } = useTranslation('todos')
  const update = useTodoUpdate(todo.id)
  const [failed, setFailed] = useState(false)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const restoreFocus = useRef(false)

  useEffect(() => {
    if (!isEditing && restoreFocus.current) {
      restoreFocus.current = false
      editButtonRef.current?.focus()
    }
  }, [isEditing])

  const save = async (change: TodoChange) => {
    setFailed(false)
    try {
      return await update.mutateAsync(change)
    } catch (error) {
      if (toApiError(error).status !== 422) setFailed(true)
      throw error
    }
  }

  const closeEditor = () => {
    restoreFocus.current = true
    onEditingChange(false)
  }

  return (
    <ListItem
      data-todo-id={todo.id}
      divider
      sx={{ gap: 1, alignItems: 'center', px: 1, flexWrap: 'wrap' }}
    >
      {/* TODO(A06): MUI Checkbox rather than the form-bound Checkbox atom, which needs a react-hook-form context. */}
      {/* TODO(A07): aria-disabled while the request runs, so keyboard focus stays on the checkbox. */}
      <Checkbox
        checked={todo.isDone}
        onChange={(event) => {
          if (update.isPending) return
          save({ isDone: event.target.checked }).catch(() => undefined)
        }}
        slotProps={{
          input: {
            'aria-label': t('item.done', { title: todo.title }),
            'aria-disabled': update.isPending || undefined,
          },
        }}
        sx={update.isPending ? { opacity: 0.38 } : undefined}
      />
      {isEditing ? (
        <TodoTitleEditor
          todoId={todo.id}
          title={todo.title}
          isSaving={update.isPending}
          onSave={async (title) => {
            await save({ title })
            closeEditor()
          }}
          onCancel={closeEditor}
        />
      ) : (
        <>
          <Typography
            component="span"
            data-todo-title
            onDoubleClick={() => onEditingChange(true)}
            sx={{
              flexGrow: 1,
              minWidth: 0,
              overflowWrap: 'anywhere',
              whiteSpace: 'pre-wrap',
              ...(todo.isDone && {
                textDecoration: 'line-through',
                color: 'text.secondary',
              }),
            }}
          >
            {todo.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            <Button
              ref={editButtonRef}
              size="small"
              onClick={() => onEditingChange(true)}
            >
              {t('item.edit')}
            </Button>
            <DeleteActionButton
              onClick={onDelete}
              ariaLabel={t('list.actions.delete', { title: todo.title })}
              disabled={update.isPending}
            />
          </Box>
        </>
      )}
      {failed && (
        <Typography
          role="alert"
          color="error"
          variant="body2"
          sx={{ flexBasis: '100%', pl: 6 }}
        >
          {t('item.saveFailed')}
        </Typography>
      )}
    </ListItem>
  )
}
