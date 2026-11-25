import { expect, type Page } from '@playwright/test'
import { Given, Then, When } from '../fixtures.ts'
import { createTodo, readTodos } from './todo-api.ts'
import {
  openTodoList,
  pageState,
  rowById,
  rowByTitle,
  titleOf,
} from './todo-page.ts'

const editFieldName = /^(Modifier le titre|Edit title)$/

const targetRow = (page: Page) => {
  const id = pageState(page).targetId
  expect(id, 'no Todo was targeted by a previous step').toBeTruthy()
  return rowById(page, id!)
}

const editField = (page: Page) =>
  targetRow(page).getByRole('textbox', { name: editFieldName })

const isUpdate = (page: Page, method: string, url: string) =>
  method === 'PUT' &&
  new URL(url).pathname.endsWith(`/api/todos/${pageState(page).targetId}`)

/** Title phrases of the scenarios: « quoted » (spaces kept), empty, blank or of N characters. */
function titleFromPhrase(phrase: string) {
  const quoted = /^« (.*) »$/.exec(phrase)
  if (quoted) return quoted[1]
  if (phrase === 'un titre vide') return ''
  if (phrase === "un titre composé uniquement d'espaces") return '     '
  const sized = /^un titre de (\d+) caractères$/.exec(phrase)
  if (sized) return 'm'.repeat(Number(sized[1]))
  throw new Error(`Unknown title phrase: ${phrase}`)
}

async function openEditMode(page: Page, title: string, how = 'button') {
  const row = rowByTitle(page, title)
  pageState(page).targetId = (await row.getAttribute('data-todo-id'))!
  if (how === 'double-click') {
    await titleOf(row).dblclick()
  } else {
    await row.getByRole('button', { name: /^(Modifier|Edit)$/ }).click()
  }
  await expect(editField(page)).toBeFocused()
}

async function replaceTitle(page: Page, phrase: string) {
  const title = titleFromPhrase(phrase)
  pageState(page).lastTitle = title
  await editField(page).fill(title)
}

/** Saves, then waits for the outcome: editor closed (PUT confirmed) or the field in error. */
async function saveEdit(page: Page, withEnter = false) {
  if (withEnter) {
    await editField(page).press('Enter')
  } else {
    await targetRow(page)
      .getByRole('button', { name: /^(Enregistrer|Save)$/ })
      .click()
  }
  await expect
    .poll(async () => {
      // One non-waiting read: the editor may close between two separate calls.
      const invalid = await editField(page).evaluateAll((fields) =>
        fields.map((field) => field.getAttribute('aria-invalid')),
      )
      if (invalid.length === 0) return 'closed'
      return invalid[0] === 'true' ? 'refused' : 'pending'
    })
    .not.toBe('pending')
}

async function storedTodo(
  page: Page,
  request: Parameters<typeof readTodos>[0],
  apiUrl: string,
) {
  const id = pageState(page).targetId
  return (await readTodos(request, apiUrl)).find((todo) => todo.id === id)
}

// Edit mode

When(
  /^(je clique sur le bouton « Modifier »|je double-clique sur le titre) du Todo « (.+) »$/,
  async ({ page }, action: string, title: string) => {
    await openEditMode(
      page,
      title,
      action.includes('double-clique') ? 'double-click' : 'button',
    )
  },
)

Given(
  /^le Todo « (.+) » est en mode édition$/,
  async ({ page, request, apiUrl }, title: string) => {
    await createTodo(request, apiUrl, title)
    await openTodoList(page)
    await openEditMode(page, title)
  },
)

Then(
  /^le titre est remplacé par un champ « (.+) » prérempli avec « (.+) »$/,
  async ({ page }, label: string, title: string) => {
    const field = targetRow(page).getByRole('textbox', {
      name: label,
      exact: true,
    })
    await expect(field).toBeVisible()
    await expect(field).toHaveValue(title)
    await expect(field).toBeFocused()
    await expect(titleOf(targetRow(page))).toHaveCount(0)
  },
)

Then(
  /^les boutons « (.+) » et « (.+) » sont affichés$/,
  async ({ page }, first: string, second: string) => {
    for (const name of [first, second]) {
      await expect(
        targetRow(page).getByRole('button', { name, exact: true }),
      ).toBeVisible()
    }
  },
)

When(
  /^je remplace le titre par (.+) et que je valide avec (le bouton « Enregistrer »|la touche Entrée)$/,
  async ({ page }, phrase: string, action: string) => {
    await replaceTitle(page, phrase)
    await saveEdit(page, action === 'la touche Entrée')
  },
)

When(
  /^je remplace le titre par (.+) et que j'enregistre$/,
  async ({ page }, phrase: string) => {
    await replaceTitle(page, phrase)
    await saveEdit(page)
  },
)

Given(
  /^j'ai remplacé le titre par (.+) sans enregistrer$/,
  async ({ page }, phrase: string) => {
    await replaceTitle(page, phrase)
  },
)

