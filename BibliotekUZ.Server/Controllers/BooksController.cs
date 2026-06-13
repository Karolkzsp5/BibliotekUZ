using BibliotekUZ.Server.Data;
using BibliotekUZ.Server.DTOs;
using BibliotekUZ.Server.Models;
using BibliotekUZ.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BibliotekUZ.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController(ApplicationDbContext db, GoogleBooksService googleBooks) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BookDto>>> GetAll(
        [FromQuery] string? title,
        [FromQuery] string? author,
        [FromQuery] bool? available)
    {
        var query = db.Books.Include(b => b.Copies).AsQueryable();

        // Filtrowanie po tytule
        if (!string.IsNullOrWhiteSpace(title))
            query = query.Where(b => b.Title.Contains(title));

        // Filtrowanie po autorze
        if (!string.IsNullOrWhiteSpace(author))
            query = query.Where(b => b.Author.Contains(author));

        // Filtrowanie po dostępności
        if (available == true)
            query = query.Where(b => b.Copies.Any(c => c.Status == CopyStatus.Available));

        var books = await query
            .Select(b => new BookDto(
                b.Id, b.Title, b.Author, b.ISBN, b.Description, b.CoverUrl, b.PublishedYear,
                b.Copies.Count,
                b.Copies.Count(c => c.Status == CopyStatus.Available)))
            .ToListAsync();

        return Ok(books);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BookDto>> GetById(int id)
    {
        var b = await db.Books.Include(b => b.Copies).FirstOrDefaultAsync(b => b.Id == id);
        if (b is null) return NotFound();
        return Ok(new BookDto(b.Id, b.Title, b.Author, b.ISBN, b.Description, b.CoverUrl, b.PublishedYear,
            b.Copies.Count, b.Copies.Count(c => c.Status == CopyStatus.Available)));
    }

    [HttpPost]
    [Authorize(Policy = "LibrarianOnly")]
    public async Task<ActionResult<BookDto>> Create(CreateBookRequest request)
    {
        var book = new Book
        {
            Title = request.Title,
            Author = request.Author,
            ISBN = request.ISBN,
            Description = request.Description,
            CoverUrl = request.CoverUrl,
            PublishedYear = request.PublishedYear
        };
        db.Books.Add(book);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = book.Id },
            new BookDto(book.Id, book.Title, book.Author, book.ISBN, book.Description, book.CoverUrl, book.PublishedYear, 0, 0));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "LibrarianOnly")]
    public async Task<IActionResult> Update(int id, UpdateBookRequest request)
    {
        var book = await db.Books.FindAsync(id);
        if (book is null) return NotFound();

        book.Title = request.Title;
        book.Author = request.Author;
        book.ISBN = request.ISBN;
        book.Description = request.Description;
        book.CoverUrl = request.CoverUrl;
        book.PublishedYear = request.PublishedYear;

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "LibrarianOnly")]
    public async Task<IActionResult> Delete(int id)
    {
        var book = await db.Books.FindAsync(id);
        if (book is null) return NotFound();

        var hasActiveLoans = await db.Loans.AnyAsync(l => l.Copy.BookId == id && l.ReturnedAt == null);
        if (hasActiveLoans)
        {
            return Conflict("Nie można usunąć książki, ponieważ czytelnicy mają wciąż wypożyczone jej egzemplarze. Najpierw odbierz zwroty.");
        }

        var waitlists = await db.WaitlistEntries.Where(w => w.BookId == id).ToListAsync();
        db.WaitlistEntries.RemoveRange(waitlists);

        var historyLoans = await db.Loans.Where(l => l.Copy.BookId == id).ToListAsync();
        db.Loans.RemoveRange(historyLoans);

        var copies = await db.Copies.Where(c => c.BookId == id).ToListAsync();
        db.Copies.RemoveRange(copies);

        db.Books.Remove(book);

        await db.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("lookup")]
    public async Task<IActionResult> LookupBook([FromQuery] string isbn)
    {
        if (string.IsNullOrWhiteSpace(isbn))
            return BadRequest("Podaj numer ISBN.");

        var result = await googleBooks.LookupByIsbnAsync(isbn);

        if (result is null)
            return NotFound("Nie znaleziono książki o podanym numerze ISBN w bazie Google.");

        return Ok(result);
    }
}