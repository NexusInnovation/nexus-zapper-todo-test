namespace Nexus.ZapperTodo.Domain.Exceptions;

public class ConflictException(string errorCode, string message)
    : DomainException(errorCode, message);
