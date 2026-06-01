using BibliotekUZ.Server.Data;
using BibliotekUZ.Server.DTOs;
using BibliotekUZ.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BibliotekUZ.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BookDto>>> GetAll()
    {
        var books = await db.Books
            .Include(b => b.Copies)
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
        db.Books.Remove(book);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
