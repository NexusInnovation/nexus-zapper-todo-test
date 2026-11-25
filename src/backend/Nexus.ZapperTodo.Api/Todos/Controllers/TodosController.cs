using Microsoft.AspNetCore.Mvc;

using Nexus.ZapperTodo.Api.Todos.Requests;
using Nexus.ZapperTodo.Api.Todos.Responses;
using Nexus.ZapperTodo.Application.CommandHandling.Core;
using Nexus.ZapperTodo.Application.Todos;

namespace Nexus.ZapperTodo.Api.Todos.Controllers;

[ApiController]
[Route("api/todos")]
public class TodosController(
    ICommandHandler<ListTodosCommand, ListTodosResult> listHandler,
    ICommandHandler<CreateTodoCommand, CreateTodoResult> createHandler,
    ICommandHandler<FindTodoCommand, FindTodoResult> findHandler,
    ICommandHandler<UpdateTodoCommand, UpdateTodoResult> updateHandler,
    ICommandHandler<DeleteTodoCommand, DeleteTodoResult> deleteHandler)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<TodoPageResponse>> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = TodoRules.DefaultPageSize)
    {
        var result = await listHandler.Handle(new ListTodosCommand(page, pageSize));

        return Ok(new TodoPageResponse(result.Items, result.TotalCount));
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateTodoRequest request)
    {
        var result = await createHandler.Handle(new CreateTodoCommand(request.Title));

        return Created($"{result.TodoId}", null);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TodoDto>> Find(Guid id)
    {
        var result = await findHandler.Handle(new FindTodoCommand(id));

        return Ok(result.Item);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TodoDto>> Update(Guid id, [FromBody] UpdateTodoRequest request)
    {
        var result = await updateHandler.Handle(new UpdateTodoCommand(id, request.Title, request.IsDone));

        return Ok(result.Item);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await deleteHandler.Handle(new DeleteTodoCommand(id));

        return NoContent();
    }
}
