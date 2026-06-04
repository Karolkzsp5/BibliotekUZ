using System.Security.Claims;
using BibliotekUZ.Server.Data;
using BibliotekUZ.Server.DTOs;
using BibliotekUZ.Server.Models;
using BibliotekUZ.Server.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BibliotekUZ.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController(
    UserManager<ApplicationUser> userManager,
    ApplicationDbContext db,
    IOptions<LoanSettings> loanOptions) : ControllerBase
{
    private LoanSettings Settings => loanOptions.Value;

    [HttpGet]
    [Authorize(Policy = "LibrarianOnly")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await userManager.Users
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                u.LibraryCardNumber,
                u.IsBlocked
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPut("{id}/block")]
    [Authorize(Policy = "LibrarianOnly")]
    public async Task<IActionResult> ToggleBlock(string id, [FromBody] bool isBlocked)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        user.IsBlocked = isBlocked;
        await userManager.UpdateAsync(user);

        return NoContent();
    }

    [HttpGet("{id}/loans")]
    [Authorize(Policy = "LibrarianOnly")]
    public async Task<IActionResult> GetUserLoans(string id)
    {
        var loans = await db.Loans
            .Include(l => l.Copy).ThenInclude(c => c.Book)
            .Include(l => l.User)
            .Where(l => l.UserId == id)
            .OrderByDescending(l => l.BorrowedAt)
            .Select(l => new LoanDto(
                l.Id, l.CopyId, l.Copy.BookId, l.Copy.Book.Title,
                l.UserId, l.User.Email!,
                l.BorrowedAt, l.DueDate, l.ReturnedAt,
                l.FineAmount, l.IsFinePaid,
                l.ReturnedAt == null && DateTime.UtcNow > l.DueDate))
            .ToListAsync();

        return Ok(loans);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        var roles = await userManager.GetRolesAsync(user);

        var loans = await db.Loans
            .Where(l => l.UserId == userId)
            .ToListAsync();

        var now = DateTime.UtcNow;

        var activeLoansCount = loans.Count(l => l.ReturnedAt == null);

        var hasOverdue = loans.Any(l => l.ReturnedAt == null && now > l.DueDate);

        var staticFines = loans.Where(l => !l.IsFinePaid).Sum(l => l.FineAmount);

        var dynamicFines = loans
            .Where(l => l.ReturnedAt == null && now > l.DueDate)
            .Sum(l => ((int)(now - l.DueDate).TotalDays) * Settings.FinePerDay);

        var profile = new
        {
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.LibraryCardNumber,
            IsBlocked = user.IsBlocked || hasOverdue,
            Roles = roles,
            ActiveLoansCount = activeLoansCount,
            UnpaidFinesTotal = staticFines + dynamicFines
        };

        return Ok(profile);
    }
}