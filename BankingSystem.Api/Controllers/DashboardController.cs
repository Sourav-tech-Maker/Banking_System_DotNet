using System;
using System.Threading;
using System.Threading.Tasks;
using BankingSystem.Api.Data;
using BankingSystem.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BankingSystem.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public sealed class DashboardController(
        AppDbContext context,
        IDashboardService dashboardService) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
        {
            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            var user = await context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var dashboardData = await dashboardService.GetDashboardDataAsync(user, cancellationToken);
            return Ok(dashboardData);
        }
    }
}
