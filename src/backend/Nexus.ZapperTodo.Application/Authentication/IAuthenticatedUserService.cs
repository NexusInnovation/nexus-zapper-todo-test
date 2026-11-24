namespace Nexus.ZapperTodo.Application.Authentication;

public interface IAuthenticatedUserService
{
    /// <summary>
    /// Returns the identity of the authenticated caller (e.g. UPN / email), used to stamp audit fields.
    /// </summary>
    string GetAuthenticatedUser();
}
