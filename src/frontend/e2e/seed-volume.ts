// Loads the realistic-volume dataset into the database of ConnectionStrings__DefaultConnection.
// Usage: pnpm --dir src/frontend seed:volume
import sql from 'mssql'
import {
  loadVolumeDataset,
  volumeTodoCount,
} from './steps/todos/volume-dataset.ts'

const connectionString = process.env.ConnectionStrings__DefaultConnection
if (!connectionString) {
  console.error('ConnectionStrings__DefaultConnection is not set.')
  process.exit(1)
}

const pool = await new sql.ConnectionPool(connectionString).connect()
try {
  await loadVolumeDataset(async (statement, parameters = {}) => {
    const request = pool.request()
    for (const [name, value] of Object.entries(parameters)) {
      request.input(name, value)
    }
    return request.query(statement)
  })
  const { recordset } = await pool
    .request()
    .query<{ total: number }>(
      'SELECT COUNT(*) AS total FROM dbo.Todo WHERE IsDeleted = 0',
    )
  console.log(
    `Loaded ${recordset[0].total} Todos (expected ${volumeTodoCount}).`,
  )
} finally {
  await pool.close()
}
