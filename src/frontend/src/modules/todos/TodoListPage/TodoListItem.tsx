import { Box, Checkbox, ListItem, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import type { Todo } from '../types/Todo'

type TodoListItemProps = { todo: Todo }

export function TodoListItem({ todo }: TodoListItemProps) {
  const { t } = useTranslation('todos')

  return (
    <ListItem
      data-todo-id={todo.id}
      divider
      sx={{ gap: 1, alignItems: 'center', px: 1 }}
    >
      <Checkbox
        checked={todo.isDone}
        slotProps={{
          input: {
            'aria-label': t('item.done', { title: todo.title }),
            readOnly: true,
          },
        }}
      />
      <Typography
        component="span"
        data-todo-title
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
      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }} />
    </ListItem>
  )
}
