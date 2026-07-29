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
        "TransferOtpRequested" => CreateTransferOtpEmail(payloadJson, now),
        "RegistrationWelcomeRequested" => CreateWelcomeEmail(payloadJson),
        "NewDeviceLoginDetected" => CreateNewDeviceEmail(payloadJson),
        "KycStatusUpdated" => CreateKycEmail(payloadJson),
        "TransferDebitNotification" => CreateTransferDebitEmail(payloadJson),
        "TransferCreditNotification" => CreateTransferCreditEmail(payloadJson),
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

  private static EmailMessage? CreateTransferOtpEmail(string payloadJson, DateTime now)
  {
    var payload = Deserialize<TransferOtpPayload>(payloadJson);
    if (payload.ExpiresAtUtc <= now)
    {
      return null;
    }

    var encodedName = WebUtility.HtmlEncode(payload.Username);
    var encodedRecipient = WebUtility.HtmlEncode(payload.RecipientName ?? "Beneficiary");
    var encodedCode = WebUtility.HtmlEncode(payload.OtpCode);
    var formattedAmount = payload.Amount.ToString("N2");

    var text = $$"""
            Hello {{payload.Username}},

            Your OTP to authorize fund transfer of ₹{{formattedAmount}} to {{payload.RecipientName}} is: {{payload.OtpCode}}

            This code is valid for 5 minutes. Never share this OTP with anyone.

            If you did not initiate this transaction, please contact bank support immediately.
            """;

    var html = $$"""
            <!doctype html>
            <html lang="en">
            <body style="margin:0;padding:0;background:#f4f4f7;font-family:Segoe UI,Arial,sans-serif;color:#1f2937">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:40px 16px;background:#f4f4f7">
                <tr><td align="center">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
                    <tr><td style="padding:28px 36px;text-align:center;background:#0284c7;color:#fff">
                      <h1 style="margin:0;font-size:24px">Authorize Money Transfer</h1>
                    </td></tr>
                    <tr><td style="padding:36px">
                      <p style="margin-top:0">Hello <strong>{{encodedName}}</strong>,</p>
                      <p>You requested a transfer of <strong style="color:#0284c7;font-size:18px">₹{{formattedAmount}}</strong> to <strong>{{encodedRecipient}}</strong>.</p>
                      <p>Use the following OTP code to authorize and complete this transaction. It expires in <strong>5 minutes</strong>.</p>
                      <div style="margin:28px 0;padding:20px;text-align:center;border:2px dashed #0284c7;border-radius:12px;background:#f0f9ff">
                        <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#0369a1">{{encodedCode}}</span>
                      </div>
                      <p style="font-size:14px;color:#6b7280">Never share this OTP with anyone. If you did not initiate this transfer, secure your account immediately.</p>
                    </td></tr>
                    <tr><td style="padding:18px;text-align:center;background:#f8fafc;font-size:12px;color:#6b7280">This is an automated message. Please do not reply.</td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

    return new EmailMessage(payload.To, "OTP for Fund Transfer Authorization", text, html);
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

  private static EmailMessage CreateKycEmail(string payloadJson)
  {
    var payload = Deserialize<KycStatusPayload>(payloadJson);
    var encodedName = WebUtility.HtmlEncode(payload.Username);
    var statusLower = payload.Status.ToLowerInvariant();
    var isApproved = payload.Status == "APPROVED";

    var subject = isApproved ? "KYC Approved - YONO App" : "KYC Rejected - YONO App";
    var statusMessage = isApproved
        ? "Your KYC application has been approved. Your bank account is now fully active for transactions."
        : "Your KYC application was rejected.";

    var rejectReasonText = !isApproved && !string.IsNullOrWhiteSpace(payload.RejectReason)
        ? $"\nRejection Reason: {payload.RejectReason}\n\nYou may resubmit your KYC application after the cooldown period."
        : "";

    var rejectReasonHtml = !isApproved && !string.IsNullOrWhiteSpace(payload.RejectReason)
        ? $"<div style=\"margin:22px 0;padding:16px;border-left:4px solid #dc2626;background:#fef2f2\"><strong>Rejection Reason:</strong> {WebUtility.HtmlEncode(payload.RejectReason)}<br><br>You may resubmit your KYC application after the cooldown period.</div>"
        : "";

    var text = $$"""
            Hello {{payload.Username}},

            {{statusMessage}}
            {{rejectReasonText}}
            
            Regards,
            YONO App Team
            """;

    var html = $$"""
            <div style="max-width:600px;margin:auto;font-family:Segoe UI,Arial,sans-serif;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;color:#1f2937">
              <div style="padding:22px;text-align:center;background:#1e40af;color:#fff"><h2 style="margin:0">YONO App - KYC {{payload.Status}}</h2></div>
              <div style="padding:28px">
                <h3>Hello {{encodedName}},</h3>
                <p>{{statusMessage}}</p>
                {{rejectReasonHtml}}
                <p>Regards,<br><strong>YONO App Team</strong></p>
              </div>
            </div>
            """;

    return new EmailMessage(payload.To, subject, text, html);
  }

  private static EmailMessage CreateTransferDebitEmail(string payloadJson)
  {
    var payload = Deserialize<TransferDebitPayload>(payloadJson);
    var encodedName = WebUtility.HtmlEncode(payload.Username);
    var encodedAcc = WebUtility.HtmlEncode(payload.AccountNumber);
    var encodedRecipientAcc = WebUtility.HtmlEncode(payload.RecipientAccount);
    var encodedRecipientName = WebUtility.HtmlEncode(payload.RecipientName ?? "Beneficiary Account");
    var encodedRef = WebUtility.HtmlEncode(payload.TransactionRef);

    var formattedAmount = payload.Amount.ToString("N2");
    var formattedBalance = payload.CurrentBalance.ToString("N2");
    var formattedDate = payload.OccurredAtUtc.ToString("dd MMM yyyy, hh:mm tt") + " UTC";

    var subject = $"Debit Alert: ₹{formattedAmount} debited from A/c #{encodedAcc}";

    var text = $$"""
            Hello {{payload.Username}},

            An amount of ₹{{formattedAmount}} has been debited from your account.

            Account No: {{payload.AccountNumber}}
            Transferred To: {{payload.RecipientAccount}} ({{payload.RecipientName}})
            Amount Debited: ₹{{formattedAmount}}
            Updated Balance: ₹{{formattedBalance}}
            Transaction ID: {{payload.TransactionRef}}
            Date & Time: {{formattedDate}}

            Regards,
            YONO App Team
            """;

    var html = $$"""
            <div style="max-width:600px;margin:auto;font-family:'Segoe UI',Arial,sans-serif;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;color:#0f172a;background:#ffffff">
              <div style="padding:24px;text-align:center;background:#dc2626;color:#ffffff">
                <h2 style="margin:0;font-size:20px;font-weight:700">Debit Notification</h2>
              </div>
              <div style="padding:28px">
                <p style="margin-top:0;font-size:15px">Hello <strong>{{encodedName}}</strong>,</p>
                <p style="font-size:14px;color:#334155">An amount of <strong style="color:#dc2626;font-size:18px">₹{{formattedAmount}}</strong> has been debited from your account.</p>

                <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f8fafc;border-radius:8px;font-size:13px">
                  <tr><td style="padding:10px 14px;color:#64748b;border-bottom:1px solid #e2e8f0">Account Number</td><td style="padding:10px 14px;font-weight:600;text-align:right;border-bottom:1px solid #e2e8f0">#{{encodedAcc}}</td></tr>
                  <tr><td style="padding:10px 14px;color:#64748b;border-bottom:1px solid #e2e8f0">Transferred To</td><td style="padding:10px 14px;font-weight:600;text-align:right;border-bottom:1px solid #e2e8f0">#{{encodedRecipientAcc}} ({{encodedRecipientName}})</td></tr>
                  <tr><td style="padding:10px 14px;color:#64748b;border-bottom:1px solid #e2e8f0">Amount Debited</td><td style="padding:10px 14px;font-weight:700;color:#dc2626;text-align:right;border-bottom:1px solid #e2e8f0">₹{{formattedAmount}}</td></tr>
                  <tr><td style="padding:10px 14px;color:#64748b;border-bottom:1px solid #e2e8f0">Available Balance</td><td style="padding:10px 14px;font-weight:700;color:#0f172a;text-align:right;border-bottom:1px solid #e2e8f0">₹{{formattedBalance}}</td></tr>
                  <tr><td style="padding:10px 14px;color:#64748b;border-bottom:1px solid #e2e8f0">Transaction ID</td><td style="padding:10px 14px;font-family:monospace;text-align:right;border-bottom:1px solid #e2e8f0">{{encodedRef}}</td></tr>
                  <tr><td style="padding:10px 14px;color:#64748b">Date &amp; Time</td><td style="padding:10px 14px;text-align:right">{{formattedDate}}</td></tr>
                </table>

                <p style="font-size:12px;color:#64748b;margin-bottom:0">If you did not authorize this transaction, please contact banking security immediately.</p>
              </div>
              <div style="padding:16px;text-align:center;background:#f1f5f9;font-size:12px;color:#64748b">
                Regards, <strong>YONO App Security Team</strong>
              </div>
            </div>
            """;

    return new EmailMessage(payload.To, subject, text, html);
  }

  private static EmailMessage CreateTransferCreditEmail(string payloadJson)
  {
    var payload = Deserialize<TransferCreditPayload>(payloadJson);
    var encodedName = WebUtility.HtmlEncode(payload.Username);
    var encodedAcc = WebUtility.HtmlEncode(payload.AccountNumber);
    var encodedSenderAcc = WebUtility.HtmlEncode(payload.SenderAccount);
    var encodedSenderName = WebUtility.HtmlEncode(payload.SenderName ?? "System / Sender Account");
    var encodedRef = WebUtility.HtmlEncode(payload.TransactionRef);

    var formattedAmount = payload.Amount.ToString("N2");
    var formattedBalance = payload.CurrentBalance.ToString("N2");
    var formattedDate = payload.OccurredAtUtc.ToString("dd MMM yyyy, hh:mm tt") + " UTC";

    var subject = $"Credit Alert: ₹{formattedAmount} credited to A/c #{encodedAcc}";

    var text = $$"""
            Hello {{payload.Username}},

            Great news! An amount of ₹{{formattedAmount}} has been credited to your account.

            Account No: {{payload.AccountNumber}}
            Received From: {{payload.SenderAccount}} ({{payload.SenderName}})
            Amount Credited: ₹{{formattedAmount}}
            Updated Balance: ₹{{formattedBalance}}
            Transaction ID: {{payload.TransactionRef}}
            Date & Time: {{formattedDate}}

            Regards,
            YONO App Team
            """;

    var html = $$"""
            <div style="max-width:600px;margin:auto;font-family:'Segoe UI',Arial,sans-serif;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;color:#0f172a;background:#ffffff">
              <div style="padding:24px;text-align:center;background:#16a34a;color:#ffffff">
                <h2 style="margin:0;font-size:20px;font-weight:700">Credit Notification</h2>
              </div>
              <div style="padding:28px">
                <p style="margin-top:0;font-size:15px">Hello <strong>{{encodedName}}</strong>,</p>
                <p style="font-size:14px;color:#334155">An amount of <strong style="color:#16a34a;font-size:18px">₹{{formattedAmount}}</strong> has been credited to your account.</p>

                <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f8fafc;border-radius:8px;font-size:13px">
                  <tr><td style="padding:10px 14px;color:#64748b;border-bottom:1px solid #e2e8f0">Account Number</td><td style="padding:10px 14px;font-weight:600;text-align:right;border-bottom:1px solid #e2e8f0">#{{encodedAcc}}</td></tr>
                  <tr><td style="padding:10px 14px;color:#64748b;border-bottom:1px solid #e2e8f0">Received From</td><td style="padding:10px 14px;font-weight:600;text-align:right;border-bottom:1px solid #e2e8f0">#{{encodedSenderAcc}} ({{encodedSenderName}})</td></tr>
                  <tr><td style="padding:10px 14px;color:#64748b;border-bottom:1px solid #e2e8f0">Amount Credited</td><td style="padding:10px 14px;font-weight:700;color:#16a34a;text-align:right;border-bottom:1px solid #e2e8f0">₹{{formattedAmount}}</td></tr>
                  <tr><td style="padding:10px 14px;color:#64748b;border-bottom:1px solid #e2e8f0">Available Balance</td><td style="padding:10px 14px;font-weight:700;color:#0f172a;text-align:right;border-bottom:1px solid #e2e8f0">₹{{formattedBalance}}</td></tr>
                  <tr><td style="padding:10px 14px;color:#64748b;border-bottom:1px solid #e2e8f0">Transaction ID</td><td style="padding:10px 14px;font-family:monospace;text-align:right;border-bottom:1px solid #e2e8f0">{{encodedRef}}</td></tr>
                  <tr><td style="padding:10px 14px;color:#64748b">Date &amp; Time</td><td style="padding:10px 14px;text-align:right">{{formattedDate}}</td></tr>
                </table>
              </div>
              <div style="padding:16px;text-align:center;background:#f1f5f9;font-size:12px;color:#64748b">
                Regards, <strong>YONO App Team</strong>
              </div>
            </div>
            """;

    return new EmailMessage(payload.To, subject, text, html);
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

  private sealed record KycStatusPayload(
      string To,
      string Username,
      string Status,
      string? RejectReason);

  private sealed record TransferDebitPayload(
      string To,
      string Username,
      string AccountNumber,
      decimal Amount,
      string RecipientAccount,
      string? RecipientName,
      string TransactionRef,
      decimal CurrentBalance,
      DateTime OccurredAtUtc);

  private sealed record TransferCreditPayload(
      string To,
      string Username,
      string AccountNumber,
      decimal Amount,
      string SenderAccount,
      string? SenderName,
      string TransactionRef,
      decimal CurrentBalance,
      DateTime OccurredAtUtc);

  private sealed record TransferOtpPayload(
      string To,
      string Username,
      string? RecipientName,
      decimal Amount,
      string OtpCode,
      DateTime ExpiresAtUtc);
}

