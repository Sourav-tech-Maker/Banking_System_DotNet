using BankingSystem.Api.DTOs.Auth;
using FluentValidation;

namespace BankingSystem.Api.Validation;

public sealed class VerifyOtpRequestValidator : AbstractValidator<VerifyOtpRequest>
{
    public VerifyOtpRequestValidator()
    {
        RuleFor(request => request.Email)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Email and OTP are required")
            .EmailAddress().WithMessage("Please provide valid email address");

        RuleFor(request => request.Otp)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Email and OTP are required")
            .Matches(@"^\d{6}$").WithMessage("OTP must be exactly 6 digits");
    }
}
