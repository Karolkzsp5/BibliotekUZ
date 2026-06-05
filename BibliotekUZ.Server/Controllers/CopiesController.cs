using BibliotekUZ.Server.Data;
using BibliotekUZ.Server.DTOs;
using BibliotekUZ.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BibliotekUZ.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CopiesController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CopyDto>>> GetByBook([FromQuery] int bookId)
    {
        var copies = await db.Copies
            .Where(c => c.BookId == bookId)
            .Include(c => c.Book)
            .Select(c => new CopyDto(c.Id, c.BookId, c.Book.Title, c.Status.ToString()))
            .ToListAsync();
        return Ok(copies);
    }

    [HttpPost]
    [Authorize(Policy = "LibrarianOnly")]
    public async Task<ActionResult<CopyDto>> Add(AddCopyRequest request)
    {
        var book = await db.Books.FindAsync(request.BookId);
        if (book is null) return NotFound("Nie znaleziono książki.");

        var copy = new Copy { BookId = request.BookId, Status = CopyStatus.Available };
        db.Copies.Add(copy);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetByBook), new { bookId = copy.BookId },
            new CopyDto(copy.Id, copy.BookId, book.Title, copy.Status.ToString()));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "LibrarianOnly")]
    public async Task<IActionResult> Delete(int id)
    {
        var copy = await db.Copies.FindAsync(id);
        if (copy is null) return NotFound();
        if (copy.Status == CopyStatus.Borrowed)
            return Conflict("Nie można usunąć wypożyczonej kopii.");

        db.Copies.Remove(copy);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
