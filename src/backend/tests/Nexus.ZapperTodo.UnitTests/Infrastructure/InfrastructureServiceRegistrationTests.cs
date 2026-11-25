using FakeItEasy;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Nexus.ZapperTodo.Application.Authentication;
using Nexus.ZapperTodo.Domain.Entities;
using Nexus.ZapperTodo.Domain.Repositories;
using Nexus.ZapperTodo.Infrastructure;
using Nexus.ZapperTodo.Infrastructure.Data;

namespace Nexus.ZapperTodo.UnitTests.Infrastructure;

public class InfrastructureServiceRegistrationTests
{
    private static ServiceCollection BuildServices()
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Server=localhost,1433;Database=TestDb;Integrated Security=False;TrustServerCertificate=True;"
            })
            .Build();

        services.AddSingleton<IConfiguration>(configuration);
        services.AddSingleton(TimeProvider.System);
        services.AddScoped(_ => A.Fake<IAuthenticatedUserService>());
        services.RegisterInfrastructureServices(configuration);
        return services;
    }

    [Fact]
    public void RegisterInfrastructureServices_ShouldRegisterDapperConnectionFactory()
    {
        var provider = BuildServices().BuildServiceProvider();
        provider.GetService<DapperConnectionFactory>().Should().NotBeNull();
    }

    [Fact]
    public void RegisterInfrastructureServices_ShouldRegisterIUnitOfWorkAsScoped()
    {
        // Resolving IUnitOfWork opens a real SQL connection, so only the registration is verified here.
        var descriptor = BuildServices().Single(d => d.ServiceType == typeof(IUnitOfWork));

        descriptor.ImplementationType.Should().Be<DapperUnitOfWork>();
        descriptor.Lifetime.Should().Be(ServiceLifetime.Scoped);
    }

    [Fact]
    public void RegisterInfrastructureServices_ShouldRegisterGenericRepository()
    {
        var provider = BuildServices().BuildServiceProvider();
        using var scope = provider.CreateScope();
        var repository = scope.ServiceProvider.GetService<IRepository<TestEntity>>();
        repository.Should().NotBeNull();
        repository.Should().BeOfType<DapperRepository<TestEntity>>();
    }

    // TODO(A09): existing test of RG-04 extended (Todo repository registration, 77078-R08 and 77079-R06); usings reordered by A02.
    [Fact]
    public void RegisterInfrastructureServices_ShouldRegisterTodoRepository()
    {
        var provider = BuildServices().BuildServiceProvider();
        using var scope = provider.CreateScope();
        scope.ServiceProvider.GetService<ITodoRepository>().Should().BeOfType<TodoRepository>();
    }

    [Fact]
    public void RegisterInfrastructureServices_ShouldNotRegisterIDbConnection()
    {
        BuildServices().Should().NotContain(d => d.ServiceType == typeof(System.Data.IDbConnection));
    }

    public class TestEntity : BaseEntity;
}
