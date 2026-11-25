import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import { toApiError } from '@/core/errors/ApiError'
import { useTodoList } from '../hooks/useTodoList'
import { TodoCreateForm } from './TodoCreateForm'
import { TodoListItem } from './TodoListItem'

export function TodoListPage() {
  const { t } = useTranslation('todos')
  const { t: tCommon } = useTranslation('common')
  const list = useTodoList()

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
              <TodoListItem key={todo.id} todo={todo} />
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
    </Box>
  )
}
