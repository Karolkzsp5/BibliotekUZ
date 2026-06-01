namespace BibliotekUZ.Server.DTOs;

public record WaitlistEntryDto(
    int Id,
    int BookId,
    string BookTitle,
    string UserId,
    string UserEmail,
    int Position,
    DateTime CreatedAt
);

public record JoinWaitlistRequest(int BookId);
