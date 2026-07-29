using BankingSystem.Api.Data;
using BankingSystem.Api.DTOs.Goal;
using BankingSystem.Api.Models.Savings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BankingSystem.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class GoalsController(AppDbContext context, TimeProvider timeProvider) : ControllerBase
{
        [HttpPost]
        public async Task<IActionResult> CreateGoal(
            [FromBody] CreateGoalRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.Title) ||
                string.IsNullOrWhiteSpace(request.Category) ||
                request.TargetAmount <= 0 ||
                request.TargetDate == DateTime.MinValue)
            {
                return BadRequest(new { message = "All fields are required (title, category, targetAmount, targetDate)." });
            }

            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            var now = timeProvider.GetUtcNow().UtcDateTime;

            if (request.TargetDate <= now)
            {
                return BadRequest(new { message = "Target date must be in the future." });
            }

            var trimmedTitle = request.Title.Trim();

            // Check if goal with title exists for user
            var titleExists = await context.SavingsGoals
                .AnyAsync(g => g.UserId == userId && g.Title == trimmedTitle && !g.IsArchived, cancellationToken);

            if (titleExists)
            {
                return Conflict(new { message = $"A savings goal titled '{trimmedTitle}' already exists. Please enter a unique title." });
            }

            var goal = new SavingsGoal
            {
                SavingsGoalId = Guid.NewGuid(),
                UserId = userId,
                Title = trimmedTitle,
                Category = request.Category.Trim(),
                TargetAmount = request.TargetAmount,
                TargetDateUtc = request.TargetDate.ToUniversalTime(),
                IsArchived = false,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };


            context.SavingsGoals.Add(goal);

            var initialAmount = request.CurrentAmount ?? 0;
            if (initialAmount > 0)
            {
                var contribution = new SavingsContribution
                {
                    SavingsGoalId = goal.SavingsGoalId,
                    Amount = initialAmount,
                    ContributionType = "MANUAL",
                    CreatedAtUtc = now
                };
                context.SavingsContributions.Add(contribution);
            }

            await context.SaveChangesAsync(cancellationToken);

            // Fetch the view progress to return correct virtual fields
            var progressView = await context.SavingsGoalProgressViews
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.SavingsGoalId == goal.SavingsGoalId, cancellationToken);

            return StatusCode(StatusCodes.Status201Created, new
            {
                success = true,
                message = "Goal created successfully.",
                goal = MapProgressView(progressView!)
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetGoals(CancellationToken cancellationToken)
        {
            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            // Read from view, excluding archived/deleted goals
            var progressList = await context.SavingsGoalProgressViews
                .AsNoTracking()
                .Where(v => v.UserId == userId && v.GoalStatus != "ARCHIVED")
                .ToListAsync(cancellationToken);


            var mappedList = progressList.Select(MapProgressView).ToList();

            return Ok(new
            {
                success = true,
                goals = mappedList
            });
        }

        [HttpPost("add-amount")]
        public async Task<IActionResult> AddAmount(
            [FromBody] AddAmountRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null || request.GoalId == Guid.Empty || request.Amount <= 0)
            {
                return BadRequest(new { message = "Goal ID and amount are required." });
            }

            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            var goal = await context.SavingsGoals
                .FirstOrDefaultAsync(g => g.SavingsGoalId == request.GoalId && g.UserId == userId, cancellationToken);

            if (goal == null)
            {
                return NotFound(new { message = "Goal not found." });
            }

            var now = timeProvider.GetUtcNow().UtcDateTime;

            var contribution = new SavingsContribution
            {
                SavingsGoalId = goal.SavingsGoalId,
                Amount = request.Amount,
                ContributionType = (request.Type ?? "manual").ToUpperInvariant(),
                CreatedAtUtc = now
            };

            context.SavingsContributions.Add(contribution);
            await context.SaveChangesAsync(cancellationToken);

            // Fetch progress view
            var progressView = await context.SavingsGoalProgressViews
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.SavingsGoalId == goal.SavingsGoalId, cancellationToken);

            return Ok(new
            {
                success = true,
                message = $"Successfully added {request.Amount} to the goal.",
                goal = MapProgressView(progressView!),
                savingsLog = new
                {
                    id = contribution.SavingsContributionId,
                    goalId = contribution.SavingsGoalId,
                    amountAdded = contribution.Amount,
                    type = contribution.ContributionType.ToLowerInvariant(),
                    createdAt = contribution.CreatedAtUtc
                }
            });
        }

        [HttpGet("history/{goalId}")]
        public async Task<IActionResult> GetGoalHistory(Guid goalId, CancellationToken cancellationToken)
        {
            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            // Check if goal exists for user
            var goalExists = await context.SavingsGoals
                .AnyAsync(g => g.SavingsGoalId == goalId && g.UserId == userId, cancellationToken);

            if (!goalExists)
            {
                return NotFound(new { message = "Goal not found." });
            }

            var contributions = await context.SavingsContributions
                .AsNoTracking()
                .Where(c => c.SavingsGoalId == goalId)
                .OrderByDescending(c => c.CreatedAtUtc)
                .Select(c => new
                {
                    _id = c.SavingsContributionId, // Match MongoDB format expect "_id"
                    id = c.SavingsContributionId,
                    goalId = c.SavingsGoalId,
                    amountAdded = c.Amount,
                    type = c.ContributionType.ToLowerInvariant(),
                    createdAt = c.CreatedAtUtc
                })
                .ToListAsync(cancellationToken);

            return Ok(new
            {
                success = true,
                history = contributions
            });
        }

        [HttpDelete("{goalId}")]
        public async Task<IActionResult> DeleteGoal(Guid goalId, CancellationToken cancellationToken)
        {
            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            var goal = await context.SavingsGoals
                .FirstOrDefaultAsync(g => g.SavingsGoalId == goalId && g.UserId == userId && !g.IsArchived, cancellationToken);

            if (goal == null)
            {
                return NotFound(new { message = "Goal not found." });
            }

            // Soft-delete goal to preserve immutable contribution audit records
            goal.IsArchived = true;
            goal.UpdatedAtUtc = timeProvider.GetUtcNow().UtcDateTime;
            await context.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                success = true,
                message = "Goal deleted successfully."
            });
        }


        private static dynamic MapProgressView(SavingsGoalProgressView? v)
        {
            if (v == null)
            {
                return new
                {
                    _id = Guid.Empty,
                    id = Guid.Empty,
                    title = "",
                    category = "",
                    targetAmount = 0m,
                    currentAmount = 0m,
                    remainingAmount = 0m,
                    progressPercentage = 0m,
                    status = "active",
                    targetDate = DateTime.UtcNow,
                    createdAt = DateTime.UtcNow,
                    updatedAt = DateTime.UtcNow
                };
            }

            return new
            {
                _id = v.SavingsGoalId, // Match MongoDB format
                id = v.SavingsGoalId,
                userId = v.UserId,
                title = v.Title ?? "",
                category = v.Category ?? "",
                targetAmount = v.TargetAmount,
                currentAmount = v.CurrentAmount,
                remainingAmount = v.RemainingAmount,
                progressPercentage = v.ProgressPercentage,
                status = (v.GoalStatus ?? "ACTIVE").ToLowerInvariant(),
                targetDate = v.TargetDateUtc,
                createdAt = v.CreatedAtUtc,
                updatedAt = v.UpdatedAtUtc
            };
        }

    }
