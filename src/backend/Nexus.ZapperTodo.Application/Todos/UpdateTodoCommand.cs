using Nexus.ZapperTodo.Application.Authentication;
using Nexus.ZapperTodo.Application.CommandHandling.Core;
using Nexus.ZapperTodo.Domain.Repositories;

namespace Nexus.ZapperTodo.Application.Todos;

public record UpdateTodoCommand(Guid Id, string Title, bool IsDone) : ICommand<UpdateTodoResult>;

public record UpdateTodoResult(TodoDto Item) : IResult;

public class UpdateTodoCommandHandler(
    ITodoRepository todoRepository,
    IAuthenticatedUserService authenticatedUserService,
    TimeProvider timeProvider)
    : ICommandHandler<UpdateTodoCommand, UpdateTodoResult>
{
    public async Task<UpdateTodoResult> Handle(UpdateTodoCommand command)
    {
        // The body is validated before the lookup: a valid body on an unknown Id is a 404, never a 422.
        var title = TodoRules.NormalizeTitle(command.Title);

        var entity = await todoRepository.GetByIdAsync(command.Id)
            ?? throw TodoRules.NotFound(command.Id);

        entity.Title = title;
        entity.IsDone = command.IsDone;
        entity.UpdatedAt = timeProvider.GetUtcNow();
        entity.UpdatedBy = authenticatedUserService.GetAuthenticatedUser();

        await todoRepository.UpdateAsync(entity);

        return new UpdateTodoResult(TodoDto.FromEntity(entity));
    }
}