When(
  /^j'annule avec (le bouton « Annuler »|la touche Échap)$/,
  async ({ page }, action: string) => {
    const sent = pageState(page).updateRequests
    if (action === 'la touche Échap') {
      await editField(page).press('Escape')
    } else {
      await targetRow(page)
        .getByRole('button', { name: /^(Annuler|Cancel)$/ })
        .click()
    }
    await expect(editField(page)).toHaveCount(0)
    expect(pageState(page).updateRequests, 'cancel sent a PUT').toBe(sent)
  },
)

Then('le mode édition est fermé', async ({ page }) => {
  await expect(editField(page)).toHaveCount(0)
  await expect(titleOf(targetRow(page))).toBeVisible()
  await expect(
    targetRow(page).getByRole('button', { name: /^(Modifier|Edit)$/ }),
  ).toBeFocused()
})

Then(
  /^le Todo affiche le titre « (.+) »$/,
  async ({ page, request, apiUrl }, title: string) => {
    await expect(titleOf(targetRow(page))).toHaveText(title)
    expect((await storedTodo(page, request, apiUrl))?.title).toBe(
      (await titleOf(targetRow(page)).textContent())!,
    )
  },
)

Then(
  'le Todo affiche le nouveau titre de 200 caractères',
  async ({ page, request, apiUrl }) => {
    const title = pageState(page).lastTitle!
    expect(title).toHaveLength(200)
    await expect(titleOf(targetRow(page))).toHaveText(title)
    expect((await storedTodo(page, request, apiUrl))?.title).toBe(title)
  },
)

Then('son Id est inchangé', async ({ page, request, apiUrl }) => {
  await expect(targetRow(page)).toHaveCount(1)
  const todos = await readTodos(request, apiUrl)
  expect(todos.map((todo) => todo.id)).toEqual([pageState(page).targetId])
})

Then('la modification est refusée', async ({ page }) => {
  await expect(editField(page)).toBeVisible()
  await expect(editField(page)).toHaveAttribute('aria-invalid', 'true')
  await expect(editField(page)).toHaveValue(pageState(page).lastTitle!)
})

Then("un message d'erreur s'affiche dans le champ", async ({ page }) => {
  const describedBy = await editField(page).getAttribute('aria-describedby')
  expect(describedBy, 'the field is not linked to its message').toBeTruthy()
  const message = page.locator(`[id="${describedBy}"]`)
  await expect(message).toHaveAttribute('role', 'alert')
  await expect(message).toHaveText(
    /^(Le titre est obligatoire\.|Le titre ne peut pas dépasser 200 caractères\.)$/,
  )
})

Then(
  /^le titre enregistré du Todo reste « (.+) »$/,
  async ({ page, request, apiUrl }, title: string) => {
    expect((await storedTodo(page, request, apiUrl))?.title).toBe(title)
  },
)

// Done checkbox

const doneCheckbox = (page: Page, title: string) =>
  rowByTitle(page, title).getByRole('checkbox', { name: /Fait|Done/ })

Then(
  /^la case « Fait » du Todo « (.+) » (est cochée|n'est pas cochée)$/,
  async ({ page }, title: string, state: string) => {
    if (state === 'est cochée') {
      await expect(doneCheckbox(page, title)).toBeChecked()
    } else {
      await expect(doneCheckbox(page, title)).not.toBeChecked()
    }
  },
)

When(
  /^je (coche|décoche) le Todo « (.+) »$/,
  async ({ page }, action: string, title: string) => {
    const checkbox = doneCheckbox(page, title)
    pageState(page).targetId = (await rowByTitle(page, title).getAttribute(
      'data-todo-id',
    ))!
    pageState(page).lastTitle = title
    const updated = page.waitForResponse((response) =>
      isUpdate(page, response.request().method(), response.url()),
    )
    await checkbox.click()
    expect((await updated).status()).toBe(200)
    if (action === 'coche') {
      await expect(checkbox).toBeChecked()
    } else {
      await expect(checkbox).not.toBeChecked()
    }
    await expect(checkbox).toBeEnabled()
  },
)

Then(
  /^l'état « fait » du Todo « (.+) » est (?:toujours )?(vrai|faux)$/,
  async ({ request, apiUrl }, title: string, value: string) => {
    const matching = (await readTodos(request, apiUrl)).filter(
      (todo) => todo.title === title,
    )
    expect(matching).toHaveLength(1)
    expect(matching[0].isDone).toBe(value === 'vrai')
  },
)

Then(
  /^le Todo (?:coché|décoché) garde le titre « (.+) » et le même Id$/,
  async ({ page, request, apiUrl }, title: string) => {
    const todo = await storedTodo(page, request, apiUrl)
    expect(todo, 'the toggled Todo is gone').toBeDefined()
    expect(todo!.title).toBe(title)
    await expect(rowByTitle(page, title)).toHaveAttribute(
      'data-todo-id',
      pageState(page).targetId!,
    )
  },
)
