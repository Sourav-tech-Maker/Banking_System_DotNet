using System.Text;
using System.Threading.RateLimiting;
using BankingSystem.Api.Data;
using BankingSystem.Api.Middleware;
using BankingSystem.Api.Options;
using BankingSystem.Api.Services;
using BankingSystem.Api.Validation;
using FluentValidation;
using MailKit.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MimeKit;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole(options =>
{
    options.IncludeScopes = true;
    options.TimestampFormat = "yyyy-MM-dd'T'HH:mm:ss.fff'Z'";
    options.UseUtcTimestamp = true;
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "ConnectionStrings:DefaultConnection must be configured.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services
    .AddOptions<JwtOptions>()
    .Bind(builder.Configuration.GetSection(JwtOptions.SectionName))
    .Validate(options => !string.IsNullOrWhiteSpace(options.Issuer), "JWT issuer is required.")
    .Validate(options => !string.IsNullOrWhiteSpace(options.Audience), "JWT audience is required.")
    .Validate(
        options => Encoding.UTF8.GetByteCount(options.SigningKey ?? string.Empty) >= 32,
        "JWT signing key must contain at least 32 UTF-8 bytes.")
    .Validate(options => options.AccessTokenMinutes > 0, "Access-token lifetime must be positive.")
    .Validate(options => options.RefreshTokenDays > 0, "Refresh-token lifetime must be positive.")
    .ValidateOnStart();

builder.Services
    .AddOptions<RbacOptions>()
    .Bind(builder.Configuration.GetSection(RbacOptions.SectionName))
    .Validate(
        options => !string.IsNullOrWhiteSpace(options.RegistrationKey),
        "The RBAC registration key is required.")
    .ValidateOnStart();

builder.Services
    .AddOptions<EmailOptions>()
    .Bind(builder.Configuration.GetSection(EmailOptions.SectionName))
    .Validate(
        options => !options.Enabled
            || (!string.IsNullOrWhiteSpace(options.Host)
                && options.Port is > 0 and <= 65_535
                && !string.IsNullOrWhiteSpace(options.FromEmail)
                && !string.IsNullOrWhiteSpace(options.Username)),
        "Enabled email delivery requires a host, port, sender address, and username.")
    .Validate(
        options => !options.Enabled || MailboxAddress.TryParse(options.FromEmail, out _),
        "Email:FromEmail must be a valid email address.")
    .Validate(
        options => !options.Enabled
            || !options.UsesGmail
            || options.AllowSenderAlias
            || string.Equals(
                options.FromEmail.Trim(),
                options.Username.Trim(),
                StringComparison.OrdinalIgnoreCase),
        "For Gmail, Email:FromEmail must match Email:Username unless Email:AllowSenderAlias is true and the address is a verified Gmail 'Send mail as' alias.")
    .Validate(
        options => !options.Enabled
            || !string.IsNullOrWhiteSpace(options.Password)
            || options.OAuth2.IsConfigured,
        "Enabled email delivery requires either a password or complete OAuth2 settings.")
    .Validate(
        options => !options.Enabled
            || Enum.TryParse<SecureSocketOptions>(
                options.SocketSecurity,
                ignoreCase: true,
                out _),
        "Email socket security must be Auto, None, SslOnConnect, StartTls, or StartTlsWhenAvailable.")
    .Validate(
        options => options.TimeoutSeconds is >= 5 and <= 120,
        "Email timeout must be between 5 and 120 seconds.")
    .Validate(
        options => options.PollingIntervalSeconds is >= 1 and <= 60,
        "Email polling interval must be between 1 and 60 seconds.")
    .ValidateOnStart();

var jwtConfiguration = builder.Configuration
    .GetSection(JwtOptions.SectionName)
    .Get<JwtOptions>() ?? new JwtOptions();

System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtConfiguration.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtConfiguration.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtConfiguration.SigningKey ?? string.Empty)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            NameClaimType = "userid",
            RoleClaimType = "role"
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (string.IsNullOrWhiteSpace(context.Token)
                    && context.Request.Cookies.TryGetValue("token", out var cookieToken))
                {
                    context.Token = cookieToken;
                }

                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                var rawToken = context.Request.Cookies["token"];
                if (string.IsNullOrWhiteSpace(rawToken))
                {
                    var authorization = context.Request.Headers.Authorization.ToString();
                    if (authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    {
                        rawToken = authorization["Bearer ".Length..].Trim();
                    }
                }

                if (string.IsNullOrWhiteSpace(rawToken))
                {
                    return;
                }

                var tokenService = context.HttpContext.RequestServices
                    .GetRequiredService<ITokenService>();
                var dbContext = context.HttpContext.RequestServices
                    .GetRequiredService<AppDbContext>();
                var tokenHash = tokenService.HashToken(rawToken);
                var isRevoked = await dbContext.RevokedAccessTokens
                    .AsNoTracking()
                    .AnyAsync(token => token.TokenHash == tokenHash);

                if (isRevoked)
                {
                    context.Fail("The access token has been revoked.");
                }
            }
        };
    });

