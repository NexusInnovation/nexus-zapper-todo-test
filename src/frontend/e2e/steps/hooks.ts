import { BeforeScenario } from './fixtures.ts'

// Every BDD scenario starts from an empty dbo.Todo; tolerates a schema not yet published.
// Regression scenarios keep their own prerequisites and are not reset.
BeforeScenario({ tags: 'not @regression' }, async ({ db }) => {
  await db.query(
    "IF OBJECT_ID(N'dbo.Todo', N'U') IS NOT NULL TRUNCATE TABLE dbo.Todo",
  )
})
