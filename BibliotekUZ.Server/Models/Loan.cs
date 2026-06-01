namespace BibliotekUZ.Server.Models;

public class Loan
{
    public int Id { get; set; }
    public int CopyId { get; set; }
    public string UserId { get; set; } = string.Empty;

    public DateTime BorrowedAt { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? ReturnedAt { get; set; }

    public decimal FineAmount { get; set; } = 0;
    public bool IsFinePaid { get; set; } = false;

    public Copy Copy { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
}
