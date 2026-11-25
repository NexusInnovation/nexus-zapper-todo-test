using Nexus.ZapperTodo.Application.CommandHandling.Core;
using Nexus.ZapperTodo.Domain.Repositories;

namespace Nexus.ZapperTodo.Application.Todos;

public record DeleteTodoCommand(Guid Id) : ICommand<DeleteTodoResult>;

public record DeleteTodoResult : IResult { }

public class DeleteTodoCommandHandler(ITodoRepository todoRepository)
    : ICommandHandler<DeleteTodoCommand, DeleteTodoResult>
{
    public async Task<DeleteTodoResult> Handle(DeleteTodoCommand command)
    {
        // DeleteAsync silently ignores a missing Id: check existence first so a repeated delete is a 404.
        _ = await todoRepository.GetByIdAsync(command.Id)
            ?? throw TodoRules.NotFound(command.Id);

        await todoRepository.DeleteAsync(command.Id);

        return new DeleteTodoResult();
    }
}
