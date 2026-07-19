namespace BankingSystem.Api.Middleware;

public sealed class ApiException : Exception
{
    public ApiException(int statusCode, string message, string? error = null)
        : base(message)
    {
        StatusCode = statusCode;
        Error = error;
    }

    public int StatusCode { get; }
    public string? Error { get; }
}
