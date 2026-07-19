using System;

namespace BankingSystem.Api.Models.Auth
{
    public class UserRole
    {
        public Guid UserId { get; set; }
        public Guid RoleId { get; set; }
        public DateTime AssignedAtUtc { get; set; }
        public Guid? AssignedByUserId { get; set; }

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual Role Role { get; set; } = null!;
        public virtual User? AssignedByUser { get; set; }
    }
}
