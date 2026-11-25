import { expect, type APIRequestContext } from '@playwright/test'

export type ApiTodo = {
  id: string
  title: string
  isDone: boolean
  createdAt: string
}

type TodoPage = { items: ApiTodo[]; totalCount: number }

const todosUrl = (apiUrl: string) => `${apiUrl}/api/todos`

/** Creates a Todo through the API and returns it as stored (one creation at a time). */
export async function createTodo(
  request: APIRequestContext,
  apiUrl: string,
  title: string,
  isDone = false,
): Promise<ApiTodo> {
  const created = await request.post(todosUrl(apiUrl), { data: { title } })
  expect(created.status(), await created.text()).toBe(201)
  const id = created.headers()['location']
  expect(id, 'the created Todo has no Location header').toBeTruthy()
  if (isDone) {
    const updated = await request.put(`${todosUrl(apiUrl)}/${id}`, {
      data: { title, isDone: true },
    })
    expect(updated.status(), await updated.text()).toBe(200)
  }
  const read = await request.get(`${todosUrl(apiUrl)}/${id}`)
  expect(read.status(), await read.text()).toBe(200)
  return (await read.json()) as ApiTodo
}

/** Reads every non-deleted Todo from the API, in creation order. */
export async function readTodos(
  request: APIRequestContext,
  apiUrl: string,
): Promise<ApiTodo[]> {
  const todos: ApiTodo[] = []
  for (let page = 1; ; page++) {
    const response = await request.get(todosUrl(apiUrl), {
      params: { page, pageSize: 100 },
    })
    expect(response.status(), await response.text()).toBe(200)
    const body = (await response.json()) as TodoPage
    todos.push(...body.items)
    if (body.items.length === 0 || todos.length >= body.totalCount) {
      return todos
    }
  }
}

/** Reads the number of non-deleted Todos from the API. */
export async function countTodos(
  request: APIRequestContext,
  apiUrl: string,
): Promise<number> {
  const response = await request.get(todosUrl(apiUrl), {
    params: { page: 1, pageSize: 1 },
  })
  expect(response.status(), await response.text()).toBe(200)
  return ((await response.json()) as TodoPage).totalCount
}

export { todosUrl }
