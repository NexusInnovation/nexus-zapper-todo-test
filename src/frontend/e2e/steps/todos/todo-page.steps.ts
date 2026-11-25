import { expect } from '@playwright/test'
import type { DataTable } from 'playwright-bdd'
import { Given, Then, When } from '../fixtures.ts'
import { countTodos, readTodos } from './todo-api.ts'
import {
  createTitleField,
  createTodoThroughForm,
  greyLevel,
  openTodoList,
  pageState,
  rowByTitle,
  rowsByTitle,
  submitNewTodo,
  titleOf,
  titleStyle,
  todoRows,
} from './todo-page.ts'

const guidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Navigation

When("j'ouvre la liste des Todos", async ({ page }) => {
  await openTodoList(page)
})

When('je recharge la page', async ({ page }) => {
  await page.reload()
  await expect(page.locator('#todo-list')).toHaveAttribute('aria-busy', 'false')
})

Then(/^la page s'intitule « (.+) »$/, async ({ page }, title: string) => {
  await expect(
    page.getByRole('heading', { level: 1, name: title, exact: true }),
  ).toBeVisible()
  await expect(page).toHaveTitle(`Zapper Todo | ${title}`)
})

// Creation form

Then(
  /^un champ « (.+) » est affiché avec le texte indicatif « (.+) »$/,
  async ({ page }, label: string, placeholder: string) => {
    const field = page.getByRole('textbox', { name: label, exact: true })
    await expect(field).toBeVisible()
    await expect(field).toHaveAttribute('placeholder', placeholder)
  },
)

Then(/^un bouton « (.+) » est affiché$/, async ({ page }, label: string) => {
  await expect(
    page.getByRole('button', { name: label, exact: true }),
  ).toBeVisible()
})

When(
  /^je crée un Todo avec un titre de (\d+) caractères$/,
  async ({ page }, length: string) => {
    await submitNewTodo(page, 'a'.repeat(Number(length)))
  },
)

When(
  /^je crée un Todo avec un titre de (\d+) caractères entouré d'espaces$/,
  async ({ page }, length: string) => {
    await submitNewTodo(page, `   ${'b'.repeat(Number(length))}   `)
  },
)

When(
  /^je crée un Todo avec le titre « (.*) »$/,
  async ({ page }, title: string) => {
    await createTodoThroughForm(page, title)
  },
)

When('je crée un Todo avec un titre vide', async ({ page }) => {
  await submitNewTodo(page, '')
})

When(
  "je crée un Todo avec un titre composé uniquement d'espaces",
  async ({ page }) => {
    await submitNewTodo(page, '     ')
  },
)

When(
  /^je saisis le titre « (.+) » et que je valide avec (le bouton « Ajouter »|la touche Entrée)$/,
  async ({ page }, title: string, action: string) => {
    pageState(page).lastTitle = title
    const created = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/api/todos'),
    )
    await createTitleField(page).fill(title)
    if (action === 'la touche Entrée') {
      await createTitleField(page).press('Enter')
    } else {
      await page.getByRole('button', { name: 'Ajouter', exact: true }).click()
    }
    expect((await created).status()).toBe(201)
  },
)

Given(
  /^la création d'un Todo avec un titre vide a affiché le message « (.+) »$/,
  async ({ page }, message: string) => {
    await submitNewTodo(page, '')
    await expect(page.getByRole('alert')).toHaveText(message)
  },
)

Then('le Todo est ajouté à la liste', async ({ page, request, apiUrl }) => {
  const title = pageState(page).lastTitle!.trim()
  await expect(rowsByTitle(page, title)).toHaveCount(1)
  expect((await readTodos(request, apiUrl)).map((todo) => todo.title)).toEqual([
    title,
  ])
})

Then('la création est refusée', async ({ page }) => {
  await expect(createTitleField(page)).toHaveAttribute('aria-invalid', 'true')
})

