using Microsoft.AspNetCore.Identity;

namespace BibliotekUZ.Server.Data;

public static class DbSeeder
{
    public static readonly string[] Roles = ["Reader", "Librarian"];

    public static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
    {
        foreach (var role in Roles)
        {
            if (await roleManager.RoleExistsAsync(role))
                continue;

            var result = await roleManager.CreateAsync(new IdentityRole(role));
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to seed role '{role}': {errors}");
            }
        }
    }
}
