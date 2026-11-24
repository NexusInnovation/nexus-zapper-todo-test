using Microsoft.Extensions.DependencyInjection;

namespace Nexus.ZapperTodo.Domain;

public static class ConfigureServices
{
    public static IServiceCollection RegisterDomainServices(this IServiceCollection services)
    {
        // Domain-specific registrations go here
        return services;
    }
}
