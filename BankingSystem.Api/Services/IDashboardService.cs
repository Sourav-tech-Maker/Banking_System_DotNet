using System.Threading;
using System.Threading.Tasks;
using BankingSystem.Api.Models.Auth;

namespace BankingSystem.Api.Services
{
    public interface IDashboardService
    {
        Task<object> GetDashboardDataAsync(User user, CancellationToken cancellationToken);
    }
}
