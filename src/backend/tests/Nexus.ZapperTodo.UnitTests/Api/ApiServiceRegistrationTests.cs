using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Nexus.ZapperTodo.Api;
using Nexus.ZapperTodo.Api.Authentication;
using Nexus.ZapperTodo.Api.ExceptionHandlers;
using Nexus.ZapperTodo.Application.Authentication;

namespace Nexus.ZapperTodo.UnitTests.Api;

public class ApiServiceRegistrationTests
{
    private static IServiceCollection BuildServices() =>
        new ServiceCollection().RegisterApiServices(new ConfigurationBuilder().Build());

    [Fact]
    public void RegisterApiServices_ShouldResolveTheAnonymousAuditUser()
    {
        using var provider = BuildServices().BuildServiceProvider();
        using var scope = provider.CreateScope();

        var user = scope.ServiceProvider.GetRequiredService<IAuthenticatedUserService>();

        user.Should().BeOfType<AnonymousAuthenticatedUserService>();
        user.GetAuthenticatedUser().Should().Be("anonymous");
    }

    [Fact]
    public void RegisterApiServices_ShouldRegisterValidationHandlerBeforeDomainHandler()
    {
        var handlers = BuildServices()
            .Where(d => d.ServiceType == typeof(IExceptionHandler))
            .Select(d => d.ImplementationType)
            .ToList();

        handlers.Should().Equal(typeof(ValidationExceptionHandler), typeof(DomainExceptionHandler));
    }
}
