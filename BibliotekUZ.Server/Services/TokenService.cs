using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BibliotekUZ.Server.Models;
using Microsoft.IdentityModel.Tokens;

namespace BibliotekUZ.Server.Services;

public interface ITokenService
{
    (string Token, DateTime ExpiresAt) GenerateToken(ApplicationUser user, IList<string> roles);
}

public class TokenService : ITokenService
{
    private readonly SigningCredentials _creds;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expiryMinutes;

    public TokenService(IConfiguration config)
    {
        var secret = config["JwtSettings:Secret"];
        _issuer   = config["JwtSettings:Issuer"]   ?? string.Empty;
        _audience = config["JwtSettings:Audience"] ?? string.Empty;

        if (string.IsNullOrWhiteSpace(secret))
            throw new InvalidOperationException("JwtSettings:Secret is not configured.");
        if (string.IsNullOrWhiteSpace(_issuer))
            throw new InvalidOperationException("JwtSettings:Issuer is not configured.");
        if (string.IsNullOrWhiteSpace(_audience))
            throw new InvalidOperationException("JwtSettings:Audience is not configured.");

        _expiryMinutes = config.GetValue<int>("JwtSettings:ExpiryMinutes", 60);
        if (_expiryMinutes <= 0)
            throw new InvalidOperationException("JwtSettings:ExpiryMinutes must be a positive integer.");
        _creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            SecurityAlgorithms.HmacSha256);
    }

    public (string Token, DateTime ExpiresAt) GenerateToken(ApplicationUser user, IList<string> roles)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.GivenName, user.FirstName),
            new(ClaimTypes.Surname, user.LastName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        if (user.Email is not null)
            claims.Add(new Claim(ClaimTypes.Email, user.Email));
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var expiresAt = DateTime.UtcNow.AddMinutes(_expiryMinutes);

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: _creds
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
