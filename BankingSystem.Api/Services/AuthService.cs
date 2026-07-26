using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using BankingSystem.Api.Data;
using BankingSystem.Api.DTOs.Auth;
using BankingSystem.Api.Middleware;
using BankingSystem.Api.Models.Auth;
using BankingSystem.Api.Models.Integration;
using BankingSystem.Api.Options;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BankingSystem.Api.Services;

public sealed class AuthService(
    AppDbContext context,
    ITokenService tokenService,
    IOptions<RbacOptions> rbacOptions,
    TimeProvider timeProvider,
    ILogger<AuthService> logger) : IAuthService
{
    private const string UserRole = "user";
    private const string AdminRole = "admin";
    private const string SystemUserRole = "systemUser";

    public async Task<RegisterResponse> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var requestedRole = GetRequestedRole(request.Role);
        ValidateElevatedRoleKey(
            requestedRole,
            request.RoleAccessKey,
            "A valid RBAC registration key is required for admin or system user registration.");

        var username = request.Username.Trim();
        var email = request.Email.Trim().ToLowerInvariant();
        var normalizedUsername = username.ToUpperInvariant();
        var normalizedEmail = email.ToUpperInvariant();
        var now = timeProvider.GetUtcNow().UtcDateTime;

        try
        {
            await using var transaction = await context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            var userExists = await context.Users.AnyAsync(
                user => user.NormalizedUserName == normalizedUsername
                    || user.NormalizedEmail == normalizedEmail,
                cancellationToken);

            if (userExists)
            {
                throw new ApiException(StatusCodes.Status409Conflict, "User already exists");
            }

            var normalizedRole = requestedRole.ToUpperInvariant();
            var role = await context.Roles.SingleOrDefaultAsync(
                item => item.NormalizedRoleName == normalizedRole,
                cancellationToken);

            if (role is null)
            {
                var standardRoles = new (string RoleName, string Normalized)[]
                {
                    ("user", "USER"),
                    ("admin", "ADMIN"),
                    ("systemUser", "SYSTEMUSER")
                };

                foreach (var (rName, rNorm) in standardRoles)
                {
                    var exists = await context.Roles.AnyAsync(
                        item => item.NormalizedRoleName == rNorm,
                        cancellationToken);

                    if (!exists)
                    {
                        context.Roles.Add(new Role
                        {
                            RoleId = Guid.NewGuid(),
                            RoleName = rName,
                            CreatedAtUtc = now
                        });
                    }
                }

                await context.SaveChangesAsync(cancellationToken);

                role = await context.Roles.SingleOrDefaultAsync(
                    item => item.NormalizedRoleName == normalizedRole,
                    cancellationToken);

                if (role is null)
                {
                    throw new ApiException(
                        StatusCodes.Status500InternalServerError,
                        "Failed to initialize authentication roles in database.");
                }
            }

            var user = new User
            {
                UserId = Guid.NewGuid(),
                UserName = username,
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12),
                EmailVerified = false,
                UserStatus = "ACTIVE",
                LoginAttempts = 0,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

            var verificationCode = RandomNumberGenerator.GetInt32(100_000, 1_000_000).ToString();
            var verificationExpiry = now.AddMinutes(10);

            context.Users.Add(user);
            context.UserRoles.Add(new UserRole
            {
                UserId = user.UserId,
                RoleId = role.RoleId,
                AssignedAtUtc = now
            });
            context.VerificationChallenges.Add(new VerificationChallenge
            {
                ChallengeId = Guid.NewGuid(),
                UserId = user.UserId,
                SubjectEmail = email,
                Purpose = "EMAIL_VERIFICATION",
                CodeHash = tokenService.HashToken(verificationCode),
                AttemptCount = 0,
                MaximumAttempts = 5,
                ExpiresAtUtc = verificationExpiry,
                CreatedAtUtc = now
            });
            context.OutboxMessages.Add(CreateOutboxMessage(
                "EmailVerificationRequested",
                user.UserId,
                new
                {
                    to = email,
                    username,
                    verificationCode,
                    expiresAtUtc = verificationExpiry
                },
                now));

            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            logger.LogInformation(
                "Registered user {UserId} with role {Role} and queued verification email.",
                user.UserId,
                requestedRole);

            return new RegisterResponse(
                "User registered successfully. Your OTP email has been queued for delivery.",
                new RegisteredUserResponse(user.UserId, user.UserName, user.Email, requestedRole));
        }
        catch (DbUpdateException exception) when (IsUniqueConstraintViolation(exception))
        {
            throw new ApiException(StatusCodes.Status409Conflict, "User already exists");
        }
    }

    public async Task VerifyOtpAsync(
        VerifyOtpRequest request,
        CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var now = timeProvider.GetUtcNow().UtcDateTime;

        await using var transaction = await context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var challenges = await context.VerificationChallenges
            .FromSqlInterpolated($$"""
                SELECT TOP (1) *
                FROM [Auth].[VerificationChallenges] WITH (UPDLOCK, HOLDLOCK)
                WHERE [SubjectEmail] = {{email}}
                  AND [Purpose] = N'EMAIL_VERIFICATION'
                  AND [ConsumedAtUtc] IS NULL
                ORDER BY [CreatedAtUtc] DESC
                """)
            .ToListAsync(cancellationToken);
        var challenge = challenges.SingleOrDefault();

        if (challenge is null)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Invalid or expired OTP");
        }

        if (challenge.ExpiresAtUtc < now)
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "OTP has expired. Please request a new one.");
        }

        var suppliedHash = tokenService.HashToken(request.Otp);
        var hashesMatch = CryptographicOperations.FixedTimeEquals(challenge.CodeHash, suppliedHash);

        if (!hashesMatch || challenge.AttemptCount >= challenge.MaximumAttempts)
        {
            challenge.AttemptCount = Math.Min(
                challenge.AttemptCount + 1,
                challenge.MaximumAttempts);
            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            throw new ApiException(StatusCodes.Status400BadRequest, "Invalid or expired OTP");
        }

        challenge.ConsumedAtUtc = now;
        var user = challenge.UserId.HasValue
            ? await context.Users.FindAsync([challenge.UserId.Value], cancellationToken)
            : null;

        if (user is null)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Invalid or expired OTP");
        }

        user.EmailVerified = true;
        user.UpdatedAtUtc = now;
        context.OutboxMessages.Add(CreateOutboxMessage(
            "RegistrationWelcomeRequested",
            user.UserId,
            new { to = user.Email, username = user.UserName },
            now));

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        logger.LogInformation("Verified email for user {UserId}.", user.UserId);
    }

    public async Task ResendOtpAsync(
        ResendOtpRequest request,
        CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var normalizedEmail = email.ToUpperInvariant();
        var now = timeProvider.GetUtcNow().UtcDateTime;

        await using var transaction = await context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var users = await context.Users
            .FromSqlInterpolated($$"""
                SELECT *
                FROM [Auth].[Users] WITH (UPDLOCK, HOLDLOCK)
                WHERE [NormalizedEmail] = {{normalizedEmail}}
                """)
            .ToListAsync(cancellationToken);
        var user = users.SingleOrDefault();

        // Always return the same public response so callers cannot use this
        // endpoint to discover whether an email address has an account.
        if (user is null
            || user.EmailVerified
            || !string.Equals(user.UserStatus, "ACTIVE", StringComparison.Ordinal))
        {
            await transaction.CommitAsync(cancellationToken);
            return;
        }

        var latestChallenge = await context.VerificationChallenges
            .Where(challenge => challenge.UserId == user.UserId
                && challenge.Purpose == "EMAIL_VERIFICATION")
            .OrderByDescending(challenge => challenge.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        // Do not issue another code more often than once per minute. The
        // generic response remains unchanged when the cooldown is active.
        if (latestChallenge is not null
            && latestChallenge.CreatedAtUtc > now.AddMinutes(-1))
        {
            await transaction.CommitAsync(cancellationToken);
            logger.LogInformation(
                "Skipped OTP resend for user {UserId} because the cooldown is active.",
                user.UserId);
            return;
        }

        var activeChallenges = await context.VerificationChallenges
            .Where(challenge => challenge.UserId == user.UserId
                && challenge.Purpose == "EMAIL_VERIFICATION"
                && challenge.ConsumedAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var challenge in activeChallenges)
        {
            challenge.ConsumedAtUtc = now;
        }

        var verificationCode = RandomNumberGenerator.GetInt32(100_000, 1_000_000).ToString();
        var verificationExpiry = now.AddMinutes(10);

        context.VerificationChallenges.Add(new VerificationChallenge
        {
            ChallengeId = Guid.NewGuid(),
            UserId = user.UserId,
            SubjectEmail = email,
            Purpose = "EMAIL_VERIFICATION",
            CodeHash = tokenService.HashToken(verificationCode),
            AttemptCount = 0,
            MaximumAttempts = 5,
            ExpiresAtUtc = verificationExpiry,
            CreatedAtUtc = now
        });
        context.OutboxMessages.Add(CreateOutboxMessage(
            "EmailVerificationRequested",
            user.UserId,
            new
            {
                to = email,
                username = user.UserName,
                verificationCode,
                expiresAtUtc = verificationExpiry
            },
            now));

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        logger.LogInformation("Issued replacement verification OTP for user {UserId}.", user.UserId);
    }

    public async Task<LoginResult> LoginAsync(
        LoginRequest request,
        string ipAddress,
        string userAgent,
        CancellationToken cancellationToken)
    {
        var requestedRole = GetRequestedRole(request.Role);
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var now = timeProvider.GetUtcNow().UtcDateTime;

        await using var transaction = await context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var users = await context.Users
            .FromSqlInterpolated($$"""
                SELECT *
                FROM [Auth].[Users] WITH (UPDLOCK, HOLDLOCK)
                WHERE [NormalizedEmail] = {{normalizedEmail}}
                """)
            .ToListAsync(cancellationToken);
        var user = users.SingleOrDefault();

        if (user is null)
        {
            throw new ApiException(StatusCodes.Status401Unauthorized, "Email or Password is INVALID");
        }

        var normalizedRoles = await context.UserRoles
            .Where(userRole => userRole.UserId == user.UserId)
            .Select(userRole => userRole.Role.NormalizedRoleName)
            .ToListAsync(cancellationToken);
        var databaseRole = GetDatabaseRole(normalizedRoles);

        if (!string.Equals(requestedRole, databaseRole, StringComparison.Ordinal))
        {
            throw new ApiException(
                StatusCodes.Status403Forbidden,
                "Invalid role selected for this account. Please select the correct role from the dropdown.");
        }

        ValidateElevatedRoleKey(
            databaseRole,
            request.RoleAccessKey,
            "A valid RBAC registration key is required for admin or system user Login.");

        if (!user.EmailVerified)
        {
            throw new ApiException(
                StatusCodes.Status403Forbidden,
                "Please verify your email before logging in.");
        }

        if (!string.Equals(user.UserStatus, "ACTIVE", StringComparison.Ordinal))
        {
            throw new ApiException(StatusCodes.Status403Forbidden, "Your account is not active.");
        }

        if (user.LockoutEndUtc.HasValue && user.LockoutEndUtc.Value > now)
        {
            throw new ApiException(
                StatusCodes.Status403Forbidden,
                "Account temporarily locked. Try again later.");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            user.LoginAttempts += 1;
            if (user.LoginAttempts >= 5)
            {
                user.LockoutEndUtc = now.AddMinutes(15);
                user.LoginAttempts = 0;
            }

            user.UpdatedAtUtc = now;
            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            logger.LogWarning("Rejected invalid password for user {UserId}.", user.UserId);
            throw new ApiException(StatusCodes.Status401Unauthorized, "Email or Password is INVALID");
        }

        user.LoginAttempts = 0;
        user.LockoutEndUtc = null;
        user.UpdatedAtUtc = now;

        var accessToken = tokenService.CreateAccessToken(user, databaseRole);
        var refreshToken = tokenService.CreateRefreshToken();
        var safeIpAddress = Truncate(
            string.IsNullOrWhiteSpace(ipAddress) ? "127.0.0.1" : ipAddress,
            45);
        var safeUserAgent = Truncate(
            string.IsNullOrWhiteSpace(userAgent) ? "Unknown Device" : userAgent,
            512);

        var knownDevice = await context.RefreshSessions.AnyAsync(
            session => session.UserId == user.UserId
                && session.UserAgent == safeUserAgent
                && !session.IsRevoked
                && session.ExpiresAtUtc > now,
            cancellationToken);

        context.RefreshSessions.Add(new RefreshSession
        {
            SessionId = Guid.NewGuid(),
            UserId = user.UserId,
            RefreshTokenHash = refreshToken.Hash,
            IpAddress = safeIpAddress,
            UserAgent = safeUserAgent,
            IsRevoked = false,
            ExpiresAtUtc = refreshToken.ExpiresAtUtc,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        });

        if (!knownDevice)
        {
            context.OutboxMessages.Add(CreateOutboxMessage(
                "NewDeviceLoginDetected",
                user.UserId,
                new
                {
                    to = user.Email,
                    username = user.UserName,
                    ipAddress = safeIpAddress,
                    userAgent = safeUserAgent,
                    occurredAtUtc = now
                },
                now));
        }

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        logger.LogInformation(
            "User {UserId} logged in with role {Role}. NewDevice: {NewDevice}",
            user.UserId,
            databaseRole,
            !knownDevice);

        var response = new LoginResponse(
            "User logged-in successfully",
            new LoginUserResponse(user.UserId, user.UserName, user.Email, databaseRole),
            accessToken.Token);

        return new LoginResult(
            response,
            refreshToken.Token,
            accessToken.ExpiresAtUtc,
            refreshToken.ExpiresAtUtc);
    }

    public async Task<RefreshResult> RefreshTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken)
    {
        var refreshTokenHash = tokenService.HashToken(refreshToken);
        var now = timeProvider.GetUtcNow().UtcDateTime;

        await using var transaction = await context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var sessions = await context.RefreshSessions
            .FromSqlInterpolated($$"""
                SELECT *
                FROM [Auth].[RefreshSessions] WITH (UPDLOCK, HOLDLOCK)
                WHERE [RefreshTokenHash] = {{refreshTokenHash}}
                  AND [IsRevoked] = 0
                """)
            .ToListAsync(cancellationToken);
        var session = sessions.SingleOrDefault();

        if (session is null || session.ExpiresAtUtc <= now)
        {
            throw new ApiException(StatusCodes.Status401Unauthorized, "Session expired or invalid");
        }

        var user = await context.Users.SingleOrDefaultAsync(
            item => item.UserId == session.UserId,
            cancellationToken);

        if (user is null || !string.Equals(user.UserStatus, "ACTIVE", StringComparison.Ordinal))
        {
            throw new ApiException(StatusCodes.Status401Unauthorized, "User account unavailable");
        }

        var normalizedRoles = await context.UserRoles
            .Where(userRole => userRole.UserId == user.UserId)
            .Select(userRole => userRole.Role.NormalizedRoleName)
            .ToListAsync(cancellationToken);
        var databaseRole = GetDatabaseRole(normalizedRoles);
        var newAccessToken = tokenService.CreateAccessToken(user, databaseRole);
        var newRefreshToken = tokenService.CreateRefreshToken();
        var replacementSessionId = Guid.NewGuid();

        session.IsRevoked = true;
        session.RevokedAtUtc = now;
        session.RevocationReason = "ROTATED";
        session.ReplacedBySessionId = replacementSessionId;
        session.UpdatedAtUtc = now;

        context.RefreshSessions.Add(new RefreshSession
        {
            SessionId = replacementSessionId,
            UserId = user.UserId,
            RefreshTokenHash = newRefreshToken.Hash,
            IpAddress = session.IpAddress,
            UserAgent = session.UserAgent,
            IsRevoked = false,
            ExpiresAtUtc = newRefreshToken.ExpiresAtUtc,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        });

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        logger.LogInformation("Rotated refresh session for user {UserId}.", user.UserId);

        return new RefreshResult(
            newAccessToken.Token,
            newRefreshToken.Token,
            newAccessToken.ExpiresAtUtc,
            newRefreshToken.ExpiresAtUtc);
    }

    public async Task LogoutAsync(
        string refreshToken,
        string? accessToken,
        CancellationToken cancellationToken)
    {
        var refreshTokenHash = tokenService.HashToken(refreshToken);
        var now = timeProvider.GetUtcNow().UtcDateTime;

        await using var transaction = await context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var sessions = await context.RefreshSessions
            .FromSqlInterpolated($$"""
                SELECT *
                FROM [Auth].[RefreshSessions] WITH (UPDLOCK, HOLDLOCK)
                WHERE [RefreshTokenHash] = {{refreshTokenHash}}
                  AND [IsRevoked] = 0
                """)
            .ToListAsync(cancellationToken);
        var session = sessions.SingleOrDefault();

        if (session is not null)
        {
            session.IsRevoked = true;
            session.RevokedAtUtc = now;
            session.RevocationReason = "USER_LOGOUT";
            session.UpdatedAtUtc = now;
        }

        if (!string.IsNullOrWhiteSpace(accessToken)
            && tokenService.TryValidateAccessToken(accessToken, out var metadata)
            && metadata is not null
            && metadata.ExpiresAtUtc > now)
        {
            var accessTokenHash = tokenService.HashToken(accessToken);
            var alreadyRevoked = await context.RevokedAccessTokens.AnyAsync(
                token => token.TokenHash.SequenceEqual(accessTokenHash),
                cancellationToken);

            if (!alreadyRevoked)
            {
                context.RevokedAccessTokens.Add(new RevokedAccessToken
                {
                    TokenHash = accessTokenHash,
                    JwtId = metadata.JwtId,
                    UserId = metadata.UserId,
                    ExpiresAtUtc = metadata.ExpiresAtUtc,
                    RevokedAtUtc = now
                });
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        logger.LogInformation(
            "Revoked authentication session for user {UserId}.",
            session?.UserId);
    }

    private static string GetRequestedRole(string? role)
    {
        if (string.Equals(role, AdminRole, StringComparison.OrdinalIgnoreCase))
        {
            return AdminRole;
        }

        if (string.Equals(role, SystemUserRole, StringComparison.OrdinalIgnoreCase))
        {
            return SystemUserRole;
        }

        return UserRole;
    }

    private static string GetDatabaseRole(IReadOnlyCollection<string> normalizedRoles)
    {
        if (normalizedRoles.Contains("SYSTEMUSER", StringComparer.Ordinal))
        {
            return SystemUserRole;
        }

        return normalizedRoles.Contains("ADMIN", StringComparer.Ordinal)
            ? AdminRole
            : UserRole;
    }

    private void ValidateElevatedRoleKey(string role, string? suppliedKey, string message)
    {
        if (role == UserRole)
        {
            return;
        }

        var expectedKey = rbacOptions.Value.RegistrationKey;
        var suppliedBytes = Encoding.UTF8.GetBytes(suppliedKey ?? string.Empty);
        var expectedBytes = Encoding.UTF8.GetBytes(expectedKey);

        if (suppliedBytes.Length != expectedBytes.Length
            || !CryptographicOperations.FixedTimeEquals(suppliedBytes, expectedBytes))
        {
            throw new ApiException(StatusCodes.Status403Forbidden, message);
        }
    }

    private static OutboxMessage CreateOutboxMessage(
        string eventType,
        Guid aggregateId,
        object payload,
        DateTime occurredAtUtc) =>
        new()
        {
            EventType = eventType,
            AggregateType = "User",
            AggregateId = aggregateId,
            PayloadJson = JsonSerializer.Serialize(payload),
            OccurredAtUtc = occurredAtUtc,
            AttemptCount = 0
        };

    private static string Truncate(string value, int maximumLength) =>
        value.Length <= maximumLength ? value : value[..maximumLength];

    private static bool IsUniqueConstraintViolation(DbUpdateException exception) =>
        exception.InnerException is SqlException { Number: 2601 or 2627 };
}
