namespace BibliotekUZ.Server.DTOs;

public record RegisterRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    DateOnly? DateOfBirth
);

public record LoginRequest(string Email, string Password);

public record AuthResponse(
    string Token,
    DateTime ExpiresAt,
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    IList<string> Roles
);
