using Nexus.ZapperTodo.Domain.Repositories;
using Nexus.ZapperTodo.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RepoDb;

namespace Nexus.ZapperTodo.Infrastructure;

public static class ConfigureServices
{
    public static IServiceCollection RegisterInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        GlobalConfiguration.Setup().UseSqlServer();

        services.AddSingleton<DapperConnectionFactory>();
        services.AddScoped<IUnitOfWork, DapperUnitOfWork>();
        services.AddScoped(typeof(IRepository<>), typeof(DapperRepository<>));

        return services;
    }
}
