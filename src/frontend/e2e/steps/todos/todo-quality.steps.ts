/// <reference lib="dom" />
import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Given, Then, When, wireRuntimeConfig } from '../fixtures.ts'
import { readTodos } from './todo-api.ts'
import {
  createTitleField,
  openTodoList,
  pageState,
  rowById,
  rowByTitle,
  titleOf,
  todoRows,
} from './todo-page.ts'

type Messages = { [key: string]: string | Messages }

const localesDir = path.resolve(import.meta.dirname, '../../../public/locales')
const readLocale = (language: string, namespace: string) =>
  JSON.parse(
    readFileSync(path.join(localesDir, language, `${namespace}.json`), 'utf8'),
  ) as Messages

const en = {
  todos: readLocale('en', 'todos'),
  common: readLocale('en', 'common'),
}
const fr = {
  todos: readLocale('fr', 'todos'),
  common: readLocale('fr', 'common'),
}

const message = (messages: Messages, key: string) =>
  key
    .split('.')
    .reduce<string | Messages>(
      (node, part) => (node as Messages)[part],
      messages,
    ) as string

function leaves(messages: Messages, prefix = ''): [string, string][] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [[`${prefix}${key}`, value] as [string, string]]
      : leaves(value, `${prefix}${key}.`),
  )
}

/** French texts of the page that differ from their English value, as anchored patterns. */
function frenchOnlyPatterns() {
  const patterns: { key: string; pattern: RegExp }[] = []
  for (const namespace of ['todos', 'common'] as const) {
    const english = new Map(leaves(en[namespace]))
    for (const [key, value] of leaves(fr[namespace])) {
      if (value === english.get(key)) continue
      const source = value
        .split(/\{\{[^}]+\}\}/)
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('.+')
      patterns.push({
        key: `${namespace}:${key}`,
        pattern: new RegExp(`^${source}$`),
      })
    }
  }
  return patterns
}

/** Visible text lines, accessible names, placeholders and tab title of the page. */
async function pageTexts(page: Page) {
  return page.evaluate(() => {
    const texts = document.body.innerText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    for (const element of document.querySelectorAll(
      '[aria-label], [placeholder], [title], label',
    )) {
      for (const attribute of ['aria-label', 'placeholder', 'title']) {
        const value = element.getAttribute(attribute)
        if (value) texts.push(value.trim())
      }
    }
    texts.push(document.title)
    return texts
  })
}

const isUpdateOrDelete = (method: string, url: string) =>
  ['PUT', 'DELETE'].includes(method) &&
  new URL(url).pathname.includes('/api/todos/')

const focusedDescription = (page: Page) =>
  page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null
    return {
      tag: element?.tagName ?? '',
      id: element?.id ?? '',
      name:
        element?.getAttribute('aria-label') ??
        element?.textContent?.trim() ??
        '',
      type: element?.getAttribute('type') ?? '',
      rowId: element?.closest('[data-todo-id]')?.getAttribute('data-todo-id'),
    }
  })

/** Presses Tab until the focused control matches, within a bounded number of presses. */
async function tabTo(
  page: Page,
  matches: (focused: Awaited<ReturnType<typeof focusedDescription>>) => boolean,
  label: string,
) {
  for (let presses = 0; presses < 40; presses++) {
    if (matches(await focusedDescription(page))) return
    await page.keyboard.press('Tab')
  }
  throw new Error(`Tab never reached ${label}`)
}

// Labels

When(
  /^j'ouvre le mode édition du Todo « (.+) »$/,
  async ({ page }, title: string) => {
    const row = rowByTitle(page, title)
    pageState(page).targetId = (await row.getAttribute('data-todo-id'))!
    await row.getByRole('button', { name: /^(Modifier|Edit)$/ }).click()
    await expect(
      rowById(page, pageState(page).targetId!).getByRole('textbox'),
    ).toBeFocused()
  },
)

Then(
  /^le champ « (.+) » a un nom accessible$/,
  async ({ page }, label: string) => {
    const field = page.getByRole('textbox', { name: label, exact: true })
    await expect(field).toBeVisible()
    await expect(field).toHaveAccessibleName(label)
  },
)

Then('la case « Fait » a un nom accessible', async ({ page }) => {
  const checkboxes = todoRows(page).getByRole('checkbox')
  await expect(checkboxes).not.toHaveCount(0)
  for (const checkbox of await checkboxes.all()) {
    await expect(checkbox).toHaveAccessibleName(/^Fait : .+/)
  }
})

// Keyboard journey

type JourneyLog = {
  created?: boolean
  createdWithEnter?: boolean
  checked?: boolean
  escapeCancelled?: boolean
  savedWithEnter?: boolean
  deleted?: boolean
  focusLostAfter: string[]
}

