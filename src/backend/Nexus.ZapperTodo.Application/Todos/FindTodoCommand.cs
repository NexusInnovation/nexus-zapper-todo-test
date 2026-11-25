using Nexus.ZapperTodo.Application.CommandHandling.Core;
using Nexus.ZapperTodo.Domain.Repositories;

namespace Nexus.ZapperTodo.Application.Todos;

public record FindTodoCommand(Guid Id) : ICommand<FindTodoResult>;

public record FindTodoResult(TodoDto Item) : IResult;

public class FindTodoCommandHandler(ITodoRepository todoRepository)
    : ICommandHandler<FindTodoCommand, FindTodoResult>
{
    public async Task<FindTodoResult> Handle(FindTodoCommand command)
    {
        var entity = await todoRepository.GetByIdAsync(command.Id)
            ?? throw TodoRules.NotFound(command.Id);

        return new FindTodoResult(TodoDto.FromEntity(entity));
    }
}
