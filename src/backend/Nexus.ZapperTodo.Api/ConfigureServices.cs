using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Nexus.ZapperTodo.Api.Authentication;
using Nexus.ZapperTodo.Api.ExceptionHandlers;
using Nexus.ZapperTodo.Application.Authentication;

namespace Nexus.ZapperTodo.Api;

public static class ConfigureServices
{
    public const string CorsPolicyName = "Frontend";

    public static IServiceCollection RegisterApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.ConfigureCors(configuration);
        services.AddProblemDetails();
        services.AddExceptionHandler<ValidationExceptionHandler>();
        services.AddExceptionHandler<DomainExceptionHandler>();
        services.AddControllers();
        services.AddHealthChecks();
        services.AddHttpContextAccessor();
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<IAuthenticatedUserService, AnonymousAuthenticatedUserService>();

        return services;
    }

    private static IServiceCollection ConfigureCors(this IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

        services.AddCors(options =>
        {
            options.AddPolicy(CorsPolicyName, policy =>
            {
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .WithExposedHeaders("Location");
            });
        });

        return services;
    }
}
