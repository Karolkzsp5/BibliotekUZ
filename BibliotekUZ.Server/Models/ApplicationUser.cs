using Microsoft.AspNetCore.Identity;

namespace BibliotekUZ.Server.Models;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public string LibraryCardNumber { get; set; } = string.Empty;
    public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;
    public bool IsBlocked { get; set; } = false;

    public string FullName => $"{FirstName} {LastName}";

    public ICollection<Loan> Loans { get; set; } = [];
    public ICollection<WaitlistEntry> WaitlistEntries { get; set; } = [];
}
