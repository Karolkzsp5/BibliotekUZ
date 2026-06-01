using BibliotekUZ.Server.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BibliotekUZ.Server.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Book> Books => Set<Book>();
    public DbSet<Copy> Copies => Set<Copy>();
    public DbSet<Loan> Loans => Set<Loan>();
    public DbSet<WaitlistEntry> WaitlistEntries => Set<WaitlistEntry>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(e =>
        {
            e.HasIndex(u => u.LibraryCardNumber).IsUnique();
            e.Ignore(u => u.FullName);
        });

        builder.Entity<Book>(e =>
        {
            e.HasIndex(b => b.ISBN).IsUnique();
        });

        builder.Entity<Copy>(e =>
        {
            e.HasOne(c => c.Book)
             .WithMany(b => b.Copies)
             .HasForeignKey(c => c.BookId)
             .OnDelete(DeleteBehavior.Cascade);

            e.Property(c => c.Status)
             .HasConversion<string>();
        });

        builder.Entity<Loan>(e =>
        {
            e.HasOne(l => l.Copy)
             .WithMany(c => c.Loans)
             .HasForeignKey(l => l.CopyId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(l => l.User)
             .WithMany(u => u.Loans)
             .HasForeignKey(l => l.UserId)
             .OnDelete(DeleteBehavior.Restrict);

            e.Property(l => l.FineAmount)
             .HasPrecision(10, 2);
        });

        builder.Entity<WaitlistEntry>(e =>
        {
            e.HasOne(w => w.Book)
             .WithMany(b => b.WaitlistEntries)
             .HasForeignKey(w => w.BookId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(w => w.User)
             .WithMany(u => u.WaitlistEntries)
             .HasForeignKey(w => w.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            // one entry per user per book
            e.HasIndex(w => new { w.BookId, w.UserId }).IsUnique();
        });
    }
}