builder.Services.AddAuthorization();

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:5173"];
Console.WriteLine($"[CORS] Allowed Origins: {string.Join(", ", allowedOrigins)}");

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("Auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 60,
                Window = TimeSpan.FromMinutes(15),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
    options.AddPolicy("OtpResend", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(15),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
    options.AddPolicy("Kyc", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(15),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { message = "Too many requests. Please try again later." },
            cancellationToken);
    };
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<ITokenService, TokenService>();
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
builder.Services.AddHostedService<OutboxEmailDispatcher>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISystemUserService, SystemUserService>();
builder.Services.AddScoped<IImageKitService, ImageKitService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<ITransferOtpService, TransferOtpService>();
builder.Services.Configure<ImageKitOptions>(builder.Configuration.GetSection(ImageKitOptions.SectionName));

var app = builder.Build();
var configuredEmail = app.Services
    .GetRequiredService<Microsoft.Extensions.Options.IOptions<EmailOptions>>()
    .Value;
if (configuredEmail.Enabled)
{
    app.Logger.LogInformation(
        "Email delivery enabled through {Host}:{Port} as {Username}; sender {FromEmail}; authentication {AuthenticationMode}.",
        configuredEmail.Host,
        configuredEmail.Port,
        configuredEmail.Username,
        configuredEmail.FromEmail,
        configuredEmail.OAuth2.IsConfigured ? "OAuth2" : "SMTP password");
}
else
{
    app.Logger.LogWarning(
        "Email delivery is disabled. Registration emails will remain pending in Integration.OutboxMessages.");
}
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Banking System API v1");
    c.RoutePrefix = string.Empty;
});
app.UseMiddleware<ExceptionHandlingMiddleware>();
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors("AllowFrontend");
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Ensure default authentication roles exist in the database on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        var existingNormRoles = await dbContext.Roles.Select(r => r.NormalizedRoleName).ToListAsync();
        var requiredRoles = new (string Name, string Norm)[]
        {
            ("user", "USER"),
            ("admin", "ADMIN"),
            ("systemUser", "SYSTEMUSER")
        };

        var missing = requiredRoles.Where(r => !existingNormRoles.Contains(r.Norm)).ToList();
        if (missing.Count > 0)
        {
            foreach (var roleToSeed in missing)
            {
                dbContext.Roles.Add(new BankingSystem.Api.Models.Auth.Role
                {
                    RoleId = Guid.NewGuid(),
                    RoleName = roleToSeed.Name,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
            await dbContext.SaveChangesAsync();
            app.Logger.LogInformation("Seeded default authentication roles: {Roles}", string.Join(", ", missing.Select(m => m.Name)));
        }

        // Ensure Banking.TransferOtpSessions table exists
        await dbContext.Database.ExecuteSqlRawAsync(@"
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TransferOtpSessions' AND schema_id = SCHEMA_ID('Banking'))
            BEGIN
                CREATE TABLE [Banking].[TransferOtpSessions] (
                    [SessionId] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
                    [UserId] UNIQUEIDENTIFIER NOT NULL,
                    [FromAccountId] UNIQUEIDENTIFIER NOT NULL,
                    [ToAccountId] UNIQUEIDENTIFIER NOT NULL,
                    [Amount] DECIMAL(19,4) NOT NULL,
                    [IdempotencyKey] NVARCHAR(100) NOT NULL,
                    [CodeHash] BINARY(32) NOT NULL,
                    [AttemptCount] INT NOT NULL DEFAULT 0,
                    [MaxAttempts] INT NOT NULL DEFAULT 3,
                    [ExpiresAtUtc] DATETIME2(3) NOT NULL,
                    [IsConsumed] BIT NOT NULL DEFAULT 0,
                    [CreatedAtUtc] DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
                );
            END
        ");
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Could not automatically seed authentication roles or create TransferOtpSessions table on startup.");
    }
}


app.Run();

public partial class Program;
