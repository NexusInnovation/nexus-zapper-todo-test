import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTodoCreate } from './useTodoCreate'
import { useTodoDelete } from './useTodoDelete'
import { useTodoList } from './useTodoList'

type ServerTodo = {
  id: string
  title: string
  isDone: boolean
  createdAt: string
}

/** In-memory /api/todos with offset pagination in creation order, like the real API. */
function fakeServer(initialCount: number) {
  let next = 0
  const todos: ServerTodo[] = []
  const add = (title: string) => {
    next++
    const todo = {
      id: `00000000-0000-4000-8000-${String(next).padStart(12, '0')}`,
      title,
      isDone: false,
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, next)).toISOString(),
    }
    todos.push(todo)
    return todo
  }
  for (let n = 1; n <= initialCount; n++) add(`Todo ${n}`)

  const json = (body: unknown, status = 200, headers = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', ...headers },
    })

  return async (input: string, init: RequestInit = {}) => {
    const url = new URL(input, 'http://api.test')
    const id = /\/todos\/([^/]+)$/.exec(url.pathname)?.[1]
    const method = init.method ?? 'GET'
    if (method === 'GET' && !id) {
      const page = Number(url.searchParams.get('page'))
      const size = Number(url.searchParams.get('pageSize'))
      return json({
        items: todos.slice((page - 1) * size, page * size),
        totalCount: todos.length,
      })
    }
    if (method === 'POST') {
      const { title } = JSON.parse(init.body as string) as { title: string }
      return json(null, 201, { Location: add(title).id })
    }
    const index = todos.findIndex((todo) => todo.id === id)
    if (index < 0)
      return json({ status: 404, errorCode: 'errors.todo.notFound' }, 404)
    if (method === 'DELETE') {
      todos.splice(index, 1)
      return new Response(null, { status: 204 })
    }
    return json(todos[index])
  }
}

function useTodoPage() {
  return {
    list: useTodoList(),
    create: useTodoCreate(),
    remove: useTodoDelete(),
  }
}

describe('todo list flow', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(fakeServer(52)))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('create, delete an older Todo, then show more: no Todo lost or duplicated', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(useTodoPage, { wrapper })
    await waitFor(() => expect(result.current.list.rows).toHaveLength(50))

    await act(() => result.current.create.mutateAsync({ title: 'Todo 53' }))
    await waitFor(() => expect(result.current.list.totalCount).toBe(53))
    expect(result.current.list.rows).toHaveLength(51)

    const oldest = result.current.list.rows[0].id
    await act(() => result.current.remove.mutateAsync(oldest))
    await waitFor(() => expect(result.current.list.totalCount).toBe(52))
    expect(result.current.list.hasMore).toBe(true)

    await act(() => result.current.list.fetchMore())
    await waitFor(() => expect(result.current.list.rows).toHaveLength(52))

    const titles = result.current.list.rows.map((todo) => todo.title)
    expect(titles).toEqual(
      Array.from({ length: 52 }, (_, index) => `Todo ${index + 2}`),
    )
    expect(result.current.list.hasMore).toBe(false)
  })
})
