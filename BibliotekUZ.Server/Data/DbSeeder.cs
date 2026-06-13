using BibliotekUZ.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

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

    public static async Task ResetLoansAndCopiesAsync(ApplicationDbContext db)
    {
        await db.Loans.ExecuteDeleteAsync();
        await db.WaitlistEntries.ExecuteDeleteAsync();
        await db.Copies.ExecuteDeleteAsync();

        var books = await db.Books.ToListAsync();

        foreach (var book in books)
        {
            for (int i = 0; i < 5; i++)
            {
                db.Copies.Add(new Copy
                {
                    BookId = book.Id,
                    Status = CopyStatus.Available
                });
            }
        }

        await db.SaveChangesAsync();

        Console.WriteLine("[SKRYPT] Pomyœlnie zresetowano wypo¿yczenia i przywrócono po 5 egzemplarzy.");
    }
}
