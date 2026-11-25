import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/core/components/molecules/ConfirmDialog/ConfirmDialog'
import { toApiError } from '@/core/errors/ApiError'
import { useTodoDelete } from '../hooks/useTodoDelete'
import type { Todo } from '../types/Todo'
import { useTodoList } from '../hooks/useTodoList'
import { TodoCreateForm } from './TodoCreateForm'
import { TodoListItem } from './TodoListItem'

export function TodoListPage() {
  const { t } = useTranslation('todos')
  const { t: tCommon } = useTranslation('common')
  const list = useTodoList()
  // One row edits at a time: opening another row cancels the current edit.
  const [editingId, setEditingId] = useState<string | null>(null)
  // The target outlives `deleteOpen` so the dialog keeps its text while it closes.
  const [pendingDelete, setPendingDelete] = useState<Todo | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteTodo = useTodoDelete()

  const confirmDelete = async () => {
    if (!pendingDelete || !deleteOpen) return
    const { id } = pendingDelete
    const ids = list.rows.map((todo) => todo.id)
    const index = ids.indexOf(id)
    const neighbourId = ids[index + 1] ?? ids[index - 1]
    let removed = true
    try {
      await deleteTodo.mutateAsync(id)
    } catch (error) {
      removed = toApiError(error).status === 404
    }
    setDeleteOpen(false)
    if (removed) {
      // The trigger is gone: move the focus to the neighbour row, or to the creation field.
      setTimeout(() => focusAfterDelete(neighbourId))
    }
  }

  return (
    <Box
      component="section"
      aria-labelledby="todos-title"
      sx={{ display: 'grid', gap: 3, maxWidth: 780 }}
    >
      <Typography id="todos-title" component="h1" variant="h4">
        {t('list.title')}
      </Typography>

      <TodoCreateForm />

      <Box id="todo-list" aria-busy={list.isLoading}>
        {list.isLoading ? (
          <CircularProgress aria-label={t('list.loading')} size={32} />
        ) : list.isError ? (
          <Alert severity="error">
            {(tCommon as (key: string) => string)(
              toApiError(list.error).errorCode,
            )}
          </Alert>
        ) : list.rows.length === 0 ? (
          <Typography color="text.secondary">{t('list.empty')}</Typography>
        ) : (
          <List aria-label={t('list.ariaLabel')} disablePadding>
            {list.rows.map((todo) => (
              <TodoListItem
                key={todo.id}
                todo={todo}
                isEditing={editingId === todo.id}
                onEditingChange={(editing) =>
                  setEditingId(editing ? todo.id : null)
                }
                onDelete={() => {
                  setPendingDelete(todo)
                  setDeleteOpen(true)
                }}
              />
            ))}
          </List>
        )}

        {list.hasMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => void list.fetchMore()}
              disabled={list.isFetchingMore}
            >
              {t('list.showMore')}
            </Button>
          </Box>
        )}
      </Box>

      <ConfirmDialog
        open={deleteOpen}
        title={t('list.confirmDelete.title')}
        message={t('list.confirmDelete.message', {
          title: pendingDelete?.title ?? '',
        })}
        confirmLabel={t('list.confirmDelete.confirm')}
        cancelLabel={t('list.confirmDelete.cancel')}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteOpen(false)}
        isConfirming={deleteTodo.isPending}
      />
    </Box>
  )
}

function focusAfterDelete(neighbourId: string | undefined) {
  const neighbourDelete = neighbourId
    ? document.querySelector<HTMLElement>(
        `[data-todo-id="${neighbourId}"] button[aria-label]`,
      )
    : null
  ;(neighbourDelete ?? document.getElementById('todo-create-title'))?.focus()
}
