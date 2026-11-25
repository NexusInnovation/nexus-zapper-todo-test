import type { InfiniteData } from '@tanstack/react-query'

import type { Todo, TodoPage } from '../types/Todo'

export const todoPageSize = 50
export const todoListKey = ['todos'] as const
// Todos created during this visit beyond the loaded pages; kept outside ['todos'] so that a
// reload of the pages (invalidation) never drops them.
export const appendedTodosKey = ['todos-appended'] as const

export type TodoListData = InfiniteData<TodoPage, number>

/**
 * Merge rule: rows of the loaded pages in creation order, then the Todos appended locally that no
 * loaded page contains yet. Rows are unique by id.
 */
export function mergeTodoRows(
  data: TodoListData | undefined,
  appended: readonly Todo[],
): Todo[] {
  const rows: Todo[] = []
  const seen = new Set<string>()
  for (const todo of [
    ...(data?.pages.flatMap((page) => page.items) ?? []),
    ...appended,
  ]) {
    if (!seen.has(todo.id)) {
      seen.add(todo.id)
      rows.push(todo)
    }
  }
  return rows
}

export function totalCountOf(data: TodoListData | undefined) {
  return data?.pages.at(-1)?.totalCount ?? 0
}

/** Adds a created Todo to the appended rows, once. */
export function appendTodo(appended: readonly Todo[], todo: Todo): Todo[] {
  return appended.some((item) => item.id === todo.id)
    ? [...appended]
    : [...appended, todo]
}

export function changeTotalCount(
  data: TodoListData | undefined,
  delta: number,
): TodoListData | undefined {
  if (!data) return data
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      totalCount: Math.max(0, page.totalCount + delta),
    })),
  }
}

/** Replaces the Todo of the same id in place, wherever it is loaded. */
export function replaceTodoInPages(
  data: TodoListData | undefined,
  todo: Todo,
): TodoListData | undefined {
  if (!data) return data
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => (item.id === todo.id ? todo : item)),
    })),
  }
}

export function replaceTodo(appended: readonly Todo[], todo: Todo): Todo[] {
  return appended.map((item) => (item.id === todo.id ? todo : item))
}

export function removeTodoFromPages(
  data: TodoListData | undefined,
  id: string,
): TodoListData | undefined {
  if (!data) return data
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.filter((item) => item.id !== id),
    })),
  }
}

export function removeTodo(appended: readonly Todo[], id: string): Todo[] {
  return appended.filter((item) => item.id !== id)
}
