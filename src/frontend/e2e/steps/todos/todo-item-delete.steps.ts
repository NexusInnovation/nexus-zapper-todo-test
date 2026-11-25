import { expect, type Page } from '@playwright/test'
import { Then, When } from '../fixtures.ts'
import { readTodos } from './todo-api.ts'
import {
  pageState,
  rowById,
  rowByTitle,
  rowsByTitle,
  todoRows,
} from './todo-page.ts'

const deleteButtonOf = (row: ReturnType<typeof rowById>) =>
  row.getByRole('button', { name: /^(Supprimer|Delete) / })

const confirmDialog = (page: Page) => page.getByRole('dialog')

const isDeleteOf = (id: string, method: string, url: string) =>
  method === 'DELETE' && new URL(url).pathname.endsWith(`/api/todos/${id}`)

async function askDeletion(page: Page, id: string) {
  pageState(page).targetId = id
  await deleteButtonOf(rowById(page, id)).click()
  await expect(confirmDialog(page)).toBeVisible()
}

/** Confirms the open dialog and waits for the 204 and the row to leave the list. */
async function confirmDeletion(page: Page) {
  const id = pageState(page).targetId!
  const deleted = page.waitForResponse((response) =>
    isDeleteOf(id, response.request().method(), response.url()),
  )
  await confirmDialog(page)
    .getByRole('button', { name: /^(Supprimer|Delete)$/ })
    .click()
  expect((await deleted).status()).toBe(204)
  await expect(confirmDialog(page)).toHaveCount(0)
  await expect(rowById(page, id)).toHaveCount(0)
}

const idOfTitle = async (page: Page, title: string) =>
  (await rowByTitle(page, title).getAttribute('data-todo-id'))!

Then(
  /^le Todo « (.+) » affiche un bouton « Supprimer »$/,
  async ({ page }, title: string) => {
    const button = deleteButtonOf(rowByTitle(page, title))
    await expect(button).toBeVisible()
    await expect(button).toHaveAccessibleName(`Supprimer ${title}`)
  },
)

When(
  /^je clique sur « Supprimer » pour le Todo « (.+) »$/,
  async ({ page }, title: string) => {
    await askDeletion(page, await idOfTitle(page, title))
  },
)

When(
  /^je clique sur « Supprimer » pour le Todo « (.+) » et que j'annule la confirmation$/,
  async ({ page }, title: string) => {
    const id = await idOfTitle(page, title)
    await askDeletion(page, id)
    await confirmDialog(page)
      .getByRole('button', { name: /^(Annuler|Cancel)$/ })
      .click()
    await expect(confirmDialog(page)).toHaveCount(0)
    await expect(deleteButtonOf(rowById(page, id))).toBeFocused()
  },
)

Then(
  /^la confirmation « (.+) » est demandée$/,
  async ({ page }, message: string) => {
    await expect(confirmDialog(page)).toBeVisible()
    await expect(
      confirmDialog(page).getByText(message, { exact: true }),
    ).toBeVisible()
  },
)

Then(
  /^le Todo « (.+) » n'est pas encore supprimé$/,
  async ({ page, request, apiUrl }, title: string) => {
    await expect(confirmDialog(page)).toBeVisible()
    await expect(rowById(page, pageState(page).targetId!)).toHaveCount(1)
    expect(
      (await readTodos(request, apiUrl)).map((todo) => todo.title),
    ).toContain(title)
  },
)

When(
  /^je supprime le Todo « (.+) » en confirmant$/,
  async ({ page }, title: string) => {
    await askDeletion(page, await idOfTitle(page, title))
    await confirmDeletion(page)
    await expect(page.locator(':focus')).not.toHaveCount(0)
  },
)

Then(
  /^le Todo « (.+) » n'apparaît plus dans la liste$/,
  async ({ page, request, apiUrl }, title: string) => {
    await expect(rowsByTitle(page, title)).toHaveCount(0)
    expect(
      (await readTodos(request, apiUrl)).map((todo) => todo.title),
    ).not.toContain(title)
  },
)

When(
  /^je supprime en confirmant le premier des deux Todos « (.+) »$/,
  async ({ page, request, apiUrl }, title: string) => {
    const [first] = (await readTodos(request, apiUrl)).filter(
      (todo) => todo.title === title,
    )
    await askDeletion(page, first.id)
    await confirmDeletion(page)
  },
)

Then(
  /^un seul Todo « (.+) » reste dans la liste$/,
  async ({ page }, title: string) => {
    await expect(rowsByTitle(page, title)).toHaveCount(1)
    await expect(todoRows(page)).toHaveCount(1)
  },
)

Then(
  "c'est le second, dont l'Id n'était pas ciblé",
  async ({ page, request, apiUrl }) => {
    const targeted = pageState(page).targetId!
    const remaining = await readTodos(request, apiUrl)
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).not.toBe(targeted)
    await expect(todoRows(page).first()).toHaveAttribute(
      'data-todo-id',
      remaining[0].id,
    )
  },
)
