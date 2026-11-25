using Nexus.ZapperTodo.Application.CommandHandling.Core;
using Nexus.ZapperTodo.Domain.Repositories;

namespace Nexus.ZapperTodo.Application.Todos;

public record ListTodosCommand(int Page, int PageSize) : ICommand<ListTodosResult>;

public record ListTodosResult(IReadOnlyList<TodoDto> Items, int TotalCount) : IResult;

public class ListTodosCommandHandler(ITodoRepository todoRepository)
    : ICommandHandler<ListTodosCommand, ListTodosResult>
{
    public async Task<ListTodosResult> Handle(ListTodosCommand command)
    {
        TodoRules.ValidatePage(command.Page, command.PageSize);

        var (entities, totalCount) = await todoRepository.GetPageAsync(command.Page, command.PageSize);
        var items = entities.Select(TodoDto.FromEntity).ToList();

        return new ListTodosResult(items, totalCount);
    }
}
