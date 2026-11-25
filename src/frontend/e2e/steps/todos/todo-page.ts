import { expect, type Page, type Response } from '@playwright/test'

/** Per-scenario state of the Todo page glue, keyed by the scenario's page. */
export type TodoPageState = {
  navigationStartedAt?: number
  firstLoadEndedAt?: number
  listResponses: Response[]
  dialogs: string[]
  lastTitle?: string
  targetId?: string
  /** PUT requests sent by the page on /api/todos/{id}. */
  updateRequests: number
}

const states = new WeakMap<Page, TodoPageState>()

export function pageState(page: Page): TodoPageState {
  let state = states.get(page)
  if (!state) {
    state = { listResponses: [], dialogs: [], updateRequests: 0 }
    states.set(page, state)
    page.on('dialog', (dialog) => {
      state!.dialogs.push(dialog.message())
      void dialog.dismiss()
    })
    page.on('request', (request) => {
      if (
        request.method() === 'PUT' &&
        new URL(request.url()).pathname.includes('/api/todos/')
      ) {
        state!.updateRequests++
      }
    })
    page.on('response', (response) => {
      const url = new URL(response.url())
      if (
        response.request().method() === 'GET' &&
        url.pathname.endsWith('/api/todos')
      ) {
        state!.listResponses.push(response)
      }
    })
  }
  return state
}

export const todoRows = (page: Page) => page.locator('[data-todo-id]')

/** The rows whose title is exactly `title` (in read mode). */
export const rowsByTitle = (page: Page, title: string) =>
  todoRows(page).filter({
    has: page.locator('[data-todo-title]').getByText(title, { exact: true }),
  })

export const rowByTitle = (page: Page, title: string) =>
  rowsByTitle(page, title).first()

export const rowById = (page: Page, id: string) =>
  page.locator(`[data-todo-id="${id}"]`)

export const titleOf = (row: ReturnType<typeof rowById>) =>
  row.locator('[data-todo-title]')

export const createTitleField = (page: Page) =>
  page.getByRole('textbox', { name: /^(Titre du Todo|Todo title)$/ })

/** Waits for the end of the first list load: rows, empty state or error. */
export async function waitForFirstLoad(page: Page) {
  await expect(page.locator('#todo-list')).toHaveAttribute(
    'aria-busy',
    'false',
    { timeout: 15_000 },
  )
}

export async function openTodoList(page: Page) {
  const state = pageState(page)
  state.listResponses = []
  state.navigationStartedAt = Date.now()
  await page.goto('/')
  await waitForFirstLoad(page)
  state.firstLoadEndedAt = Date.now()
}

/** Types a title in the creation field and submits it with the "Ajouter" button. */
export async function submitNewTodo(page: Page, title: string) {
  pageState(page).lastTitle = title
  await createTitleField(page).fill(title)
  await page.getByRole('button', { name: /^(Ajouter|Add)$/ }).click()
}

/** Creates a Todo through the form and waits for its row. */
export async function createTodoThroughForm(page: Page, title: string) {
  const created = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname.endsWith('/api/todos'),
  )
  await submitNewTodo(page, title)
  expect((await created).status()).toBe(201)
  await expect(rowsByTitle(page, title.trim()).last()).toBeVisible()
}

const parseRgb = (color: string) => {
  const [r, g, b, a = 1] = (color.match(/[\d.]+/g) ?? []).map(Number)
  return { r, g, b, a }
}

/** Grey level of a text colour over the white page (0 = black, 255 = white). */
export function greyLevel(color: string) {
  const { r, g, b, a } = parseRgb(color)
  const blend = (channel: number) => channel * a + 255 * (1 - a)
  return (blend(r) + blend(g) + blend(b)) / 3
}

export async function titleStyle(page: Page, title: string) {
  return titleOf(rowByTitle(page, title)).evaluate((element) => {
    const style = element.ownerDocument.defaultView!.getComputedStyle(element)
    return { decoration: style.textDecorationLine, color: style.color }
  })
}