Then("un message d'erreur s'affiche sous le champ", async ({ page }) => {
  const field = createTitleField(page)
  const describedBy = await field.getAttribute('aria-describedby')
  expect(describedBy, 'the field is not linked to its message').toBeTruthy()
  const message = page.locator(`[id="${describedBy}"]`)
  await expect(message).toHaveAttribute('role', 'alert')
  await expect(message).not.toBeEmpty()
})

Then(
  /^le message « (.+) » s'affiche sous le champ$/,
  async ({ page }, text: string) => {
    const describedBy =
      await createTitleField(page).getAttribute('aria-describedby')
    const message = page.locator(`[id="${describedBy}"]`)
    await expect(message).toHaveAttribute('role', 'alert')
    await expect(message).toHaveText(text)
  },
)

Then("aucun Todo n'est ajouté", async ({ page, request, apiUrl }) => {
  await expect(todoRows(page)).toHaveCount(0)
  expect(await countTodos(request, apiUrl)).toBe(0)
})

Then(
  /^un Todo « (.+) » est enregistré avec un nouvel Id interne unique$/,
  async ({ page, request, apiUrl }, title: string) => {
    const matching = (await readTodos(request, apiUrl)).filter(
      (todo) => todo.title === title,
    )
    expect(matching).toHaveLength(1)
    expect(matching[0].id).toMatch(guidPattern)
    await expect(rowByTitle(page, title)).toHaveAttribute(
      'data-todo-id',
      matching[0].id,
    )
    pageState(page).targetId = matching[0].id
  },
)

Then('son état « fait » est faux', async ({ page, request, apiUrl }) => {
  const id = pageState(page).targetId
  const todo = (await readTodos(request, apiUrl)).find((item) => item.id === id)
  expect(todo?.isDone).toBe(false)
  await expect(
    rowByTitle(page, todo!.title).getByRole('checkbox'),
  ).not.toBeChecked()
})

Then(
  /^un Todo « (.+) » est enregistré$/,
  async ({ request, apiUrl }, title: string) => {
    expect(
      (await readTodos(request, apiUrl)).filter((todo) => todo.title === title),
    ).toHaveLength(1)
  },
)

Then(/^le champ « (.+) » est vide$/, async ({ page }, label: string) => {
  await expect(
    page.getByRole('textbox', { name: label, exact: true }),
  ).toHaveValue('')
})

Then("aucun message d'erreur n'est affiché", async ({ page }) => {
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(createTitleField(page)).not.toHaveAttribute(
    'aria-invalid',
    'true',
  )
})

Then(
  /^deux Todos « (.+) » existent$/,
  async ({ page, request, apiUrl }, title: string) => {
    const matching = (await readTodos(request, apiUrl)).filter(
      (todo) => todo.title === title,
    )
    expect(matching).toHaveLength(2)
    await expect(rowsByTitle(page, title)).toHaveCount(2)
  },
)

Then('leurs Id sont différents', async ({ page, request, apiUrl }) => {
  const title = pageState(page).lastTitle!.trim()
  const apiIds = (await readTodos(request, apiUrl))
    .filter((todo) => todo.title === title)
    .map((todo) => todo.id)
  expect(new Set(apiIds).size).toBe(2)
  const rowIds = await rowsByTitle(page, title).evaluateAll((rows) =>
    rows.map((row) => row.getAttribute('data-todo-id')),
  )
  expect([...rowIds].sort()).toEqual([...apiIds].sort())
})

// List

Then(
  /^le Todo « (.+) » apparaît dans la liste$/,
  async ({ page }, title: string) => {
    await expect(rowByTitle(page, title)).toBeVisible()
  },
)

Then(
  'la liste affiche, dans cet ordre :',
  async ({ page }, table: DataTable) => {
    const expected = table.hashes()
    await expect(todoRows(page)).toHaveCount(expected.length)
    for (const [index, row] of expected.entries()) {
      const line = todoRows(page).nth(index)
      await expect(titleOf(line)).toHaveText(row['titre'])
      const checkbox = line.getByRole('checkbox', { name: /Fait/ })
      if (row['case « fait »'] === 'cochée') {
        await expect(checkbox).toBeChecked()
      } else {
        await expect(checkbox).not.toBeChecked()
      }
    }
  },
)

