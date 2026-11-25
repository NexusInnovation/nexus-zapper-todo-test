using System.Data;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace Nexus.ZapperTodo.Infrastructure.Data;

public class DapperConnectionFactory
{
    private readonly string _connectionString;

    public DapperConnectionFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
    }

    public IDbConnection CreateConnection() => new SqlConnection(_connectionString);
}
