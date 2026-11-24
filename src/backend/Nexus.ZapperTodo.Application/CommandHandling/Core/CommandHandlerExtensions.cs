using Microsoft.Extensions.DependencyInjection;

namespace Nexus.ZapperTodo.Application.CommandHandling.Core;

public static class CommandHandlerExtensions
{
    public static IServiceCollection AddCommandHandler<THandler, TCommand, TResult>(
        this IServiceCollection services)
        where THandler : class, ICommandHandler<TCommand, TResult>
        where TCommand : ICommand<TResult>
        where TResult : IResult
    {
        services.AddScoped<THandler>();
        services.AddScoped<ICommandHandler<TCommand, TResult>>(sp =>
            new CommandHandlerDecorator<TCommand, TResult>(
                sp.GetRequiredService<THandler>(),
                sp.GetServices<IPipelineBehavior<TCommand, TResult>>()));

        return services;
    }
}
