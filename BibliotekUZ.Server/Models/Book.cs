using System.ComponentModel.DataAnnotations;

namespace BibliotekUZ.Server.Models;

public class Book
{
    public int Id { get; set; }

    [Required, MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(300)]
    public string Author { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? ISBN { get; set; }

    public string? Description { get; set; }
    public string? CoverUrl { get; set; }
    public int? PublishedYear { get; set; }

    public ICollection<Copy> Copies { get; set; } = [];
    public ICollection<WaitlistEntry> WaitlistEntries { get; set; } = [];
}
