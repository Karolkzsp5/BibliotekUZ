namespace BibliotekUZ.Server.Models;

public class Copy
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public CopyStatus Status { get; set; } = CopyStatus.Available;

    public Book Book { get; set; } = null!;
    public ICollection<Loan> Loans { get; set; } = [];
}
