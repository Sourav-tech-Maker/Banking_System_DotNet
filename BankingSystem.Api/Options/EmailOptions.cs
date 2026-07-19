namespace BankingSystem.Api.Options;

public sealed class EmailOptions
{
    public const string SectionName = "Email";

    public bool Enabled { get; set; }
    public string Host { get; set; } = "smtp.gmail.com";
    public int Port { get; set; } = 587;
    public string SocketSecurity { get; set; } = "StartTls";
    public string FromName { get; set; } = "YONO App";
    public string FromEmail { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool AllowSenderAlias { get; set; }
    public int TimeoutSeconds { get; set; } = 30;
    public int PollingIntervalSeconds { get; set; } = 5;
    public OAuth2EmailOptions OAuth2 { get; set; } = new();

    public bool UsesGmail =>
        Host.Equals("smtp.gmail.com", StringComparison.OrdinalIgnoreCase);
}

public sealed class OAuth2EmailOptions
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public string TokenEndpoint { get; set; } = "https://oauth2.googleapis.com/token";

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(ClientId)
        && !string.IsNullOrWhiteSpace(ClientSecret)
        && !string.IsNullOrWhiteSpace(RefreshToken)
        && Uri.TryCreate(TokenEndpoint, UriKind.Absolute, out _);
}
