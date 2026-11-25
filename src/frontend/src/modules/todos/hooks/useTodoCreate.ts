import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiFetch } from '@/core/api/apiFetch'
import { parseResponse } from '@/core/api/parseResponse'
import {
  appendTodo,
  appendedTodosKey,
  changeTotalCount,
  todoListKey,
  type TodoListData,
} from '../cache/todoListCache'
import { TodoSchema, type Todo } from '../types/Todo'

export type CreateTodoInput = { title: string }

/** POST, then reads the created Todo by the id of `Location` and appends it to the list. */
export function useTodoCreate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: CreateTodoInput) => {
      const response = await apiFetch('/todos', {
        method: 'POST',
        body: JSON.stringify(values),
      })
      if (!response.ok) {
        throw await response.json()
      }
      const id = response.headers.get('Location')?.split('/').pop()
      const created = await apiFetch(`/todos/${id}`)
      if (!created.ok) {
        throw await created.json()
      }
      return parseResponse(TodoSchema, await created.json(), 'Todo')
    },
    onSuccess: (todo) => {
      queryClient.setQueryData<Todo[]>(appendedTodosKey, (appended = []) =>
        appendTodo(appended, todo),
      )
      queryClient.setQueryData<TodoListData>(todoListKey, (data) =>
        changeTotalCount(data, 1),
      )
    },
    meta: { localErrors: [422] },
  })
}
