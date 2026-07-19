using Microsoft.EntityFrameworkCore;

namespace BankingSystem.Api.Middleware;

public sealed class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            logger.LogInformation(
                "Request was cancelled by the client. {Method} {Path}",
                context.Request.Method,
                context.Request.Path);
        }
        catch (Exception exception)
        {
            if (context.Response.HasStarted)
            {
                throw;
            }

            var (statusCode, message, error) = MapException(exception);

            if (statusCode >= StatusCodes.Status500InternalServerError)
            {
                logger.LogError(
                    exception,
                    "Unhandled API exception. TraceId: {TraceId}, Method: {Method}, Path: {Path}",
                    context.TraceIdentifier,
                    context.Request.Method,
                    context.Request.Path);
            }
            else
            {
                logger.LogWarning(
                    "API request rejected. TraceId: {TraceId}, StatusCode: {StatusCode}, Method: {Method}, Path: {Path}, Reason: {Reason}",
                    context.TraceIdentifier,
                    statusCode,
                    context.Request.Method,
                    context.Request.Path,
                    message);
            }

            context.Response.Clear();
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";

            if (error is null)
            {
                await context.Response.WriteAsJsonAsync(new { message }, context.RequestAborted);
            }
            else
            {
                await context.Response.WriteAsJsonAsync(new { error, message }, context.RequestAborted);
            }
        }
    }

    private static (int StatusCode, string Message, string? Error) MapException(Exception exception) =>
        exception switch
        {
            ApiException apiException =>
                (apiException.StatusCode, apiException.Message, apiException.Error),
            DbUpdateConcurrencyException =>
                (StatusCodes.Status409Conflict, "The request conflicted with another update. Please retry.", null),
            DbUpdateException =>
                (StatusCodes.Status409Conflict, "The database rejected the request because it conflicts with existing data.", null),
            _ =>
                (StatusCodes.Status500InternalServerError, "Something went wrong!", null)
        };
}