Then(
  /^le titre « (.+) » est barré et grisé$/,
  async ({ page }, title: string) => {
    await expect
      .poll(async () => (await titleStyle(page, title)).decoration)
      .toContain('line-through')
    expect(greyLevel((await titleStyle(page, title)).color)).toBeGreaterThan(60)
  },
)

Then(
  /^le titre « (.+) » n'est ni barré ni grisé$/,
  async ({ page }, title: string) => {
    await expect
      .poll(async () => (await titleStyle(page, title)).decoration)
      .not.toContain('line-through')
    expect(greyLevel((await titleStyle(page, title)).color)).toBeLessThan(60)
  },
)

Then(/^le message « (.+) » s'affiche$/, async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: true })).toBeVisible()
})

Then(
  /^le message « (.+) » n'est plus affiché$/,
  async ({ page }, text: string) => {
    await expect(page.getByText(text, { exact: true })).toHaveCount(0)
  },
)

Then(
  /^la liste affiche deux lignes « (.+) »$/,
  async ({ page }, title: string) => {
    await expect(rowsByTitle(page, title)).toHaveCount(2)
    const rowIds = await rowsByTitle(page, title).evaluateAll((rows) =>
      rows.map((row) => row.getAttribute('data-todo-id')),
    )
    expect(new Set(rowIds).size).toBe(2)
  },
)

// Performance

Then('la liste est utilisable en moins de 2 secondes', async ({ page }) => {
  const state = pageState(page)
  await expect(todoRows(page).first()).toBeVisible()
  const elapsed = state.firstLoadEndedAt! - state.navigationStartedAt!
  expect(elapsed, `first row after ${elapsed} ms`).toBeLessThan(2_000)
})

Then(
  'seule la première page de Todos et le nombre total de Todos sont chargés depuis le serveur',
  async ({ page }) => {
    const responses = pageState(page).listResponses
    expect(responses).toHaveLength(1)
    const pageSize = Number(
      new URL(responses[0].url()).searchParams.get('pageSize'),
    )
    expect(pageSize).toBeGreaterThan(0)
    expect(pageSize).toBeLessThanOrEqual(100)
    const body = (await responses[0].json()) as {
      items: unknown[]
      totalCount: number
    }
    expect(body.items).toHaveLength(pageSize)
    expect(body.totalCount).toBe(100_000)
    await expect(todoRows(page)).toHaveCount(pageSize)
  },
)

// Security

Given("un visiteur qui ne s'est jamais connecté", async ({ context }) => {
  await context.clearCookies()
  expect(await context.storageState()).toMatchObject({ cookies: [] })
})

Then(/^la page « (.+) » est affichée$/, async ({ page }, title: string) => {
  await expect(
    page.getByRole('heading', { level: 1, name: title, exact: true }),
  ).toBeVisible()
})

Then("aucune connexion n'est demandée", async ({ page, baseURL }) => {
  expect(new URL(page.url()).pathname).toBe('/')
  expect(page.url().startsWith(baseURL!)).toBe(true)
  await expect(page.locator('input[type="password"]')).toHaveCount(0)
  expect(pageState(page).listResponses.map((r) => r.status())).toEqual([200])
})

Then(
  /^la liste affiche littéralement le titre « (.+) »$/,
  async ({ page }, title: string) => {
    await expect(titleOf(rowByTitle(page, title))).toHaveText(title)
  },
)

Then("aucune partie du titre n'est mise en forme", async ({ page }) => {
  const title = pageState(page).lastTitle!
  await expect(titleOf(rowByTitle(page, title)).locator('*')).toHaveCount(0)
})

Then("aucun script du titre n'est exécuté", async ({ page }) => {
  const title = pageState(page).lastTitle!
  await expect(titleOf(rowByTitle(page, title)).locator('*')).toHaveCount(0)
  await expect(page.locator('[data-todo-id] img')).toHaveCount(0)
  expect(pageState(page).dialogs).toEqual([])
})
