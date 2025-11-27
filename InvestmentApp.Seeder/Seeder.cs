using InvestmentManager.API.Data;
using InvestmentManager.API.Models;
using Microsoft.EntityFrameworkCore;
using System;

namespace InvestmentApp.Seeder;

public class Seeder
{
    private readonly AppDbContext _context;
    private readonly Random _random = new Random();

    public Seeder(AppDbContext context)
    {
        _context = context;
    }

    public async Task Run()
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            // Clean Slate
            Console.WriteLine("Cleaning existing data...");
            _context.Transactions.RemoveRange(_context.Transactions);
            _context.MonthlySnapshots.RemoveRange(_context.MonthlySnapshots);
            _context.InvestmentAccounts.RemoveRange(_context.InvestmentAccounts);
            _context.InvestmentCategories.RemoveRange(_context.InvestmentCategories);
            _context.GlobalGoals.RemoveRange(_context.GlobalGoals);
            await _context.SaveChangesAsync();

            // Seed Categories
            Console.WriteLine("Seeding categories...");
            var retirementCategory = new InvestmentCategory { Name = "Retirement" };
            var shortTermCategory = new InvestmentCategory { Name = "Short Term" };
            var cryptoCategory = new InvestmentCategory { Name = "Crypto/Risky" };
            
            _context.InvestmentCategories.AddRange(retirementCategory, shortTermCategory, cryptoCategory);
            await _context.SaveChangesAsync();

            // Seed Global Goal
            Console.WriteLine("Seeding global goal...");
            _context.GlobalGoals.Add(new GlobalGoal { Year = 2025, TargetAmount = 100000m, ContributionGoal = 25000m });
            await _context.SaveChangesAsync();

            // Helper to seed accounts
            async Task SeedAccount(string name, int categoryId, decimal initialAmount, Func<int, decimal, (decimal Amount, decimal Contribution)> logic, int startMonth = 1, int endMonth = 12)
            {
                var account = new InvestmentAccount
                {
                    Name = name,
                    CategoryId = categoryId,
                    InitialAmount = initialAmount
                };
                _context.InvestmentAccounts.Add(account);
                await _context.SaveChangesAsync();

                decimal currentAmount = initialAmount;
                
                for (int month = startMonth; month <= endMonth; month++)
                {
                    var (newAmount, contribution) = logic(month, currentAmount);
                    currentAmount = newAmount;

                    _context.MonthlySnapshots.Add(new MonthlySnapshot
                    {
                        AccountId = account.Id,
                        Month = new DateTime(2025, month, 1),
                        AmountValue = currentAmount,
                        NetContribution = contribution
                    });
                }
                await _context.SaveChangesAsync();
            }

            // --- Existing Accounts ---

            // 1. Vanguard 401k
            Console.WriteLine("Seeding Account 1: Vanguard 401k...");
            await SeedAccount("Vanguard 401k", retirementCategory.Id, 50000m, (m, prev) => {
                decimal contribution = 0;
                decimal growth = 1000m; // Steady growth
                if (m == 6) { contribution = 1000m; growth += 1000m; }
                return (prev + growth, contribution);
            });

            // 2. Meme Stocks
            Console.WriteLine("Seeding Account 2: Meme Stocks...");
            await SeedAccount("Meme Stocks", cryptoCategory.Id, 10000m, (m, prev) => {
                return (prev - 500m, 0);
            });

            // 3. Emergency Fund
            Console.WriteLine("Seeding Account 3: Emergency Fund...");
            // Special case: Only Nov snapshot in original, but I'll make it full year for consistency or stick to original.
            // Original: Single snapshot Nov 2025.
            await SeedAccount("Emergency Fund", shortTermCategory.Id, 5000m, (m, prev) => (5000m, 0), 11, 11);

            // --- New Accounts ---

            // 4. Tech Growth Fund (Retirement) - Volatile
            Console.WriteLine("Seeding Account 4: Tech Growth Fund...");
            await SeedAccount("Tech Growth Fund", retirementCategory.Id, 20000m, (m, prev) => {
                double changePct = (_random.NextDouble() * 0.10) - 0.02; // -2% to +8%
                decimal change = prev * (decimal)changePct;
                return (prev + change, 0);
            });

            // 5. Dividend Portfolio (Retirement) - Steady + Drip
            Console.WriteLine("Seeding Account 5: Dividend Portfolio...");
            await SeedAccount("Dividend Portfolio", retirementCategory.Id, 50000m, (m, prev) => {
                return (prev + 200m, 0); 
            });

            // 6. Bond Index (Short Term) - Slow steady
            Console.WriteLine("Seeding Account 6: Bond Index...");
            await SeedAccount("Bond Index", shortTermCategory.Id, 10000m, (m, prev) => {
                return (prev * 1.005m, 0);
            });

