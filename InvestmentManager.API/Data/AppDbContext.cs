using InvestmentManager.API.Models;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManager.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.ConfigureWarnings(warnings => warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    }

    public DbSet<InvestmentCategory> InvestmentCategories { get; set; }
    public DbSet<InvestmentAccount> InvestmentAccounts { get; set; }
    public DbSet<MonthlySnapshot> MonthlySnapshots { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<GlobalGoal> GlobalGoals { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<InvestmentAccount>()
            .Property(a => a.InitialAmount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<GlobalGoal>()
            .Property(g => g.TargetAmount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<MonthlySnapshot>()
            .Property(s => s.AmountValue)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Transaction>()
            .Property(t => t.Amount)
            .HasPrecision(18, 2);
    }
}
