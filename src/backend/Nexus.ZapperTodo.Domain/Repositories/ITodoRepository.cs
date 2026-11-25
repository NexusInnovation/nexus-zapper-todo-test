using Nexus.ZapperTodo.Domain.Entities;

namespace Nexus.ZapperTodo.Domain.Repositories;

public interface ITodoRepository : IRepository<Todo>
{
    /// <summary>
    /// Reads one page of non-deleted Todos in creation order (CreatedAt, then Id) and the total count of non-deleted Todos.
    /// </summary>
    Task<(IReadOnlyList<Todo> Items, int TotalCount)> GetPageAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}
