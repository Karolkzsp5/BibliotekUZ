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
public class LoansController(
    ApplicationDbContext db,
    UserManager<ApplicationUser> userManager,
    IOptions<LoanSettings> loanOptions) : ControllerBase
{
    private LoanSettings Settings => loanOptions.Value;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LoanDto>>> GetLoans()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var isLibrarian = User.IsInRole("Librarian");

        var query = db.Loans
            .Include(l => l.Copy).ThenInclude(c => c.Book)
            .Include(l => l.User)
            .AsQueryable();

        if (!isLibrarian)
            query = query.Where(l => l.UserId == userId);

        var loans = await query
            .OrderByDescending(l => l.BorrowedAt)
            .ToListAsync();

        return Ok(loans.Select(ToDto));
    }

    [HttpPost]
    [Authorize(Policy = "ReaderOrLibrarian")]
    public async Task<ActionResult<LoanDto>> Borrow(BorrowRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return Unauthorized();

        var hasOverdueBooks = await db.Loans.AnyAsync(l =>
        l.UserId == userId &&
        l.ReturnedAt == null &&
        DateTime.UtcNow > l.DueDate);

        if (hasOverdueBooks)
            return Conflict("Nie możesz wypożyczyć nowej książki, ponieważ masz nieoddane pozycje po terminie.");

        var activeCount = await db.Loans.CountAsync(l => l.UserId == userId && l.ReturnedAt == null);
        if (activeCount >= Settings.MaxLoansPerUser)
            return Conflict($"Loan limit of {Settings.MaxLoansPerUser} reached.");

        var copy = await db.Copies
            .Where(c => c.BookId == request.BookId && c.Status == CopyStatus.Available)
            .FirstOrDefaultAsync();
        if (copy is null)
            return Conflict("No available copies for this book.");

        copy.Status = CopyStatus.Borrowed;

        var loan = new Loan
        {
            CopyId = copy.Id,
            UserId = userId,
            BorrowedAt = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(Settings.LoanDurationDays)
        };

        db.Loans.Add(loan);
        await using var transaction = await db.Database.BeginTransactionAsync();
        try
        {
            await db.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }

        await db.Entry(loan).Reference(l => l.Copy).LoadAsync();
        await db.Entry(loan.Copy).Reference(c => c.Book).LoadAsync();
        await db.Entry(loan).Reference(l => l.User).LoadAsync();

        return CreatedAtAction(nameof(GetLoans), ToDto(loan));
    }

    [HttpPut("{id}/return")]
    [Authorize(Policy = "LibrarianOnly")]
    public async Task<ActionResult<LoanDto>> Return(int id)
    {
        var loan = await db.Loans
            .Include(l => l.Copy).ThenInclude(c => c.Book)
            .Include(l => l.User)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (loan is null) return NotFound();
        if (loan.ReturnedAt is not null) return Conflict("Already returned.");

        var now = DateTime.UtcNow;
        loan.ReturnedAt = now;

        if (now > loan.DueDate)
        {
            var overdueDays = (int)(now - loan.DueDate).TotalDays;
            loan.FineAmount = overdueDays * Settings.FinePerDay;
            loan.User.IsBlocked = true;
        }

        var nextInQueue = await db.WaitlistEntries
            .Where(w => w.BookId == loan.Copy.BookId)
            .OrderBy(w => w.Position)
            .FirstOrDefaultAsync();

        if (nextInQueue is not null)
        {
            var nextUser = await userManager.FindByIdAsync(nextInQueue.UserId);
            var nextActiveCount = await db.Loans.CountAsync(l => l.UserId == nextInQueue.UserId && l.ReturnedAt == null);

            if (nextUser is not null && !nextUser.IsBlocked && nextActiveCount < Settings.MaxLoansPerUser)
            {
                db.Loans.Add(new Loan
                {
                    CopyId = loan.CopyId,
                    UserId = nextInQueue.UserId,
                    BorrowedAt = now,
                    DueDate = now.AddDays(Settings.LoanDurationDays)
                });
                loan.Copy.Status = CopyStatus.Borrowed;
                db.WaitlistEntries.Remove(nextInQueue);

                var remaining = await db.WaitlistEntries
                    .Where(w => w.BookId == loan.Copy.BookId && w.Position > nextInQueue.Position)
                    .ToListAsync();
                foreach (var e in remaining) e.Position--;
            }
            else
            {
                loan.Copy.Status = CopyStatus.Available;
            }
        }
        else
        {
            loan.Copy.Status = CopyStatus.Available;
        }

        await using var transaction = await db.Database.BeginTransactionAsync();
        try
        {
            await db.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }

        return Ok(ToDto(loan));
    }

    [HttpPut("{id}/pay-fine")]
    [Authorize(Policy = "LibrarianOnly")]
    public async Task<IActionResult> PayFine(int id)
    {
        var loan = await db.Loans.Include(l => l.User).FirstOrDefaultAsync(l => l.Id == id);
        if (loan is null) return NotFound();
        if (loan.FineAmount == 0) return BadRequest("No fine on this loan.");

        loan.IsFinePaid = true;

        var hasOtherUnpaid = await db.Loans.AnyAsync(
            l => l.UserId == loan.UserId && l.Id != id && l.FineAmount > 0 && !l.IsFinePaid);
        if (!hasOtherUnpaid)
            loan.User.IsBlocked = false;

        await db.SaveChangesAsync();
        return NoContent();
    }

    private LoanDto ToDto(Loan l)
    {
        var now = DateTime.UtcNow;
        var isOverdue = l.ReturnedAt == null && now > l.DueDate;

        var currentFine = l.FineAmount;
        if (isOverdue)
        {
            var overdueDays = (int)(now - l.DueDate).TotalDays;
            currentFine = overdueDays * Settings.FinePerDay;
        }

        return new LoanDto(
            l.Id, l.CopyId, l.Copy.BookId, l.Copy.Book.Title,
            l.UserId, l.User.Email!,
            l.BorrowedAt, l.DueDate, l.ReturnedAt,
            currentFine, l.IsFinePaid,
            isOverdue
        );
    }
}
