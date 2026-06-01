namespace BibliotekUZ.Server.DTOs;

public record LoanDto(
    int Id,
    int CopyId,
    int BookId,
    string BookTitle,
    string UserId,
    string UserEmail,
    DateTime BorrowedAt,
    DateTime DueDate,
    DateTime? ReturnedAt,
    decimal FineAmount,
    bool IsFinePaid,
    bool IsOverdue
);

public record BorrowRequest(int BookId);
