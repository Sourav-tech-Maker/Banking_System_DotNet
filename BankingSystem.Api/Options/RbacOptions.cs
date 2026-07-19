namespace BankingSystem.Api.Options;

public sealed class RbacOptions
{
    public const string SectionName = "Rbac";

    public string RegistrationKey { get; init; } = string.Empty;
}