const journeys = new WeakMap<Page, JourneyLog>()

async function focusIsNotBody(page: Page) {
  return page.evaluate(
    () =>
      document.activeElement !== null &&
      document.activeElement !== document.body,
  )
}

When(
  'je crée, coche, modifie puis supprime un Todo en utilisant uniquement le clavier',
  async ({ page, request, apiUrl }) => {
    const log: JourneyLog = { focusLostAfter: [] }
    journeys.set(page, log)
    const track = async (action: string) => {
      if (!(await focusIsNotBody(page))) log.focusLostAfter.push(action)
    }
    const title = 'Acheter du lait'

    // Create: type in the creation field, validate with Enter.
    await tabTo(
      page,
      (focused) => focused.id === 'todo-create-title',
      'the creation field',
    )
    await page.keyboard.type(title)
    const created = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/api/todos'),
    )
    await page.keyboard.press('Enter')
    log.createdWithEnter = (await created).status() === 201
    await expect(rowByTitle(page, title)).toBeVisible()
    const id = (await readTodos(request, apiUrl))[0]?.id
    log.created = id !== undefined
    pageState(page).targetId = id
    await track('create')

    // Check: Tab to the row checkbox, Space.
    await tabTo(
      page,
      (focused) => focused.rowId === id && focused.type === 'checkbox',
      'the « Fait » checkbox',
    )
    const toggled = page.waitForResponse((response) =>
      isUpdateOrDelete(response.request().method(), response.url()),
    )
    await page.keyboard.press('Space')
    expect((await toggled).status()).toBe(200)
    await expect(rowById(page, id!).getByRole('checkbox')).toBeChecked()
    log.checked = (await readTodos(request, apiUrl))[0]?.isDone === true
    await track('check')

    // Edit then cancel with Escape.
    await tabTo(
      page,
      (focused) =>
        focused.rowId === id && /^(Modifier|Edit)$/.test(focused.name),
      'the « Modifier » button',
    )
    const sentBefore = pageState(page).updateRequests
    await page.keyboard.press('Enter')
    const field = rowById(page, id!).getByRole('textbox')
    await expect(field).toBeFocused()
    await page.keyboard.type(' bio')
    await page.keyboard.press('Escape')
    await expect(field).toHaveCount(0)
    await expect(titleOf(rowById(page, id!))).toHaveText(title)
    log.escapeCancelled =
      pageState(page).updateRequests === sentBefore &&
      (await readTodos(request, apiUrl))[0]?.title === title
    await track('escape')

    // Edit then save with Enter (focus is back on « Modifier »).
    await page.keyboard.press('Enter')
    await expect(field).toBeFocused()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.type('Acheter du pain')
    const saved = page.waitForResponse((response) =>
      isUpdateOrDelete(response.request().method(), response.url()),
    )
    await page.keyboard.press('Enter')
    expect((await saved).status()).toBe(200)
    await expect(titleOf(rowById(page, id!))).toHaveText('Acheter du pain')
    log.savedWithEnter =
      (await readTodos(request, apiUrl))[0]?.title === 'Acheter du pain'
    await track('save')

    // Delete: Tab to « Supprimer », Enter, confirm with Enter (initial focus of the dialog).
    await tabTo(
      page,
      (focused) =>
        focused.rowId === id && /^(Supprimer|Delete) /.test(focused.name),
      'the « Supprimer » button',
    )
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    const deleted = page.waitForResponse((response) =>
      isUpdateOrDelete(response.request().method(), response.url()),
    )
    await page.keyboard.press('Enter')
    expect((await deleted).status()).toBe(204)
    await expect(rowById(page, id!)).toHaveCount(0)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect.poll(() => focusIsNotBody(page)).toBe(true)
    log.deleted = (await readTodos(request, apiUrl)).length === 0
    await track('delete')
  },
)

const journeyOf = (page: Page) => {
  const log = journeys.get(page)
  expect(log, 'the keyboard journey did not run').toBeDefined()
  return log!
}

Then('chaque action aboutit sans utiliser la souris', async ({ page }) => {
  const log = journeyOf(page)
  expect(log).toMatchObject({
    created: true,
    checked: true,
    savedWithEnter: true,
    deleted: true,
    focusLostAfter: [],
  })
})

Then('la touche Entrée valide la saisie', async ({ page }) => {
  const log = journeyOf(page)
  expect(log.createdWithEnter).toBe(true)
  expect(log.savedWithEnter).toBe(true)
})

