namespace Nexus.ZapperTodo.Application.Todos;

public record TodoDto(
    Guid Id,
    string Title,
    bool IsDone,
    DateTimeOffset CreatedAt)
{
    public static TodoDto FromEntity(Domain.Entities.Todo entity) =>
        new(entity.Id, entity.Title, entity.IsDone, entity.CreatedAt);
}
