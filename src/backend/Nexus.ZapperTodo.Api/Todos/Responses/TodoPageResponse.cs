using Nexus.ZapperTodo.Application.Todos;

namespace Nexus.ZapperTodo.Api.Todos.Responses;

public record TodoPageResponse(IReadOnlyList<TodoDto> Items, int TotalCount);
