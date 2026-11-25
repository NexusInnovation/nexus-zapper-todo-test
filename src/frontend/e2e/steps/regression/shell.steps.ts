import { expect, type Page } from '@playwright/test'
import { Given, Then, When } from '../fixtures.ts'

const languageSwitcher = (page: Page) =>
  page.getByRole('button', {
    name: /^(Change language|Changer de langue) ?: (EN|FR)$/,
  })

// Navigates inside the running single-page app so the chosen language is kept;
// a full reload would fall back to the default language.
async function openInApp(page: Page, path: string) {
  if (page.url().startsWith('http')) {
    await page.evaluate(
      `history.pushState({}, '', ${JSON.stringify(path)}); dispatchEvent(new PopStateEvent('popstate'))`,
    )
  } else {
    await page.goto(path)
  }
}

async function chooseLanguage(page: Page, label: 'English' | 'Français') {
  await languageSwitcher(page).click()
  await page.getByRole('menuitem', { name: label }).click()
  await expect(languageSwitcher(page)).toHaveText(
    label === 'English' ? 'en' : 'fr',
  )
}

Given("l'interface est affichée en anglais", async ({ page }) => {
  await page.goto('/')
  await expect(languageSwitcher(page)).toBeVisible()
  if ((await languageSwitcher(page).textContent())?.trim() !== 'en') {
    await chooseLanguage(page, 'English')
  }
})

Given(
  'je choisis le français dans le sélecteur de langue',
  async ({ page }) => {
    await chooseLanguage(page, 'Français')
  },
)

When("je choisis l'anglais dans le sélecteur de langue", async ({ page }) => {
  await chooseLanguage(page, 'English')
})

Given('je suis sur la page introuvable', async ({ page }) => {
  await openInApp(page, '/404')
  await expect(
    page.getByRole('heading', { level: 1, name: '404' }),
  ).toBeVisible()
})

When("j'ouvre une adresse inconnue de l'application", async ({ page }) => {
  await openInApp(page, '/zapper-regression-adresse-inconnue')
})

Then(
  /^la page « (.+) » s'affiche avec le message « (.+) »$/,
  async ({ page }, title: string, message: string) => {
    await expect(page).toHaveURL(/\/404$/)
    await expect(
      page.getByRole('heading', { level: 1, name: title }),
    ).toBeVisible()
    await expect(page.getByText(message, { exact: true })).toBeVisible()
  },
)

Then(
  /^la page introuvable affiche le message « (.+) »$/,
  async ({ page }, message: string) => {
    await expect(page.getByText(message, { exact: true })).toBeVisible()
  },
)

Then(
  /^l'onglet du navigateur s'intitule « (.+) »$/,
  async ({ page }, title: string) => {
    await expect(page).toHaveTitle(title)
  },
)

When(
  "j'ouvre la page de vérification de disponibilité de l'application",
  async ({ page }) => {
    await openInApp(page, '/healthcheck')
  },
)

Then(/^la page affiche « (.+) »$/, async ({ page }, text: string) => {
  await expect(
    page.getByRole('main').getByText(text, { exact: true }),
  ).toBeVisible()
})

Given("l'écran est étroit", async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 900 })
})

When("j'ouvre le menu de navigation", async ({ page }) => {
  await page.getByRole('button', { name: 'Open navigation menu' }).click()
})

Then("la navigation principale s'affiche", async ({ page }) => {
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }),
  ).toBeVisible()
})

When("j'ouvre le sélecteur de langue", async ({ page }) => {
  await languageSwitcher(page).click()
})

Then(
  /^le sélecteur propose « (.+) » et « (.+) »$/,
  async ({ page }, first: string, second: string) => {
    await expect(page.getByRole('menuitem')).toHaveText([first, second])
  },
)
