namespace BibliotekUZ.Server.Models;

public class WaitlistEntry
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public string UserId { get; set; } = string.Empty;

    public int Position { get; set; }
    public DateTime CreatedAt { get; set; }

    public Book Book { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
}
