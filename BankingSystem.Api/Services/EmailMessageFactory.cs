using System.Net;
using System.Text.Json;

namespace BankingSystem.Api.Services;

internal static class EmailMessageFactory
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public static EmailMessage? Create(string eventType, string payloadJson, DateTime now) =>
        eventType switch
        {
            "EmailVerificationRequested" => CreateOtpEmail(payloadJson, now, isBeneficiary: false),
            "BeneficiaryVerificationRequested" => CreateOtpEmail(payloadJson, now, isBeneficiary: true),
            "RegistrationWelcomeRequested" => CreateWelcomeEmail(payloadJson),
            "NewDeviceLoginDetected" => CreateNewDeviceEmail(payloadJson),
            _ => throw new InvalidOperationException(
                $"Unsupported email event type '{eventType}'.")
        };

    private static EmailMessage? CreateOtpEmail(string payloadJson, DateTime now, bool isBeneficiary)
    {
        var payload = Deserialize<EmailVerificationPayload>(payloadJson);
        if (payload.ExpiresAtUtc <= now)
        {
            return null;
        }

        var encodedName = WebUtility.HtmlEncode(payload.Username);
        var encodedCode = WebUtility.HtmlEncode(payload.VerificationCode);
        var emailTitle = isBeneficiary ? "Beneficiary verification" : "Email verification";
        var verificationPurpose = isBeneficiary
            ? "beneficiary verification"
            : "email verification";
        var instruction = isBeneficiary
            ? "Use this code to approve and add the beneficiary."
            : "Use this code to finish registering your YONO App account.";
        var ignoreMessage = isBeneficiary
            ? "If you did not request this beneficiary, secure your account immediately."
            : "If you did not create this account, you can safely ignore this email.";
        var text = $$"""
            Hello {{payload.Username}},

            Your YONO App {{verificationPurpose}} code is: {{payload.VerificationCode}}

            This code is valid for 10 minutes. Never share this OTP with anyone.

            {{ignoreMessage}}
            """;
        var html = $$"""
            <!doctype html>
            <html lang="en">
            <body style="margin:0;padding:0;background:#f4f4f7;font-family:Segoe UI,Arial,sans-serif;color:#1f2937">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:40px 16px;background:#f4f4f7">
                <tr><td align="center">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
                    <tr><td style="padding:28px 36px;text-align:center;background:#4f46e5;color:#fff">
                      <h1 style="margin:0;font-size:24px">{{emailTitle}}</h1>
                    </td></tr>
                    <tr><td style="padding:36px">
                      <p style="margin-top:0">Hello <strong>{{encodedName}}</strong>,</p>
                      <p>{{instruction}} It expires in <strong>10 minutes</strong>.</p>
                      <div style="margin:28px 0;padding:20px;text-align:center;border:2px dashed #6366f1;border-radius:12px;background:#eef2ff">
                        <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#4338ca">{{encodedCode}}</span>
                      </div>
                      <p style="font-size:14px;color:#6b7280">Never share this OTP with anyone. {{ignoreMessage}}</p>
                    </td></tr>
                    <tr><td style="padding:18px;text-align:center;background:#f8fafc;font-size:12px;color:#6b7280">This is an automated message. Please do not reply.</td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

        return new EmailMessage(
            payload.To,
            isBeneficiary ? "Verify Your Beneficiary" : "Verify Your Email",
            text,
            html);
    }

    private static EmailMessage CreateWelcomeEmail(string payloadJson)
    {
        var payload = Deserialize<WelcomePayload>(payloadJson);
        var encodedName = WebUtility.HtmlEncode(payload.Username);
        var text = $$"""
            Dear {{payload.Username}},

            Welcome to YONO App. Your email has been verified and your account is ready to use.

            Never share your password or OTP with anyone.

            Regards,
            YONO App Team
            """;
        var html = $$"""
            <div style="max-width:600px;margin:auto;font-family:Segoe UI,Arial,sans-serif;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;color:#1f2937">
              <div style="padding:22px;text-align:center;background:#1e40af;color:#fff"><h2 style="margin:0">YONO App</h2></div>
              <div style="padding:28px">
                <h3>Hello {{encodedName}},</h3>
                <p>Welcome to YONO App. Your email has been <strong>verified</strong> and your account is ready to use.</p>
                <div style="margin:22px 0;padding:16px;border-left:4px solid #1e40af;background:#f8fafc">Never share your password or OTP with anyone.</div>
                <p>Regards,<br><strong>YONO App Team</strong></p>
              </div>
            </div>
            """;

        return new EmailMessage(
            payload.To,
            "Welcome to YONO App - Registration Successful",
            text,
            html);
    }

    private static EmailMessage CreateNewDeviceEmail(string payloadJson)
    {
        var payload = Deserialize<NewDevicePayload>(payloadJson);
        var encodedName = WebUtility.HtmlEncode(payload.Username);
        var encodedIp = WebUtility.HtmlEncode(payload.IpAddress);
        var encodedDevice = WebUtility.HtmlEncode(payload.UserAgent);
        var occurredAt = payload.OccurredAtUtc.ToString("u");
        var text = $$"""
            Hello {{payload.Username}},

            Your account was logged in from a new device.
            IP address: {{payload.IpAddress}}
            Device: {{payload.UserAgent}}
            Time: {{occurredAt}}

            If this was not you, change your password immediately.
            """;
        var html = $$"""
            <div style="max-width:600px;margin:auto;font-family:Segoe UI,Arial,sans-serif;color:#1f2937">
              <h2>New device login</h2>
              <p>Hello <strong>{{encodedName}}</strong>,</p>
              <p>Your account was logged in from a new device.</p>
              <table style="width:100%;border-collapse:collapse;background:#f8fafc">
                <tr><td style="padding:8px"><strong>IP address</strong></td><td style="padding:8px">{{encodedIp}}</td></tr>
                <tr><td style="padding:8px"><strong>Device</strong></td><td style="padding:8px">{{encodedDevice}}</td></tr>
                <tr><td style="padding:8px"><strong>Time</strong></td><td style="padding:8px">{{occurredAt}}</td></tr>
              </table>
              <p>If this was not you, change your password immediately.</p>
            </div>
            """;

        return new EmailMessage(payload.To, "New Device Login Detected", text, html);
    }

    private static T Deserialize<T>(string payloadJson)
    {
        var payload = JsonSerializer.Deserialize<T>(payloadJson, SerializerOptions);
        return payload ?? throw new InvalidOperationException(
            $"Could not deserialize outbox payload as {typeof(T).Name}.");
    }

    private sealed record EmailVerificationPayload(
        string To,
        string Username,
        string VerificationCode,
        DateTime ExpiresAtUtc);

    private sealed record WelcomePayload(string To, string Username);

    private sealed record NewDevicePayload(
        string To,
        string Username,
        string IpAddress,
        string UserAgent,
        DateTime OccurredAtUtc);
}
