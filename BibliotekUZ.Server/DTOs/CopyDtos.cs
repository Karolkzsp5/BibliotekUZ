namespace BibliotekUZ.Server.DTOs;

public record CopyDto(int Id, int BookId, string BookTitle, string Status);

public record AddCopyRequest(int BookId);