Then('la touche Échap annule la modification du titre', async ({ page }) => {
  expect(journeyOf(page).escapeCancelled).toBe(true)
})

// Visible focus

type FocusStop = {
  control: string
  outline: string
  outlineWidth: number
  after: string
}
const focusStops = new WeakMap<Page, FocusStop[]>()

/** Focus ring of the focused control, or of its MUI root when the native input is hidden. */
const focusRingOf = (page: Page) =>
  page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null
    if (!active || active === document.body) return null
    const view = active.ownerDocument.defaultView!
    const ringHost =
      view.getComputedStyle(active).opacity === '0' && active.parentElement
        ? active.parentElement
        : active
    const style = view.getComputedStyle(ringHost)
    if (!ringHost.hasAttribute('data-focus-probe'))
      ringHost.setAttribute(
        'data-focus-probe',
        String(document.querySelectorAll('[data-focus-probe]').length),
      )
    return {
      control:
        active.getAttribute('aria-label') ||
        active.id ||
        active.textContent?.trim() ||
        active.tagName,
      outline: style.outlineStyle,
      outlineWidth: parseFloat(style.outlineWidth),
    }
  })

When(
  'je parcours les contrôles de la page avec la touche Tab',
  async ({ page }) => {
    const stops: FocusStop[] = []
    focusStops.set(page, stops)
    for (let presses = 0; presses < 40; presses++) {
      await page.keyboard.press('Tab')
      const ring = await focusRingOf(page)
      if (!ring) break
      if (stops.some((stop) => stop.control === ring.control)) break
      stops.push({ ...ring, after: '' })
    }
    // Ring absent without focus: blur and read every probed control again.
    await page.evaluate(() =>
      (document.activeElement as HTMLElement | null)?.blur(),
    )
    const without = await page
      .locator('[data-focus-probe]')
      .evaluateAll((hosts) =>
        hosts.map((host) => ({
          index: Number(host.getAttribute('data-focus-probe')),
          outline:
            host.ownerDocument.defaultView!.getComputedStyle(host).outlineStyle,
        })),
      )
    stops.forEach(
      (stop, index) =>
        (stop.after =
          without.find((probe) => probe.index === index)?.outline ?? 'none'),
    )
  },
)

Then(
  'chaque contrôle qui reçoit le focus affiche un indicateur de focus visible',
  async ({ page }) => {
    const stops = focusStops.get(page) ?? []
    const controls = stops.map((stop) => stop.control)
    expect(controls).toEqual(
      expect.arrayContaining([
        'todo-create-title',
        'Fait : Acheter du lait',
        'Supprimer Acheter du lait',
      ]),
    )
    for (const stop of stops) {
      expect(stop.outline, `no focus ring on ${stop.control}`).not.toBe('none')
      expect(
        stop.outlineWidth,
        `thin focus ring on ${stop.control}`,
      ).toBeGreaterThanOrEqual(2)
      expect(stop.after, `ring kept without focus on ${stop.control}`).toBe(
        'none',
      )
    }
  },
)

// Alerts

Then(
  /^le message « (.+) » est annoncé comme une alerte$/,
  async ({ page }, text: string) => {
    const alert = page.getByRole('alert')
    await expect(alert).toHaveText(text)
    const describedBy =
      await createTitleField(page).getAttribute('aria-describedby')
    expect(describedBy?.split(' ')).toContain(await alert.getAttribute('id'))
  },
)

// Automated WCAG 2.1 AA scan

async function axeViolations(page: Page) {
  // Contrast is only meaningful once the MUI fade/grow transitions are over.
  await page.evaluate(() =>
    Promise.allSettled(
      document.getAnimations().map((animation) => animation.finished),
    ),
  )
  await expect
    .poll(() =>
      page.evaluate(() =>
        [
          ...document.querySelectorAll(
            '.MuiDialog-container, .MuiBackdrop-root',
          ),
        ].every((element) => getComputedStyle(element).opacity === '1'),
      ),
    )
    .toBe(true)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.map((node) => node.target.join(' ')),
  }))
}

