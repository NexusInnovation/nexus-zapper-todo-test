import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiFetch } from '@/core/api/apiFetch'
import { toApiError } from '@/core/errors/ApiError'
import {
  appendedTodosKey,
  changeTotalCount,
  removeTodo,
  removeTodoFromPages,
  todoListKey,
  type TodoListData,
} from '../cache/todoListCache'
import type { Todo } from '../types/Todo'

/**
 * DELETE of one Todo by id. Success removes the row from every loaded page and the appended rows
 * and lowers the total; success or failure then reloads ['todos'], because the offset pages after
 * the removed row have shifted and « Afficher plus » must not skip a Todo. Errors go to the global
 * toast.
 */
export function useTodoDelete() {
  const queryClient = useQueryClient()

  const forget = (id: string) =>
    queryClient.setQueryData<Todo[]>(appendedTodosKey, (appended = []) =>
      removeTodo(appended, id),
    )

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(`/todos/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw await response.json()
      }
    },
    onSuccess: (_result, id) => {
      queryClient.setQueryData<TodoListData>(todoListKey, (data) =>
        changeTotalCount(removeTodoFromPages(data, id), -1),
      )
      forget(id)
    },
    onError: (error, id) => {
      if (toApiError(error).status === 404) forget(id)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: todoListKey }),
  })
}
