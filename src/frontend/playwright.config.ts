import { defineConfig, devices } from '@playwright/test'
import { cucumberReporter, defineBddConfig } from 'playwright-bdd'

// BDD suite (Zapper): Gherkin features under e2e/features, glue under e2e/steps.
const testDir = defineBddConfig({
  features: 'e2e/features/**/*.feature',
  steps: 'e2e/steps/**/*.ts',
  outputDir: '.features-gen',
  language: 'fr',
  tags: 'not @manual',
  missingSteps: 'fail-on-run',
})

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [
    ['list'],
    cucumberReporter('json', {
      outputFile:
        '../../.zapper/behaviour-driven-development/results/cucumber.json',
    }),
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
