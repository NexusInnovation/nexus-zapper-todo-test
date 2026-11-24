using System.Data;

namespace Nexus.ZapperTodo.Domain.Repositories;

public interface IUnitOfWork : IDisposable
{
    IDbConnection Connection { get; }
    IDbTransaction Transaction { get; }
    Task CommitAsync(CancellationToken cancellationToken = default);
    void Rollback();
}
