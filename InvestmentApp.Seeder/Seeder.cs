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
            var retirementCategory = new InvestmentCategory { Name = "Personal Retirement Plan" };
            var liquidityCategory = new InvestmentCategory { Name = "24/7 Liquidity" };
            var othersCategory = new InvestmentCategory { Name = "Others" };
            
            _context.InvestmentCategories.AddRange(retirementCategory, liquidityCategory, othersCategory);
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

            // --- Existing Accounts (Re-categorized) ---

            // 1. Vanguard 401k (Retirement -> Personal Retirement Plan)
            Console.WriteLine("Seeding Account 1: Vanguard 401k...");
            await SeedAccount("Vanguard 401k", retirementCategory.Id, 50000m, (m, prev) => {
                decimal contribution = 0;
                decimal growth = 1000m; // Steady growth
                if (m == 6) { contribution = 1000m; growth += 1000m; }
                return (prev + growth, contribution);
            });

            // 2. Meme Stocks (Crypto/Risky -> Others)
            Console.WriteLine("Seeding Account 2: Meme Stocks...");
            await SeedAccount("Meme Stocks", othersCategory.Id, 10000m, (m, prev) => {
                return (prev - 500m, 0);
            });

            // 3. Emergency Fund (Short Term -> 24/7 Liquidity)
            Console.WriteLine("Seeding Account 3: Emergency Fund...");
            await SeedAccount("Emergency Fund", liquidityCategory.Id, 5000m, (m, prev) => (5000m, 0), 11, 11);

            // --- New Accounts ---

            // 4. Tech Growth Fund (Retirement -> Personal Retirement Plan)
            Console.WriteLine("Seeding Account 4: Tech Growth Fund...");
            await SeedAccount("Tech Growth Fund", retirementCategory.Id, 20000m, (m, prev) => {
                double changePct = (_random.NextDouble() * 0.10) - 0.02; // -2% to +8%
                decimal change = prev * (decimal)changePct;
                return (prev + change, 0);
            });

            // 5. Dividend Portfolio (Retirement -> Personal Retirement Plan)
            Console.WriteLine("Seeding Account 5: Dividend Portfolio...");
            await SeedAccount("Dividend Portfolio", retirementCategory.Id, 50000m, (m, prev) => {
                return (prev + 200m, 0); 
            });

            // 6. Bond Index (Short Term -> 24/7 Liquidity)
            Console.WriteLine("Seeding Account 6: Bond Index...");
            await SeedAccount("Bond Index", liquidityCategory.Id, 10000m, (m, prev) => {
                return (prev * 1.005m, 0);
            });

            // 7. Global Market Fund (Retirement -> Personal Retirement Plan)
            Console.WriteLine("Seeding Account 7: Global Market Fund...");
            await SeedAccount("Global Market Fund", retirementCategory.Id, 30000m, (m, prev) => {
                return (prev * 1.02m, 0);
            });

            // 8. REIT Income (Short Term -> 24/7 Liquidity)
            Console.WriteLine("Seeding Account 8: REIT Income...");
            await SeedAccount("REIT Income", liquidityCategory.Id, 15000m, (m, prev) => {
                return (prev + 100m, 0);
            });

            // 9. Alt Coin Speculation (Crypto/Risky -> Others)
            Console.WriteLine("Seeding Account 9: Alt Coin Speculation...");
            await SeedAccount("Alt Coin Speculation", othersCategory.Id, 1000m, (m, prev) => {
                double swing = (_random.NextDouble() * 1.0) - 0.5; // -50% to +50%
                return (prev * (1 + (decimal)swing), 0);
            });

            // 10. Kids Education 529 (Retirement -> Personal Retirement Plan)
            Console.WriteLine("Seeding Account 10: Kids Education 529...");
            await SeedAccount("Kids Education 529", retirementCategory.Id, 5000m, (m, prev) => {
                decimal contribution = 500m;
                decimal growth = (prev + contribution) * 0.01m;
                return (prev + contribution + growth, contribution);
            });

            // 11. Health Savings (HSA) (Short Term -> 24/7 Liquidity)
            Console.WriteLine("Seeding Account 11: Health Savings (HSA)...");
            await SeedAccount("Health Savings (HSA)", liquidityCategory.Id, 2000m, (m, prev) => {
                return (prev + 100m, 100m);
            });

            // 12. Inheritance Trust (Short Term -> 24/7 Liquidity)
            Console.WriteLine("Seeding Account 12: Inheritance Trust...");
            await SeedAccount("Inheritance Trust", liquidityCategory.Id, 200000m, (m, prev) => {
                return (prev - 2000m, -2000m); // Negative contribution (withdrawal)
            });

            // 13. Day Trading (Crypto/Risky -> Others)
            Console.WriteLine("Seeding Account 13: Day Trading...");
            await SeedAccount("Day Trading", othersCategory.Id, 5000m, (m, prev) => {
                decimal change = _random.Next(-1000, 1000);
                return (prev + change, 0);
            });

            // 14. Empty Shell (Short Term -> 24/7 Liquidity)
            Console.WriteLine("Seeding Account 14: Empty Shell...");
            var emptyAccount = new InvestmentAccount { Name = "Empty Shell", CategoryId = liquidityCategory.Id, InitialAmount = 0 };
            _context.InvestmentAccounts.Add(emptyAccount);
            await _context.SaveChangesAsync();

            // 15. Closed 401k (Retirement -> Personal Retirement Plan)
            Console.WriteLine("Seeding Account 15: Closed 401k...");
            await SeedAccount("Closed 401k", retirementCategory.Id, 10000m, (m, prev) => {
                if (m >= 6) return (0, 0);
                return (prev, 0);
            });

            // 16. Mid-Year Starter (Short Term -> 24/7 Liquidity)
            Console.WriteLine("Seeding Account 16: Mid-Year Starter...");
            await SeedAccount("Mid-Year Starter", liquidityCategory.Id, 0m, (m, prev) => {
                if (m == 6) return (10000m, 10000m); // Initial deposit
                if (m > 6) return (prev + 100m, 0);
                return (0, 0);
            }, 6, 12);

            // 17. Penny Stock Gamble (Crypto/Risky -> Others)
            Console.WriteLine("Seeding Account 17: Penny Stock Gamble...");
            await SeedAccount("Penny Stock Gamble", othersCategory.Id, 100m, (m, prev) => {
                if (prev == 0) return (0, 0);
                bool doubleUp = _random.Next(0, 2) == 0;
                return (doubleUp ? prev * 2 : prev / 2, 0);
            });

            // 18. MWR Test Account (Short Term -> 24/7 Liquidity)
            Console.WriteLine("Seeding Account 18: MWR Test Account...");
            await SeedAccount("MWR Test Account", liquidityCategory.Id, 10000m, (m, prev) => {
                // Month 1-3: Growth +100
                if (m <= 3) return (prev + 100m, 0);
                
                // Month 4: Contribution +5,000
                if (m == 4) return (prev + 5000m + 100m, 5000m);
                
                // Month 5-8: Growth +200
                if (m <= 8) return (prev + 200m, 0);
                
                // Month 9: Withdrawal -2,000
                if (m == 9) return (prev - 2000m + 100m, -2000m);
                
                // Month 10-12: Growth +100
                return (prev + 100m, 0);
            });

            // 19. [NEW] Roth IRA (Personal Retirement Plan)
            Console.WriteLine("Seeding Account 19: Roth IRA...");
            await SeedAccount("Roth IRA", retirementCategory.Id, 12000m, (m, prev) => {
                // Steady growth + monthly contribution
                decimal contribution = 500m;
                return (prev + contribution + (prev * 0.005m), contribution);
            });

            // Seed Transactions
            Console.WriteLine("Seeding transactions...");
            
            var accountA = await _context.InvestmentAccounts.FirstAsync(a => a.Name == "Vanguard 401k");
            var accountB = await _context.InvestmentAccounts.FirstAsync(a => a.Name == "Meme Stocks");
            var accountC = await _context.InvestmentAccounts.FirstAsync(a => a.Name == "Emergency Fund");

            // 1. Transfer In: Emergency Fund -> Vanguard 401k
            _context.Transactions.Add(new Transaction
            {
                Type = TransactionType.Transfer,
                Amount = 1000m,
                FromAccountId = accountC.Id,
                ToAccountId = accountA.Id,
                Date = new DateTime(2025, 6, 15), // June
                Note = "Transfer from Emergency Fund to Vanguard 401k"
            });

            // 2. Withdrawal: Meme Stocks
            _context.Transactions.Add(new Transaction
            {
                Type = TransactionType.Withdrawal,
                Amount = 500m,
                FromAccountId = accountB.Id,
                Date = new DateTime(2025, 11, 23),
                Note = "Withdrawal from Meme Stocks"
            });

            // 3. External Contribution: Kids Education 529
            var accountKids = await _context.InvestmentAccounts.FirstAsync(a => a.Name == "Kids Education 529");
            _context.Transactions.Add(new Transaction
            {
                Type = TransactionType.Contribution,
                Amount = 500m,
                ToAccountId = accountKids.Id,
                Date = new DateTime(2025, 3, 10),
                Note = "Monthly Contribution"
            });

            // 4. Transfer Out: Inheritance Trust -> Bond Index
            var accountTrust = await _context.InvestmentAccounts.FirstAsync(a => a.Name == "Inheritance Trust");
            var accountBond = await _context.InvestmentAccounts.FirstAsync(a => a.Name == "Bond Index");
            
            _context.Transactions.Add(new Transaction
            {
                Type = TransactionType.Transfer,
                Amount = 2000m,
                FromAccountId = accountTrust.Id,
                ToAccountId = accountBond.Id,
                Date = new DateTime(2025, 1, 15),
                Note = "Trust Distribution to Bond Index"
            });
            
            // Adjust Bond Index snapshot for Jan
            var bondJanSnapshot = await _context.MonthlySnapshots.FirstOrDefaultAsync(s => s.AccountId == accountBond.Id && s.Month.Month == 1);
            if (bondJanSnapshot != null)
            {
                bondJanSnapshot.NetContribution = 2000m;
                bondJanSnapshot.AmountValue += 2000m; // Adjust balance
            }

            // 5. Additional Withdrawals for Testing Notes
            
            // Inheritance Trust: Withdrawal in Feb
            _context.Transactions.Add(new Transaction
            {
                Type = TransactionType.Withdrawal,
                Amount = 2000m,
                FromAccountId = accountTrust.Id,
                Date = new DateTime(2025, 2, 15),
                Note = "Monthly Living Expenses"
            });

            // Inheritance Trust: Withdrawals for Mar-Dec
            for (int month = 3; month <= 12; month++)
            {
                _context.Transactions.Add(new Transaction
                {
                    Type = TransactionType.Withdrawal,
                    Amount = 2000m,
                    FromAccountId = accountTrust.Id,
                    Date = new DateTime(2025, month, 15),
                    Note = "Monthly Living Expenses"
                });
            }

            // Closed 401k: Withdrawal in June (Liquidation)
            var accountClosed = await _context.InvestmentAccounts.FirstAsync(a => a.Name == "Closed 401k");
            _context.Transactions.Add(new Transaction
            {
                Type = TransactionType.Withdrawal,
                Amount = 10000m, 
                FromAccountId = accountClosed.Id,
                Date = new DateTime(2025, 6, 1),
                Note = "Account Closure / Full Liquidation"
            });

            // Meme Stocks: Panic Sell in May
            _context.Transactions.Add(new Transaction
            {
                Type = TransactionType.Withdrawal,
                Amount = 1000m,
                FromAccountId = accountB.Id,
                Date = new DateTime(2025, 5, 20),
                Note = "Panic Sell during dip"
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
