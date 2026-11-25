using System.Text.Json;

using Microsoft.AspNetCore.Http;

using Nexus.ZapperTodo.Api.ExceptionHandlers;
using Nexus.ZapperTodo.Domain;
using Nexus.ZapperTodo.Domain.Exceptions;

namespace Nexus.ZapperTodo.UnitTests.Api;

public class ExceptionHandlerTests
{
    [Fact]
    public async Task ValidationExceptionHandler_GivenValidationException_ThenWrites422WithFieldErrors()
    {
        var exception = new ValidationException(
            new Dictionary<string, string[]> { ["title"] = [DomainErrors.Todo.TitleRequired] });

        var (handled, status, body) = await Handle(new ValidationExceptionHandler().TryHandleAsync, exception);

        handled.Should().BeTrue();
        status.Should().Be(422);
        body.GetProperty("errors").GetProperty("title")[0].GetString().Should().Be(DomainErrors.Todo.TitleRequired);
    }

    [Fact]
    public async Task ValidationExceptionHandler_GivenOtherException_ThenDoesNotHandle()
    {
        var (handled, _, _) = await Handle(
            new ValidationExceptionHandler().TryHandleAsync,
            new NotFoundException(DomainErrors.Todo.NotFound, "missing"));

        handled.Should().BeFalse();
    }

    [Theory]
    [InlineData(typeof(NotFoundException), 404)]
    [InlineData(typeof(ConflictException), 409)]
    public async Task DomainExceptionHandler_GivenDomainException_ThenWritesProblemDetailsWithErrorCode(
        Type exceptionType, int expectedStatus)
    {
        var exception = (DomainException)Activator.CreateInstance(exceptionType, DomainErrors.Todo.NotFound, "message")!;

        var (handled, status, body) = await Handle(new DomainExceptionHandler().TryHandleAsync, exception);

        handled.Should().BeTrue();
        status.Should().Be(expectedStatus);
        body.GetProperty("status").GetInt32().Should().Be(expectedStatus);
        body.GetProperty("errorCode").GetString().Should().Be(DomainErrors.Todo.NotFound);
    }

    [Fact]
    public async Task DomainExceptionHandler_GivenNonDomainException_ThenDoesNotHandle()
    {
        var (handled, _, _) = await Handle(new DomainExceptionHandler().TryHandleAsync, new InvalidOperationException());

        handled.Should().BeFalse();
    }

    private static async Task<(bool Handled, int Status, JsonElement Body)> Handle(
        Func<HttpContext, Exception, CancellationToken, ValueTask<bool>> handler,
        Exception exception)
    {
        var context = new DefaultHttpContext();
        using var stream = new MemoryStream();
        context.Response.Body = stream;

        var handled = await handler(context, exception, CancellationToken.None);

        var body = stream.Length > 0 ? JsonDocument.Parse(stream.ToArray()).RootElement : default;
        return (handled, context.Response.StatusCode, body);
    }
}
