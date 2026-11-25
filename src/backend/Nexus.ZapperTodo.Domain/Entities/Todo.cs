namespace Nexus.ZapperTodo.Domain.Entities;

public class Todo : BaseEntity
{
    public const int TitleMaxLength = 200;

    public string Title { get; set; } = string.Empty;
    public bool IsDone { get; set; }
}
