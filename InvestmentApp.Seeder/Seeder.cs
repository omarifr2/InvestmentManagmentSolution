using InvestmentManager.API.Data;
using InvestmentManager.API.Models;
using Microsoft.EntityFrameworkCore;

namespace InvestmentApp.Seeder;

public class Seeder
{
    private readonly AppDbContext _context;

    public Seeder(AppDbContext context)
    {
        _context = context;
    }

    public async Task Run()
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            // Clean Slate: Delete all existing data
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
            var globalGoal = new GlobalGoal
            {
                Year = 2025,
                TargetAmount = 100000m
            };
            _context.GlobalGoals.Add(globalGoal);
            await _context.SaveChangesAsync();

            // Seed Account A: Vanguard 401k (Steady Growth)
            Console.WriteLine("Seeding Account A: Vanguard 401k...");
            var accountA = new InvestmentAccount
            {
                Name = "Vanguard 401k",
                CategoryId = retirementCategory.Id,
                InitialAmount = 40000m
            };
            _context.InvestmentAccounts.Add(accountA);
            await _context.SaveChangesAsync();

            // Account A - 2024 Snapshots (12 months, flat $40k)
            for (int month = 1; month <= 12; month++)
            {
                _context.MonthlySnapshots.Add(new MonthlySnapshot
                {
                    AccountId = accountA.Id,
                    Month = new DateTime(2024, month, 1),
                    AmountValue = 40000m
                });
            }

            // Account A - 2025 Snapshots (Jan-Nov, starting at $50k, +$1k per month)
            for (int month = 1; month <= 11; month++)
            {
                var snapshot = new MonthlySnapshot
                {
                    AccountId = accountA.Id,
                    Month = new DateTime(2025, month, 1),
                    AmountValue = 50000m + (month - 1) * 1000m
                };

                // Add a $1,000 contribution in June 2025
                if (month == 6)
                {
                    snapshot.NetContribution = 1000m;
                    // Adjust amount value to reflect the contribution + some gain
                    snapshot.AmountValue += 1000m; 
                }

                _context.MonthlySnapshots.Add(snapshot);
            }

            // Seed Account B: Meme Stocks (The Loss)
            Console.WriteLine("Seeding Account B: Meme Stocks...");
            var accountB = new InvestmentAccount
            {
                Name = "Meme Stocks",
                CategoryId = cryptoCategory.Id,
                InitialAmount = 10000m
            };
            _context.InvestmentAccounts.Add(accountB);
            await _context.SaveChangesAsync();

            // Account B - 2025 Snapshots only (Jan-Nov, starting at $10k, -$500 per month)
            for (int month = 1; month <= 11; month++)
            {
                _context.MonthlySnapshots.Add(new MonthlySnapshot
                {
                    AccountId = accountB.Id,
                    Month = new DateTime(2025, month, 1),
                    AmountValue = 10000m - (month - 1) * 500m
                });
            }

            // Seed Account C: Emergency Fund (The New Account)
            Console.WriteLine("Seeding Account C: Emergency Fund...");
            var accountC = new InvestmentAccount
            {
                Name = "Emergency Fund",
                CategoryId = shortTermCategory.Id,
                InitialAmount = 5000m
            };
            _context.InvestmentAccounts.Add(accountC);
            await _context.SaveChangesAsync();

            // Account C - Single snapshot for November 2025
            _context.MonthlySnapshots.Add(new MonthlySnapshot
            {
                AccountId = accountC.Id,
                Month = new DateTime(2025, 11, 1),
                AmountValue = 5000m
            });

            await _context.SaveChangesAsync();

            // Seed Transactions
            Console.WriteLine("Seeding transactions...");
            
            // Transfer: $1,000 from Account C to Account A (last month - October)
            _context.Transactions.Add(new Transaction
            {
                Type = TransactionType.Transfer,
                Amount = 1000m,
                FromAccountId = accountC.Id,
                ToAccountId = accountA.Id,
                Date = new DateTime(2025, 10, 24),
                Note = "Transfer from Emergency Fund to Vanguard 401k"
            });

            // Withdrawal: $200 from Account B (yesterday - November 23)
            _context.Transactions.Add(new Transaction
            {
                Type = TransactionType.Withdrawal,
                Amount = 200m,
                FromAccountId = accountB.Id,
                Date = new DateTime(2025, 11, 23),
                Note = "Withdrawal from Meme Stocks"
            });

            await _context.SaveChangesAsync();

            // Commit transaction
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
