// Realistic-volume dataset (D06): 100 000 non-deleted Todos loaded in one set-based statement.
export const volumeTodoCount = 100_000

export type QueryRunner = (
  statement: string,
  parameters?: Record<string, unknown>,
) => Promise<unknown>

// Empties dbo.Todo first (idempotent), then writes strictly increasing CreatedAt values,
// distinct titles and one Todo out of three done, audited as `anonymous`.
const loadVolumeSql = `
TRUNCATE TABLE dbo.Todo;
DECLARE @start DATETIMEOFFSET(7) = DATEADD(DAY, -2, SYSDATETIMEOFFSET());
WITH numbers AS (
  SELECT TOP (@count) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
  FROM sys.all_columns a CROSS JOIN sys.all_columns b
)
INSERT INTO dbo.Todo (Id, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy, IsDeleted, Title, IsDone)
SELECT NEWID(), DATEADD(MILLISECOND, n, @start), N'anonymous', DATEADD(MILLISECOND, n, @start),
  N'anonymous', 0, CONCAT(N'Todo de volume ', FORMAT(n, '000000')),
  CASE WHEN n % 3 = 0 THEN 1 ELSE 0 END
FROM numbers;
`

export async function loadVolumeDataset(query: QueryRunner) {
  await query(loadVolumeSql, { count: volumeTodoCount })
}
