using Dapper;

using Nexus.ZapperTodo.Application.Authentication;
using Nexus.ZapperTodo.Domain.Entities;
using Nexus.ZapperTodo.Domain.Repositories;

namespace Nexus.ZapperTodo.Infrastructure.Data;

public class TodoRepository(
    DapperConnectionFactory connectionFactory,
    IAuthenticatedUserService authenticatedUserService,
    TimeProvider timeProvider)
    : DapperRepository<Todo>(connectionFactory, authenticatedUserService, timeProvider), ITodoRepository
{
    private const string PageSql = """
        SELECT [Id], [CreatedAt], [CreatedBy], [UpdatedAt], [UpdatedBy], [IsDeleted], [DeletedAt], [DeletedBy], [Title], [IsDone]
        FROM [dbo].[Todo]
        WHERE [IsDeleted] = 0
        ORDER BY [CreatedAt], [Id]
        OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

        SELECT COUNT(*) FROM [dbo].[Todo] WHERE [IsDeleted] = 0;
        """;

    public async Task<(IReadOnlyList<Todo> Items, int TotalCount)> GetPageAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        using var connection = connectionFactory.CreateConnection();
        var command = new CommandDefinition(
            PageSql,
            new { Offset = (page - 1) * pageSize, PageSize = pageSize },
            cancellationToken: cancellationToken);

        using var results = await connection.QueryMultipleAsync(command);
        var items = (await results.ReadAsync<Todo>()).ToList();
        var totalCount = await results.ReadSingleAsync<int>();

        return (items, totalCount);
    }
}
