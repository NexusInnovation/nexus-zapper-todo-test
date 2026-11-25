using Nexus.ZapperTodo.Application.Authentication;
using Nexus.ZapperTodo.Application.CommandHandling.Core;
using Nexus.ZapperTodo.Domain.Entities;
using Nexus.ZapperTodo.Domain.Repositories;

namespace Nexus.ZapperTodo.Application.Todos;

public record CreateTodoCommand(string Title) : ICommand<CreateTodoResult>;

public record CreateTodoResult(Guid TodoId) : IResult;

public class CreateTodoCommandHandler(
    ITodoRepository todoRepository,
    IAuthenticatedUserService authenticatedUserService,
    TimeProvider timeProvider)
    : ICommandHandler<CreateTodoCommand, CreateTodoResult>
{
    public async Task<CreateTodoResult> Handle(CreateTodoCommand command)
    {
        var title = TodoRules.NormalizeTitle(command.Title);
        var authenticatedUser = authenticatedUserService.GetAuthenticatedUser();
        var now = timeProvider.GetUtcNow();

        var entity = new Todo
        {
            Id = Guid.NewGuid(),
            CreatedAt = now,
            CreatedBy = authenticatedUser,
            UpdatedAt = now,
            UpdatedBy = authenticatedUser,
            IsDeleted = false,
            Title = title,
            IsDone = false,
        };

        await todoRepository.InsertAsync(entity);

        return new CreateTodoResult(entity.Id);
    }
}
