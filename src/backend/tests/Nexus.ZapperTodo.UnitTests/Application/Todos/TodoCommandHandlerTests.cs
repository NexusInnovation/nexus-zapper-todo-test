using FakeItEasy;

using Nexus.ZapperTodo.Application.Authentication;
using Nexus.ZapperTodo.Application.Todos;
using Nexus.ZapperTodo.Domain;
using Nexus.ZapperTodo.Domain.Entities;
using Nexus.ZapperTodo.Domain.Exceptions;
using Nexus.ZapperTodo.Domain.Repositories;

namespace Nexus.ZapperTodo.UnitTests.Application.Todos;

public class TodoCommandHandlerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 24, 12, 0, 0, TimeSpan.Zero);

    private readonly ITodoRepository _repository = A.Fake<ITodoRepository>();
    private readonly IAuthenticatedUserService _user = A.Fake<IAuthenticatedUserService>();
    private readonly TimeProvider _timeProvider = new FixedTimeProvider(Now);

    public TodoCommandHandlerTests()
    {
        A.CallTo(() => _user.GetAuthenticatedUser()).Returns("anonymous");
    }

    [Fact]
    public async Task Create_GivenValidTitle_ThenInsertsTrimmedNotDoneTodoAuditedAsTheUser()
    {
        var handler = new CreateTodoCommandHandler(_repository, _user, _timeProvider);

        var result = await handler.Handle(new CreateTodoCommand("  Acheter du pain  "));

        result.TodoId.Should().NotBe(Guid.Empty);
        A.CallTo(() => _repository.InsertAsync(
                A<Todo>.That.Matches(t =>
                    t.Id == result.TodoId
                    && t.Title == "Acheter du pain"
                    && !t.IsDone
                    && t.CreatedAt == Now
                    && t.CreatedBy == "anonymous"),
                A<CancellationToken>._))
            .MustHaveHappenedOnceExactly();
    }

    [Fact]
    public async Task Create_GivenInvalidTitle_ThenInsertsNothing()
    {
        var handler = new CreateTodoCommandHandler(_repository, _user, _timeProvider);

        var act = () => handler.Handle(new CreateTodoCommand("  "));

        await act.Should().ThrowAsync<ValidationException>();
        A.CallTo(() => _repository.InsertAsync(A<Todo>._, A<CancellationToken>._)).MustNotHaveHappened();
    }

    [Fact]
    public async Task List_GivenAPage_ThenReturnsItemsAndTotalCount()
    {
        var todo = new Todo { Id = Guid.NewGuid(), Title = "Un", IsDone = true, CreatedAt = Now };
        A.CallTo(() => _repository.GetPageAsync(2, 50, A<CancellationToken>._))
            .Returns((new List<Todo> { todo }, 51));
        var handler = new ListTodosCommandHandler(_repository);

        var result = await handler.Handle(new ListTodosCommand(2, 50));

        result.TotalCount.Should().Be(51);
        result.Items.Should().Equal(new TodoDto(todo.Id, "Un", true, Now));
    }

    [Fact]
    public async Task List_GivenPageSizeAboveMaximum_ThenRefusesWithoutReading()
    {
        var handler = new ListTodosCommandHandler(_repository);

        var act = () => handler.Handle(new ListTodosCommand(1, 101));

        await act.Should().ThrowAsync<ValidationException>();
        A.CallTo(() => _repository.GetPageAsync(A<int>._, A<int>._, A<CancellationToken>._)).MustNotHaveHappened();
    }

    [Fact]
    public async Task Find_GivenUnknownId_ThenThrowsTodoNotFound()
    {
        var id = Guid.NewGuid();
        A.CallTo(() => _repository.GetByIdAsync(id, A<CancellationToken>._)).Returns((Todo?)null);
        var handler = new FindTodoCommandHandler(_repository);

        var act = () => handler.Handle(new FindTodoCommand(id));

        (await act.Should().ThrowAsync<NotFoundException>())
            .Which.ErrorCode.Should().Be(DomainErrors.Todo.NotFound);
    }

    [Fact]
    public async Task Update_GivenExistingTodo_ThenReplacesTitleAndStateAndReturnsIt()
    {
        var todo = new Todo { Id = Guid.NewGuid(), Title = "Avant", CreatedAt = Now.AddDays(-1) };
        A.CallTo(() => _repository.GetByIdAsync(todo.Id, A<CancellationToken>._)).Returns(todo);
        var handler = new UpdateTodoCommandHandler(_repository, _user, _timeProvider);

        var result = await handler.Handle(new UpdateTodoCommand(todo.Id, " Après ", true));

        result.Item.Should().Be(new TodoDto(todo.Id, "Après", true, Now.AddDays(-1)));
        A.CallTo(() => _repository.UpdateAsync(
                A<Todo>.That.Matches(t => t.Title == "Après" && t.IsDone && t.UpdatedAt == Now),
                A<CancellationToken>._))
            .MustHaveHappenedOnceExactly();
    }

    [Fact]
    public async Task Update_GivenUnknownOrDeletedId_ThenThrowsTodoNotFound()
    {
        var id = Guid.NewGuid();
        A.CallTo(() => _repository.GetByIdAsync(id, A<CancellationToken>._)).Returns((Todo?)null);
        var handler = new UpdateTodoCommandHandler(_repository, _user, _timeProvider);

        var act = () => handler.Handle(new UpdateTodoCommand(id, "Titre", true));

        (await act.Should().ThrowAsync<NotFoundException>())
            .Which.ErrorCode.Should().Be(DomainErrors.Todo.NotFound);
        A.CallTo(() => _repository.UpdateAsync(A<Todo>._, A<CancellationToken>._)).MustNotHaveHappened();
    }

    [Fact]
    public async Task Update_GivenInvalidTitle_ThenValidatesBeforeLookingUpTheId()
    {
        var handler = new UpdateTodoCommandHandler(_repository, _user, _timeProvider);

        var act = () => handler.Handle(new UpdateTodoCommand(Guid.NewGuid(), new string('a', 201), false));

        await act.Should().ThrowAsync<ValidationException>();
        A.CallTo(() => _repository.GetByIdAsync(A<Guid>._, A<CancellationToken>._)).MustNotHaveHappened();
    }

    [Fact]
    public async Task Delete_GivenExistingTodo_ThenSoftDeletesIt()
    {
        var todo = new Todo { Id = Guid.NewGuid(), Title = "Un" };
        A.CallTo(() => _repository.GetByIdAsync(todo.Id, A<CancellationToken>._)).Returns(todo);
        var handler = new DeleteTodoCommandHandler(_repository);

        await handler.Handle(new DeleteTodoCommand(todo.Id));

        A.CallTo(() => _repository.DeleteAsync(todo.Id, A<CancellationToken>._)).MustHaveHappenedOnceExactly();
    }

    [Fact]
    public async Task Delete_GivenUnknownOrAlreadyDeletedId_ThenThrowsTodoNotFound()
    {
        var id = Guid.NewGuid();
        A.CallTo(() => _repository.GetByIdAsync(id, A<CancellationToken>._)).Returns((Todo?)null);
        var handler = new DeleteTodoCommandHandler(_repository);

        var act = () => handler.Handle(new DeleteTodoCommand(id));

        (await act.Should().ThrowAsync<NotFoundException>())
            .Which.ErrorCode.Should().Be(DomainErrors.Todo.NotFound);
        A.CallTo(() => _repository.DeleteAsync(A<Guid>._, A<CancellationToken>._)).MustNotHaveHappened();
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
