using Nexus.ZapperTodo.Domain;
using Nexus.ZapperTodo.Domain.Entities;
using Nexus.ZapperTodo.Domain.Exceptions;

namespace Nexus.ZapperTodo.Application.Todos;

/// <summary>
/// Title and pagination rules shared by the Todo commands.
/// </summary>
public static class TodoRules
{
    public const int DefaultPageSize = 50;
    public const int MaxPageSize = 100;

    /// <summary>
    /// Trims the title, then validates it (required, at most 200 characters); returns the trimmed title.
    /// </summary>
    public static string NormalizeTitle(string? title)
    {
        var trimmed = title?.Trim() ?? string.Empty;

        if (trimmed.Length == 0)
        {
            throw TitleError(DomainErrors.Todo.TitleRequired);
        }

        if (trimmed.Length > Todo.TitleMaxLength)
        {
            throw TitleError(DomainErrors.Todo.TitleTooLong);
        }

        return trimmed;
    }

    public static void ValidatePage(int page, int pageSize)
    {
        var errors = new Dictionary<string, string[]>();

        if (page < 1)
        {
            errors["page"] = [DomainErrors.Pagination.PageOutOfRange];
        }

        if (pageSize is < 1 or > MaxPageSize)
        {
            errors["pageSize"] = [DomainErrors.Pagination.PageSizeOutOfRange];
        }

        if (errors.Count > 0)
        {
            throw new ValidationException(errors);
        }
    }

    public static NotFoundException NotFound(Guid id) =>
        new(DomainErrors.Todo.NotFound, $"Todo with id '{id}' was not found.");

    private static ValidationException TitleError(string errorCode) =>
        new(new Dictionary<string, string[]> { ["title"] = [errorCode] });
}
