import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiFetch } from '@/core/api/apiFetch'
import { parseResponse } from '@/core/api/parseResponse'
import { toApiError } from '@/core/errors/ApiError'
import {
  appendedTodosKey,
  findTodo,
  removeTodo,
  replaceTodo,
  replaceTodoInPages,
  todoListKey,
  type TodoListData,
} from '../cache/todoListCache'
import { TodoSchema, type Todo } from '../types/Todo'

/** What a row changes: the title, the done state, or both. */
export type TodoChange = Partial<Pick<Todo, 'title' | 'isDone'>>

/**
 * PUT `{ title, isDone }` of one Todo. Updates of a row run one at a time (mutation scope) and each
 * payload is built, when it is sent, from the Todo last confirmed by the server, so that saving the
 * title never undoes a concurrent change of the done state (and conversely). No optimistic update:
 * the cache only takes the server response.
 */
export function useTodoUpdate(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    scope: { id: `todo-update-${id}` },
    mutationFn: async (change: TodoChange) => {
      const current = findTodo(
        queryClient.getQueryData<TodoListData>(todoListKey),
        queryClient.getQueryData<Todo[]>(appendedTodosKey) ?? [],
        id,
      )
      const response = await apiFetch(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: change.title ?? current?.title ?? '',
          isDone: change.isDone ?? current?.isDone ?? false,
        }),
      })
      if (!response.ok) {
        throw await response.json()
      }
      return parseResponse(TodoSchema, await response.json(), 'Todo')
    },
    onSuccess: (todo) => {
      queryClient.setQueryData<TodoListData>(todoListKey, (data) =>
        replaceTodoInPages(data, todo),
      )
      queryClient.setQueryData<Todo[]>(appendedTodosKey, (appended = []) =>
        replaceTodo(appended, todo),
      )
    },
    onError: async (error) => {
      const apiError = toApiError(error)
      if (apiError.status === 422) return
      if (apiError.status === 404) {
        queryClient.setQueryData<Todo[]>(appendedTodosKey, (appended = []) =>
          removeTodo(appended, id),
        )
      }
      await queryClient.invalidateQueries({ queryKey: todoListKey })
    },
    meta: { localErrors: 'all' },
  })
}
