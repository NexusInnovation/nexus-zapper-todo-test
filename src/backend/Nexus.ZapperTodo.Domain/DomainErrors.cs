namespace Nexus.ZapperTodo.Domain;

public static class DomainErrors
{
    public static class Generic
    {
        public const string Unexpected = "errors.generic.unexpected";
        public const string NotFound = "errors.generic.notFound";
        public const string Conflict = "errors.generic.conflict";
        public const string ValidationFailed = "errors.generic.validationFailed";
    }

    public static class Pagination
    {
        public const string PageOutOfRange = "errors.pagination.pageOutOfRange";
        public const string PageSizeOutOfRange = "errors.pagination.pageSizeOutOfRange";
    }

    public static class Todo
    {
        public const string NotFound = "errors.todo.notFound";
        public const string TitleRequired = "errors.todo.titleRequired";
        public const string TitleTooLong = "errors.todo.titleTooLong";
    }
}