            // 7. Global Market Fund (Retirement) - Moderate
            Console.WriteLine("Seeding Account 7: Global Market Fund...");
            await SeedAccount("Global Market Fund", retirementCategory.Id, 30000m, (m, prev) => {
                return (prev * 1.02m, 0);
            });

            // 8. REIT Income (Short Term) - Steady
            Console.WriteLine("Seeding Account 8: REIT Income...");
            await SeedAccount("REIT Income", shortTermCategory.Id, 15000m, (m, prev) => {
                return (prev + 100m, 0);
            });

            // 9. Alt Coin Speculation (Crypto/Risky) - Wild
            Console.WriteLine("Seeding Account 9: Alt Coin Speculation...");
            await SeedAccount("Alt Coin Speculation", cryptoCategory.Id, 1000m, (m, prev) => {
                double swing = (_random.NextDouble() * 1.0) - 0.5; // -50% to +50%
                return (prev * (1 + (decimal)swing), 0);
            });

            // 10. Kids Education 529 (Retirement) - Contribution
            Console.WriteLine("Seeding Account 10: Kids Education 529...");
            await SeedAccount("Kids Education 529", retirementCategory.Id, 5000m, (m, prev) => {
                decimal contribution = 500m;
                decimal growth = (prev + contribution) * 0.01m;
                return (prev + contribution + growth, contribution);
            });

            // 11. Health Savings (HSA) (Short Term)
            Console.WriteLine("Seeding Account 11: Health Savings (HSA)...");
            await SeedAccount("Health Savings (HSA)", shortTermCategory.Id, 2000m, (m, prev) => {
                return (prev + 100m, 100m);
            });

            // 12. Inheritance Trust (Short Term) - Draining
            Console.WriteLine("Seeding Account 12: Inheritance Trust...");
            await SeedAccount("Inheritance Trust", shortTermCategory.Id, 200000m, (m, prev) => {
                return (prev - 2000m, -2000m); // Negative contribution (withdrawal)
            });

            // 13. Day Trading (Crypto/Risky) - Erratic
            Console.WriteLine("Seeding Account 13: Day Trading...");
            await SeedAccount("Day Trading", cryptoCategory.Id, 5000m, (m, prev) => {
                decimal change = _random.Next(-1000, 1000);
                return (prev + change, 0);
            });

            // 14. Empty Shell (Short Term) - No snapshots
            Console.WriteLine("Seeding Account 14: Empty Shell...");
            var emptyAccount = new InvestmentAccount { Name = "Empty Shell", CategoryId = shortTermCategory.Id, InitialAmount = 0 };
            _context.InvestmentAccounts.Add(emptyAccount);
            await _context.SaveChangesAsync();

            // 15. Closed 401k (Retirement) - Goes to 0
            Console.WriteLine("Seeding Account 15: Closed 401k...");
            await SeedAccount("Closed 401k", retirementCategory.Id, 10000m, (m, prev) => {
                if (m >= 6) return (0, 0);
                return (prev, 0);
            });

            // 16. Mid-Year Starter (Short Term) - Starts June
            Console.WriteLine("Seeding Account 16: Mid-Year Starter...");
            await SeedAccount("Mid-Year Starter", shortTermCategory.Id, 0m, (m, prev) => {
                if (m == 6) return (10000m, 10000m); // Initial deposit
                if (m > 6) return (prev + 100m, 0);
                return (0, 0);
            }, 6, 12);

            // 17. Penny Stock Gamble (Crypto/Risky)
            Console.WriteLine("Seeding Account 17: Penny Stock Gamble...");
            await SeedAccount("Penny Stock Gamble", cryptoCategory.Id, 100m, (m, prev) => {
                if (prev == 0) return (0, 0);
                bool doubleUp = _random.Next(0, 2) == 0;
                return (doubleUp ? prev * 2 : prev / 2, 0);
            });

            // Seed Transactions
            Console.WriteLine("Seeding transactions...");
            
            var accountA = await _context.InvestmentAccounts.FirstAsync(a => a.Name == "Vanguard 401k");
            var accountB = await _context.InvestmentAccounts.FirstAsync(a => a.Name == "Meme Stocks");
            var accountC = await _context.InvestmentAccounts.FirstAsync(a => a.Name == "Emergency Fund");

            _context.Transactions.Add(new Transaction
            {
                Type = TransactionType.Transfer,
                Amount = 1000m,
                FromAccountId = accountC.Id,
                ToAccountId = accountA.Id,
                Date = new DateTime(2025, 10, 24),
                Note = "Transfer from Emergency Fund to Vanguard 401k"
            });

            _context.Transactions.Add(new Transaction
            {
                Type = TransactionType.Withdrawal,
                Amount = 200m,
                FromAccountId = accountB.Id,
                Date = new DateTime(2025, 11, 23),
                Note = "Withdrawal from Meme Stocks"
            });

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            
            Console.WriteLine("✓ Seeding completed successfully!");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            Console.WriteLine($"✗ Error during seeding: {ex.Message}");
            throw;
        }
    }
}
