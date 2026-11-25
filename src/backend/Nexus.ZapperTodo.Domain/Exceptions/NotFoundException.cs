namespace Nexus.ZapperTodo.Domain.Exceptions;

public class NotFoundException(string errorCode, string message)
    : DomainException(errorCode, message);
