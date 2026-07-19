using BankingSystem.Api.DTOs.Auth;
using FluentValidation;

namespace BankingSystem.Api.Validation;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    private const string RequiredMessage = "Username, email, and password are required";
    private const string PasswordMessage =
        "Password must be at least 8 characters long and contain uppercase, lowercase, a number, and a special character.";

    public RegisterRequestValidator()
    {
        RuleFor(request => request.Username)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(RequiredMessage)
            .MaximumLength(100).WithMessage("Username must not exceed 100 characters.");

        RuleFor(request => request.Email)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(RequiredMessage)
            .MaximumLength(256).WithMessage("Email must not exceed 256 characters.")
            .EmailAddress().WithMessage("Please provide valid email address");

        RuleFor(request => request.Password)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(RequiredMessage)
            .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$")
            .WithMessage(PasswordMessage)
            .WithErrorCode("StrongPassword");

        RuleFor(request => request.RoleAccessKey)
            .MaximumLength(512)
            .When(request => request.RoleAccessKey is not null);
    }
}
