using Nexus.ZapperTodo.Application.Authentication;

namespace Nexus.ZapperTodo.Api.Authentication;

/// <summary>
/// The application has no authentication (D05): every write is audited as the fixed user <c>anonymous</c>.
/// </summary>
public class AnonymousAuthenticatedUserService : IAuthenticatedUserService
{
    public const string AnonymousUser = "anonymous";

    public string GetAuthenticatedUser() => AnonymousUser;
}
