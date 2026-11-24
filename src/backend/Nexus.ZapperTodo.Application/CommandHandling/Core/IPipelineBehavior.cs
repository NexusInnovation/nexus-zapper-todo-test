namespace Nexus.ZapperTodo.Application.CommandHandling.Core;

public delegate Task<TResult> RequestHandlerDelegate<TResult>();

public interface IPipelineBehavior<TCommand, TResult>
    where TCommand : ICommand<TResult>
    where TResult : IResult
{
    bool ShouldHandle(TCommand command) => true;
    Task<TResult> Handle(TCommand command, RequestHandlerDelegate<TResult> next);
}