Then(
  "l'analyse automatique d'accessibilité ne détecte aucune violation WCAG 2.1 AA",
  async ({ page, $testInfo }) => {
    await expect(page.locator('#todo-list')).toHaveAttribute(
      'aria-busy',
      'false',
    )
    const scans: Record<string, unknown> = { page: await axeViolations(page) }
    const row = todoRows(page).first()
    if ((await row.count()) > 0) {
      // Same scan in edit mode and with the delete dialog open.
      await row.getByRole('button', { name: /^(Modifier|Edit)$/ }).click()
      await expect(row.getByRole('textbox')).toBeFocused()
      scans.editMode = await axeViolations(page)
      await row.getByRole('textbox').press('Escape')
      await row.getByRole('button', { name: /^(Supprimer|Delete) / }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      scans.deleteDialog = await axeViolations(page)
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(0)
    }
    await $testInfo.attach('axe-wcag21aa', {
      body: JSON.stringify(scans, null, 2),
      contentType: 'application/json',
    })
    for (const [state, violations] of Object.entries(scans)) {
      expect(violations, `axe violations (${state})`).toEqual([])
    }
  },
)

// Localization

Given(
  'un visiteur sans préférence de langue enregistrée',
  async ({ page, context }) => {
    // An English browser: French must still be the default language (no navigator detection).
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', { get: () => 'en-US' })
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      })
    })
    expect((await context.storageState()).origins).toEqual([])
  },
)

Then('le bouton « Ajouter » est affiché', async ({ page }) => {
  await expect(
    page.getByRole('button', { name: 'Ajouter', exact: true }),
  ).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
})

Then(
  'les libellés et messages de la liste des Todos sont affichés en anglais',
  async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: message(en.todos, 'list.title'),
        exact: true,
      }),
    ).toBeVisible()
    await expect(page).toHaveTitle(
      `Zapper Todo | ${message(en.todos, 'list.title')}`,
    )
    const field = page.getByRole('textbox', {
      name: message(en.todos, 'create.titleLabel'),
      exact: true,
    })
    await expect(field).toHaveAttribute(
      'placeholder',
      message(en.todos, 'create.titlePlaceholder'),
    )
    await expect(
      page.getByRole('button', {
        name: message(en.todos, 'create.submit'),
        exact: true,
      }),
    ).toBeVisible()
    await expect(
      page.getByText(message(en.todos, 'list.empty'), { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: message(en.common, 'navigation.todos') }),
    ).toBeVisible()
  },
)

Then(
  'aucun libellé de la liste des Todos ne reste en français',
  async ({ page }) => {
    const texts = await pageTexts(page)
    const leftovers = frenchOnlyPatterns().flatMap(({ key, pattern }) =>
      texts
        .filter((text) => pattern.test(text))
        .map((text) => `${key}: ${text}`),
    )
    expect(leftovers).toEqual([])
  },
)

Then("le message d'erreur est affiché en anglais", async ({ page }) => {
  await expect(page.getByRole('alert')).toHaveText(
    message(en.common, 'errors.todo.titleRequired'),
  )
})

// Server-side persistence between sessions

Given(
  /^j'ai créé le Todo « (.+) » et que je l'ai coché$/,
  async ({ browser, baseURL, apiUrl, page, request }, title: string) => {
    const secondary = await browser.newContext({ baseURL })
    await wireRuntimeConfig(secondary, apiUrl)
    const other = await secondary.newPage()
    await openTodoList(other)
    await createTitleField(other).fill(title)
    const created = other.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/api/todos'),
    )
    await other.getByRole('button', { name: 'Ajouter', exact: true }).click()
    expect((await created).status()).toBe(201)
    const [todo] = (await readTodos(request, apiUrl)).filter(
      (item) => item.title === title,
    )
    expect(todo, 'the created Todo is not stored').toBeDefined()
    const state = pageState(page)
    state.targetId = todo.id
    state.lastTitle = title
    const updated = other.waitForResponse((response) =>
      isUpdateOrDelete(response.request().method(), response.url()),
    )
    await rowById(other, todo.id).getByRole('checkbox').click()
    expect((await updated).status()).toBe(200)
    await secondary.close()
  },
)

When(
  "j'ouvre la liste des Todos dans une nouvelle session de navigateur, sans données locales",
  async ({ page, context }) => {
    expect((await context.storageState()).origins).toEqual([])
    await openTodoList(page)
    const stored = await page.evaluate(async () => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
      indexedDb: (await indexedDB.databases()).map((db) => db.name),
    }))
    expect(stored).toEqual({ local: [], session: [], indexedDb: [] })
  },
)

Then('sa case « Fait » est cochée', async ({ page }) => {
  await expect(
    rowById(page, pageState(page).targetId!).getByRole('checkbox'),
  ).toBeChecked()
})

Then(
  "son Id est le même qu'à sa création",
  async ({ page, request, apiUrl }) => {
    const { targetId, lastTitle } = pageState(page)
    await expect(rowByTitle(page, lastTitle!)).toHaveAttribute(
      'data-todo-id',
      targetId!,
    )
    const todos = await readTodos(request, apiUrl)
    expect(todos.map((todo) => todo.id)).toEqual([targetId])
    expect(todos[0].isDone).toBe(true)
  },
)
