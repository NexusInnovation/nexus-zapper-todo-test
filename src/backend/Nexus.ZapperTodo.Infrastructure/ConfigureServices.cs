using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Nexus.ZapperTodo.Domain.Repositories;
using Nexus.ZapperTodo.Infrastructure.Data;

using RepoDb;

namespace Nexus.ZapperTodo.Infrastructure;

public static class ConfigureServices
{
    public static IServiceCollection RegisterInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        GlobalConfiguration.Setup().UseSqlServer();

        // TODO(A02): out-of-plan fix of the baseline so `dotnet format --verify-no-changes` passes (the parameter was unused).
        services.AddSingleton(_ => new DapperConnectionFactory(configuration));
        services.AddScoped<IUnitOfWork, DapperUnitOfWork>();
        services.AddScoped(typeof(IRepository<>), typeof(DapperRepository<>));
        services.AddScoped<ITodoRepository, TodoRepository>();

        return services;
    }
}
