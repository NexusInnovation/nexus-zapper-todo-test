import { expect, type APIResponse } from '@playwright/test'
import type { DataTable } from 'playwright-bdd'
import { Given, Then, When } from '../fixtures.ts'
import { countTodos, createTodo, todosUrl } from './todo-api.ts'
import { loadVolumeDataset } from './volume-dataset.ts'

// Shared test data, always created through the API of the BDD runner, never through the UI.

Given(
  /^un Todo existant « (.+) »$/,
  async ({ request, apiUrl }, title: string) => {
    await createTodo(request, apiUrl, title)
  },
)

Given(/^un Todo fait « (.+) »$/, async ({ request, apiUrl }, title: string) => {
  await createTodo(request, apiUrl, title, true)
})

Given(
  /^un Todo non fait « (.+) »$/,
  async ({ request, apiUrl }, title: string) => {
    await createTodo(request, apiUrl, title, false)
  },
)

Given(
  /^deux Todos existants « (.+) »$/,
  async ({ request, apiUrl }, title: string) => {
    await createTodo(request, apiUrl, title)
    await createTodo(request, apiUrl, title)
  },
)

Given(
  'les Todos suivants, créés dans cet ordre :',
  async ({ request, apiUrl }, table: DataTable) => {
    for (const row of table.hashes()) {
      await createTodo(request, apiUrl, row['titre'], row['fait'] === 'oui')
    }
  },
)

Given('aucun Todo', async ({ request, apiUrl }) => {
  expect(await countTodos(request, apiUrl)).toBe(0)
})

Given("c'est le seul Todo", async ({ request, apiUrl }) => {
  expect(await countTodos(request, apiUrl)).toBe(1)
})

Given('le jeu de données de volume réaliste est chargé', async ({ db }) => {
  await loadVolumeDataset(db.query)
})

// "Not found" scenarios: requests on a fresh GUID that was never created.
const notFoundResponses = new WeakMap<object, APIResponse>()

When(
  "je change l'état « fait » d'un Todo dont l'Id n'existe pas",
  async ({ request, apiUrl }) => {
    notFoundResponses.set(
      request,
      await request.put(`${todosUrl(apiUrl)}/${crypto.randomUUID()}`, {
        data: { title: 'Todo introuvable', isDone: true },
      }),
    )
  },
)

When(
  "je modifie le titre d'un Todo dont l'Id n'existe pas",
  async ({ request, apiUrl }) => {
    notFoundResponses.set(
      request,
      await request.put(`${todosUrl(apiUrl)}/${crypto.randomUUID()}`, {
        data: { title: 'Nouveau titre', isDone: false },
      }),
    )
  },
)

When(
  "je supprime un Todo dont l'Id n'existe pas",
  async ({ request, apiUrl }) => {
    notFoundResponses.set(
      request,
      await request.delete(`${todosUrl(apiUrl)}/${crypto.randomUUID()}`),
    )
  },
)

Then('une erreur « introuvable » est retournée', async ({ request }) => {
  const response = notFoundResponses.get(request)
  expect(response, 'no request was sent on an unknown Id').toBeDefined()
  expect(response!.status()).toBe(404)
  const problem = (await response!.json()) as Record<string, unknown>
  expect(problem.status).toBe(404)
  expect(problem.errorCode).toBe('errors.todo.notFound')
})
