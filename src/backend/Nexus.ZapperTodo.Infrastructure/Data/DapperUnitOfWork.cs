using System.Data;

using Nexus.ZapperTodo.Domain.Repositories;

namespace Nexus.ZapperTodo.Infrastructure.Data;

public sealed class DapperUnitOfWork : IUnitOfWork
{
    private bool _disposed;

    public IDbConnection Connection { get; }
    public IDbTransaction Transaction { get; }

    public DapperUnitOfWork(DapperConnectionFactory connectionFactory)
    {
        Connection = connectionFactory.CreateConnection();
        Connection.Open();
        Transaction = Connection.BeginTransaction();
    }

    public Task CommitAsync(CancellationToken cancellationToken = default)
    {
        Transaction.Commit();
        return Task.CompletedTask;
    }

    public void Rollback() => Transaction.Rollback();

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        Transaction.Dispose();
        Connection.Dispose();
        _disposed = true;
    }
}
