namespace Nexus.ZapperTodo.Application.CommandHandling.Core;

internal sealed class CommandHandlerDecorator<TCommand, TResult>(
    ICommandHandler<TCommand, TResult> inner,
    IEnumerable<IPipelineBehavior<TCommand, TResult>> behaviors)
    : ICommandHandler<TCommand, TResult>
    where TCommand : ICommand<TResult>
    where TResult : IResult
{
    public Task<TResult> Handle(TCommand command)
    {
        RequestHandlerDelegate<TResult> pipeline = () => inner.Handle(command);

        foreach (var behavior in behaviors.Where(b => b.ShouldHandle(command)).Reverse())
        {
            var next = pipeline;
            pipeline = () => behavior.Handle(command, next);
        }

        return pipeline();
    }
}
