import { defineConfig, devices } from '@playwright/test'
import type { TestOptions } from './e2e/steps/fixtures.ts'
import { cucumberReporter, defineBddConfig } from 'playwright-bdd'
import {
  regressionApiUrl,
  regressionFrontendPort as frontendPort,
  regressionFrontendUrl,
} from './e2e/steps/regression/servers.ts'

// Regression baseline (Zapper): scenarios read in place from .zapper/regression-baseline/areas,
// glue shared with the BDD suite under e2e/steps. Run through `pnpm regression`.

const testDir = defineBddConfig({
  features: '../../.zapper/regression-baseline/areas/**/*.feature',
  featuresRoot: '../../.zapper/regression-baseline/areas',
  steps: 'e2e/steps/**/*.ts',
  outputDir: '.features-gen-regression',
  language: 'fr',
  tags: '@regression',
  missingSteps: 'fail-on-run',
})

export default defineConfig<TestOptions>({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [
    ['list'],
    cucumberReporter('json', {
      outputFile:
        '../../.zapper/regression-baseline/results/raw/regression-scenarios.json',
    }),
  ],
  use: {
    baseURL: regressionFrontendUrl,
    apiUrl: regressionApiUrl,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: `pnpm exec vite --host 127.0.0.1 --port ${frontendPort} --strictPort`,
      url: regressionFrontendUrl,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `dotnet run --project ../backend/Nexus.ZapperTodo.Api --no-launch-profile --urls ${regressionApiUrl}`,
      url: `${regressionApiUrl}/api/health`,
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
        Cors__AllowedOrigins__0: regressionFrontendUrl,
      },
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
