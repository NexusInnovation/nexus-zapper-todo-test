-- TODO(A01): date columns are DATETIMEOFFSET(7) (standard type mapping of BaseEntity DateTimeOffset), not datetime2:
-- DapperExtensions cannot map datetime2 to DateTimeOffset. Creation order is unchanged.
CREATE TABLE [dbo].[Todo]
(
    [Id]          UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Todo_Id] DEFAULT NEWID(),
    [CreatedAt]   DATETIMEOFFSET(7) NOT NULL,
    [CreatedBy]   NVARCHAR(256)    NOT NULL,
    [UpdatedAt]   DATETIMEOFFSET(7) NOT NULL,
    [UpdatedBy]   NVARCHAR(256)    NOT NULL,
    [IsDeleted]   BIT              NOT NULL CONSTRAINT [DF_Todo_IsDeleted] DEFAULT 0,
    [DeletedAt]   DATETIMEOFFSET(7) NULL,
    [DeletedBy]   NVARCHAR(256)    NULL,
    [Title]       NVARCHAR(200)    NOT NULL,
    [IsDone]      BIT              NOT NULL CONSTRAINT [DF_Todo_IsDone] DEFAULT 0,
    CONSTRAINT [PK_Todo] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO

-- Serves the paged list in creation order and the count of non-deleted Todos.
CREATE NONCLUSTERED INDEX [IX_Todo_CreatedAt_Id]
    ON [dbo].[Todo] ([CreatedAt] ASC, [Id] ASC)
    INCLUDE ([Title], [IsDone])
    WHERE [IsDeleted] = 0;
GO
