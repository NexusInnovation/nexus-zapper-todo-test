import type { BrowserContext } from '@playwright/test'
import sql from 'mssql'
import { test as base, createBdd } from 'playwright-bdd'

export type SqlParameters = Record<string, unknown>

export type Database = {
  /** Runs a parameterized SQL batch (`@name` placeholders) and returns its rows. */
  query: <T = Record<string, unknown>>(
    statement: string,
    parameters?: SqlParameters,
  ) => Promise<T[]>
}

export type TestOptions = {
  /** Base URL of the API under test (without `/api`), set by each Playwright config. */
  apiUrl: string
}

type WorkerFixtures = {
  /** Connection string of the disposable database shared with the API under test. */
  connectionString: string
  db: Database
}

/**
 * Serves a runtime `config.js` pointing the frontend under test at the API started by the
 * current Playwright config; the development `public/config.js` stays untouched.
 */
export async function wireRuntimeConfig(
  context: BrowserContext,
  apiUrl: string,
) {
  await context.route('**/config.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.RUNTIME_CONFIG = ${JSON.stringify({ ENV: 'test', API_URL: `${apiUrl}/api` })}`,
    }),
  )
}

export const test = base.extend<TestOptions, WorkerFixtures>({
  apiUrl: ['', { option: true }],
  context: async ({ context, apiUrl }, provide) => {
    await wireRuntimeConfig(context, apiUrl)
    await provide(context)
  },
  connectionString: [
    process.env.ConnectionStrings__DefaultConnection ?? '',
    { option: true, scope: 'worker' },
  ],
  db: [
    async ({ connectionString }, provide) => {
      if (!connectionString) {
        throw new Error(
          'ConnectionStrings__DefaultConnection is not set: the BDD suite needs a disposable SQL Server database (see .zapper/behaviour-driven-development/README.md).',
        )
      }
      const pool = await new sql.ConnectionPool(connectionString).connect()
      const db: Database = {
        query: async <T>(statement: string, parameters: SqlParameters = {}) => {
          const request = pool.request()
          for (const [name, value] of Object.entries(parameters)) {
            request.input(name, value)
          }
          const result = await request.query(statement)
          return (result.recordset ?? []) as T[]
        },
      }
      await provide(db)
      await pool.close()
    },
    { scope: 'worker' },
  ],
})

export const { Given, When, Then, BeforeScenario, AfterScenario } =
  createBdd(test)
