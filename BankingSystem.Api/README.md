# BankingSystem.Api

ASP.NET Core Web API implementation of the existing Express registration and login flows. No account, KYC, beneficiary, savings, dashboard, transfer, ledger, or administration endpoints are included yet.

## Prerequisites

1. In SSMS, run the canonical scripts in `../Database` in numbered order.
2. Confirm that the `YonoBank` database is accessible through Windows authentication, or replace the connection string.
3. Store real secrets outside source control:

```powershell
dotnet user-secrets set "Jwt:SigningKey" "replace-with-at-least-32-random-bytes"
dotnet user-secrets set "Rbac:RegistrationKey" "replace-with-a-private-rbac-key"
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Database=YonoBank;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True"
```

### Configure OTP email delivery

The API dispatches registration OTP, welcome, and new-device emails from the
transactional outbox. For Gmail OAuth2 (the same credential style used by the
Express backend), configure:

```powershell
dotnet user-secrets set "Email:Enabled" "true"
dotnet user-secrets set "Email:FromEmail" "your-address@gmail.com"
dotnet user-secrets set "Email:Username" "your-address@gmail.com"
dotnet user-secrets set "Email:OAuth2:ClientId" "your-google-client-id"
dotnet user-secrets set "Email:OAuth2:ClientSecret" "your-google-client-secret"
dotnet user-secrets set "Email:OAuth2:RefreshToken" "your-google-refresh-token"
```

Alternatively, use a Gmail app password and omit the OAuth2 values:

```powershell
dotnet user-secrets set "Email:Enabled" "true"
dotnet user-secrets set "Email:FromEmail" "your-address@gmail.com"
dotnet user-secrets set "Email:Username" "your-address@gmail.com"
dotnet user-secrets set "Email:Password" "your-16-character-app-password"
```

Run these commands from the `BankingSystem.Api` directory. Do not put real mail
credentials in `appsettings.json`. Other SMTP providers can be used by changing
`Email:Host`, `Email:Port`, and `Email:SocketSecurity`.

For Gmail, `Email:FromEmail` must normally be the same account as
`Email:Username`. If it is intentionally different, first add and verify it in
Gmail's **Accounts and Import > Send mail as** settings, then set
`Email:AllowSenderAlias` to `true`. A normal Google account password is not an
app password; use a Google app password, or use OAuth2 with a refresh token
issued for the configured username and Gmail mail scope.

On startup the API logs the SMTP host, sender, and authentication mode (never the
secret). Delivery failures are stored on the outbox row. This query is the
fastest way to distinguish configuration failures from accepted messages:

```sql
SELECT TOP (50)
    [OutboxMessageId], [EventType], [AttemptCount], [NextAttemptAtUtc], [LastError]
FROM [Integration].[OutboxMessages]
WHERE [ProcessedAtUtc] IS NULL
ORDER BY [OccurredAtUtc] DESC;
```

If `LastError` reports authentication failure, confirm the username/app-password
pair and rotate any credential that was previously committed. If no outbox row
exists, confirm that the numbered database scripts were applied to the same
database named by `ConnectionStrings:DefaultConnection`. Check spam only after
`ProcessedAtUtc` is non-null, which means the SMTP server accepted the message.

The values in `appsettings.Development.json` are development-only placeholders. Production must supply configuration through environment variables, Key Vault, or another secret provider. For environment variables, use double underscores, for example `Jwt__SigningKey`.

## Run

```powershell
dotnet restore
dotnet run --launch-profile https
```

The HTTPS launch profile listens on `https://localhost:7039`. The API permits credentialed CORS requests from `http://localhost:5173` by default.

## Implemented API surface

- `POST /api/auth/register`
- `POST /api/auth/verify-otp`
- `POST /api/auth/resend-otp`
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`

Registration and login preserve the Express request fields, response shapes, status messages, role/RBAC checks, email-verification requirement, account-status checks, five-attempt lockout, 15-minute JWT access token, seven-day session, and `token`/`refreshToken` HTTP-only cookies.

Refresh tokens are opaque cryptographic values. Only SHA-256 hashes are stored in `Auth.RefreshSessions`; refresh rotates the token and revokes the preceding session. Logout revokes the refresh session and records the access-token hash in `Auth.RevokedAccessTokens`.

Registration verification, welcome, and new-device notifications are written to
`Integration.OutboxMessages` in the same SQL transaction as their domain changes.
The hosted email dispatcher claims pending messages, sends them through SMTP, and
retries transient failures with exponential backoff. Expired OTP messages are not
sent. The welcome message is queued only after successful email verification, so
an unverified or mistyped address is not welcomed as an active account.

OTP resend returns the same response for unknown, verified, and unverified email addresses to prevent account discovery. It invalidates earlier open challenges, has a one-minute per-account cooldown, and is limited to five requests per IP every 15 minutes.

## Architecture notes

- Controllers handle HTTP concerns and compatibility responses.
- FluentValidation validates incoming DTOs.
- `AuthService` owns registration/login workflows and SQL transactions.
- `TokenService` owns JWT creation, opaque refresh-token generation, hashing, and validation.
- `AppDbContext` maps the existing normalized SQL schema; it does not create or migrate the database automatically.
- EF Core already provides repository and unit-of-work behavior, so an extra repository abstraction was not added for these workflows.
- The global exception middleware returns safe API messages and logs structured diagnostic context.
