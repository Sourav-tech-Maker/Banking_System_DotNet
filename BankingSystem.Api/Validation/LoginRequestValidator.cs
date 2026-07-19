using BankingSystem.Api.DTOs.Auth;
using FluentValidation;

namespace BankingSystem.Api.Validation;

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    private const string RequiredMessage = "Email and password are required";

    public LoginRequestValidator()
    {
        RuleFor(request => request.Email)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(RequiredMessage)
            .MaximumLength(256).WithMessage("Email must not exceed 256 characters.")
            .EmailAddress().WithMessage("Please provide valid email address");

        RuleFor(request => request.Password)
            .NotEmpty().WithMessage(RequiredMessage);
    }
}
