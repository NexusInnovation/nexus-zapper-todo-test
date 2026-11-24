using Nexus.ZapperTodo.Application.Authentication;
using Nexus.ZapperTodo.Domain.Entities;
using Nexus.ZapperTodo.Domain.Repositories;
using DapperExtensions;

namespace Nexus.ZapperTodo.Infrastructure.Data;

public class DapperRepository<T> : IRepository<T> where T : BaseEntity
{
    private readonly DapperConnectionFactory _connectionFactory;
    private readonly IAuthenticatedUserService _authenticatedUserService;
    private readonly TimeProvider _timeProvider;

    public DapperRepository(
        DapperConnectionFactory connectionFactory,
        IAuthenticatedUserService authenticatedUserService,
        TimeProvider timeProvider)
    {
        _connectionFactory = connectionFactory;
        _authenticatedUserService = authenticatedUserService;
        _timeProvider = timeProvider;
    }

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        using var connection = _connectionFactory.CreateConnection();
        var results = await connection.GetListAsync<T>(new { Id = id, IsDeleted = false });
        return results.SingleOrDefault();
    }

    public async Task<IEnumerable<T>> GetAllAsync(bool includingDeleted = false, CancellationToken cancellationToken = default)
    {
        using var connection = _connectionFactory.CreateConnection();
        var result = includingDeleted
            ? await connection.GetListAsync<T>()
            : await connection.GetListAsync<T>(new { IsDeleted = false });
        return result;
    }

    public async Task InsertAsync(T entity, CancellationToken cancellationToken = default)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.InsertAsync(entity);
    }

    public async Task UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        using var connection = _connectionFactory.CreateConnection();
        await RepoDb.DbConnectionExtension.UpdateAsync<T>(connection, entity, cancellationToken: cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity is null)
        {
            return;
        }

        entity.IsDeleted = true;
        entity.DeletedAt = _timeProvider.GetUtcNow();
        entity.DeletedBy = _authenticatedUserService.GetAuthenticatedUser();

        await UpdateAsync(entity, cancellationToken);
    }
}
