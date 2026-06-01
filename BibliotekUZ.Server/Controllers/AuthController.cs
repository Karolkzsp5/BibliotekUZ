using BibliotekUZ.Server.DTOs;
using BibliotekUZ.Server.Models;
using BibliotekUZ.Server.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace BibliotekUZ.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    ITokenService tokenService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            DateOfBirth = request.DateOfBirth,
            LibraryCardNumber = "LIB-" + Guid.NewGuid().ToString("N")[..8].ToUpper(),
            RegistrationDate = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors.Select(e => e.Description));

        await userManager.AddToRoleAsync(user, "Reader");

        var roles = await userManager.GetRolesAsync(user);
        var (token, expiresAt) = tokenService.GenerateToken(user, roles);

        return Ok(new AuthResponse(token, expiresAt, user.Id, user.Email!, user.FirstName, user.LastName, roles));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
            return Unauthorized("Invalid credentials.");

        var result = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false);
        if (!result.Succeeded)
            return Unauthorized("Invalid credentials.");

        var roles = await userManager.GetRolesAsync(user);
        var (token, expiresAt) = tokenService.GenerateToken(user, roles);

        return Ok(new AuthResponse(token, expiresAt, user.Id, user.Email!, user.FirstName, user.LastName, roles));
    }
}
