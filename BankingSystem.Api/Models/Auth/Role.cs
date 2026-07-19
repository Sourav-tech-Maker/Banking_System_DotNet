using System;
using System.Collections.Generic;

namespace BankingSystem.Api.Models.Auth
{
    public class Role
    {
        public Guid RoleId { get; set; }
        public string RoleName { get; set; } = null!;
        public string NormalizedRoleName { get; set; } = null!;
        public DateTime CreatedAtUtc { get; set; }

        // Navigation properties
        public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}
