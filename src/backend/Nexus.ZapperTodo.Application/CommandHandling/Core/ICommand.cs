namespace Nexus.ZapperTodo.Application.CommandHandling.Core;

public interface ICommand<TResult>
    where TResult : IResult
{
    string GetErrorLogMessage(Exception ex) =>
        $"Unhandled exception while executing {GetType().Name}: {ex.Message}";
}
