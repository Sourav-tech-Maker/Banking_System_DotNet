using BankingSystem.Api.DTOs.Auth;
using FluentValidation;

namespace BankingSystem.Api.Validation;

public sealed class ResendOtpRequestValidator : AbstractValidator<ResendOtpRequest>
{
    public ResendOtpRequestValidator()
    {
        RuleFor(request => request.Email)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Email is required")
            .MaximumLength(256).WithMessage("Email must not exceed 256 characters.")
            .EmailAddress().WithMessage("Please provide valid email address");
    }
}
