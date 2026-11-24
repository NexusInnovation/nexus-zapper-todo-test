namespace Nexus.ZapperTodo.Application.CommandHandling.Core;

public interface ICommandHandler<TCommand, TResult>
    where TCommand : ICommand<TResult>
    where TResult : IResult
{
    Task<TResult> Handle(TCommand command);
}
