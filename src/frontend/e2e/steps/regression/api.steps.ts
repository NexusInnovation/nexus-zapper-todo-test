import { expect, type APIResponse } from '@playwright/test'
import { Given, Then, When } from '../fixtures.ts'
import { regressionApiUrl } from './servers.ts'

const healthUrl = `${regressionApiUrl}/api/health`
const responses = new WeakMap<object, APIResponse>()

Given("l'API est démarrée", async ({ request }) => {
  await expect.poll(async () => (await request.get(healthUrl)).ok()).toBe(true)
})

When("on consulte le point de santé de l'API", async ({ request }) => {
  responses.set(request, await request.get(healthUrl))
})

Then(
  /^l'API répond avec succès « (.+) »$/,
  async ({ request }, body: string) => {
    const response = responses.get(request)
    expect(response, 'the health endpoint was not called').toBeDefined()
    expect(response!.status()).toBe(200)
    expect(await response!.text()).toBe(body)
  },
)
