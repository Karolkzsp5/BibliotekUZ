namespace BibliotekUZ.Server.DTOs;

public record BookDto(
    int Id,
    string Title,
    string Author,
    string? ISBN,
    string? Description,
    string? CoverUrl,
    int? PublishedYear,
    int TotalCopies,
    int AvailableCopies
);

public record CreateBookRequest(
    string Title,
    string Author,
    string? ISBN,
    string? Description,
    string? CoverUrl,
    int? PublishedYear
);

public record UpdateBookRequest(
    string Title,
    string Author,
    string? ISBN,
    string? Description,
    string? CoverUrl,
    int? PublishedYear
);
