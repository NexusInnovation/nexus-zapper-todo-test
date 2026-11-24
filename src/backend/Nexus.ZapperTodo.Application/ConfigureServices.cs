using System.Reflection;

using Nexus.ZapperTodo.Application.CommandHandling.Core;

using Microsoft.Extensions.DependencyInjection;

namespace Nexus.ZapperTodo.Application;

public static class ConfigureServices
{
    public static IServiceCollection RegisterApplicationServices(this IServiceCollection services)
    {
        services
            .RegisterCommandHandlersFromAssembly(typeof(ConfigureServices).Assembly);

        return services;
    }

    private static void RegisterCommandHandlersFromAssembly(
        this IServiceCollection services,
        Assembly assembly)
    {
        var commandHandlerInterface = typeof(ICommandHandler<,>);

        var handlers = assembly.GetTypes()
            .Where(t => t is { IsAbstract: false, IsInterface: false })
            .SelectMany(t => t.GetInterfaces()
                .Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == commandHandlerInterface)
                .Select(i => (HandlerType: t, InterfaceType: i)));

        foreach (var (handlerType, interfaceType) in handlers)
        {
            var typeArgs = interfaceType.GetGenericArguments();
            var decoratorType = typeof(CommandHandlerDecorator<,>).MakeGenericType(typeArgs);
            var behaviorsType = typeof(IEnumerable<>).MakeGenericType(
                typeof(IPipelineBehavior<,>).MakeGenericType(typeArgs));

            services.AddScoped(handlerType);
            services.AddScoped(interfaceType, sp =>
            {
                var inner = sp.GetRequiredService(handlerType);
                var behaviors = sp.GetRequiredService(behaviorsType);
                return Activator.CreateInstance(decoratorType, inner, behaviors)!;
            });
        }
    }
}
