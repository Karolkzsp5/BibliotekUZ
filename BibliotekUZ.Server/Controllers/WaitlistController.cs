using System.Security.Claims;
using BibliotekUZ.Server.Data;
using BibliotekUZ.Server.DTOs;
using BibliotekUZ.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BibliotekUZ.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "ReaderOrLibrarian")]
public class WaitlistController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<WaitlistEntryDto>>> GetByBook([FromQuery] int bookId)
    {
        var entries = await db.WaitlistEntries
            .Where(w => w.BookId == bookId)
            .Include(w => w.Book)
            .Include(w => w.User)
            .OrderBy(w => w.Position)
            .Select(w => new WaitlistEntryDto(w.Id, w.BookId, w.Book.Title, w.UserId, w.User.Email!, w.Position, w.CreatedAt))
            .ToListAsync();
        return Ok(entries);
    }

    [HttpPost]
    public async Task<ActionResult<WaitlistEntryDto>> Join(JoinWaitlistRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        if (!await db.Books.AnyAsync(b => b.Id == request.BookId))
            return NotFound("Nie znaleziono książki.");

        if (await db.WaitlistEntries.AnyAsync(w => w.BookId == request.BookId && w.UserId == userId))
            return Conflict("Już jesteś na liście oczekujących na tą książkę.");

        var hasActiveLoan = await db.Loans
            .Include(l => l.Copy)
            .AnyAsync(l => l.UserId == userId && l.Copy.BookId == request.BookId && l.ReturnedAt == null);
        if (hasActiveLoan)
            return Conflict("Masz już aktywne wypożyczenie tej książki.");

        var nextPosition = (await db.WaitlistEntries
            .Where(w => w.BookId == request.BookId)
            .MaxAsync(w => (int?)w.Position) ?? 0) + 1;

        var entry = new WaitlistEntry
        {
            BookId = request.BookId,
            UserId = userId,
            Position = nextPosition,
            CreatedAt = DateTime.UtcNow
        };
        db.WaitlistEntries.Add(entry);
        await db.SaveChangesAsync();

        await db.Entry(entry).Reference(e => e.Book).LoadAsync();
        await db.Entry(entry).Reference(e => e.User).LoadAsync();

        return CreatedAtAction(nameof(GetByBook), new { bookId = entry.BookId },
            new WaitlistEntryDto(entry.Id, entry.BookId, entry.Book.Title, entry.UserId, entry.User.Email!, entry.Position, entry.CreatedAt));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Leave(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var isLibrarian = User.IsInRole("Librarian");

        var entry = await db.WaitlistEntries.FindAsync(id);
        if (entry is null) return NotFound();
        if (!isLibrarian && entry.UserId != userId) return Forbid();

        var removedPosition = entry.Position;
        var bookId = entry.BookId;
        db.WaitlistEntries.Remove(entry);

        var entriesAfter = await db.WaitlistEntries
            .Where(w => w.BookId == bookId && w.Position > removedPosition)
            .ToListAsync();
        foreach (var e in entriesAfter) e.Position--;

        await db.SaveChangesAsync();
        return NoContent();
    }
}
