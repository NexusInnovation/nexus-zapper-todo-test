import { defineConfig, devices } from '@playwright/test'
import type { TestOptions } from './e2e/steps/fixtures.ts'
import { cucumberReporter, defineBddConfig } from 'playwright-bdd'
import {
  bddApiUrl,
  bddFrontendPort,
  bddFrontendUrl,
} from './e2e/steps/servers.ts'

// BDD suite (Zapper): Gherkin features under e2e/features, glue under e2e/steps.
const testDir = defineBddConfig({
  features: 'e2e/features/**/*.feature',
  steps: 'e2e/steps/**/*.ts',
  outputDir: '.features-gen',
  language: 'fr',
  tags: 'not @manual',
  missingSteps: 'fail-on-run',
})

// Every scenario shares the same database (dbo.Todo is reset before each one): one worker.
export default defineConfig<TestOptions>({
  testDir,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [
    ['list'],
    cucumberReporter('json', {
      outputFile:
        '../../.zapper/behaviour-driven-development/results/cucumber.json',
    }),
  ],
  use: {
    baseURL: bddFrontendUrl,
    apiUrl: bddApiUrl,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: `pnpm exec vite --host 127.0.0.1 --port ${bddFrontendPort} --strictPort`,
      url: bddFrontendUrl,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `dotnet run --project ../backend/Nexus.ZapperTodo.Api --no-launch-profile --urls ${bddApiUrl}`,
      url: `${bddApiUrl}/api/health`,
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
        Cors__AllowedOrigins__0: bddFrontendUrl,
      },
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
