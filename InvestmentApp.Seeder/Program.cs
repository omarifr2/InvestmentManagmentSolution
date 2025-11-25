using InvestmentApp.Seeder;
using InvestmentManager.API.Data;
using Microsoft.EntityFrameworkCore;

// Configure DbContext with SQLite connection string
// Use the same database file as the API (in the API directory)
var dbPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "InvestmentManager.API", "investment.db");
var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
optionsBuilder.UseSqlite($"Data Source={dbPath}");

using var context = new AppDbContext(optionsBuilder.Options);

// Ensure database is created
await context.Database.EnsureCreatedAsync();

// Run the seeder
Console.WriteLine("🌱 Seeding Database...");
Console.WriteLine();

var seeder = new Seeder(context);
await seeder.Run();

Console.WriteLine();
Console.WriteLine("✅ Done! Total Portfolio Value should be approx $69k vs $100k Goal.");
Console.WriteLine();
Console.WriteLine("Expected values:");
Console.WriteLine("  - Account A (Vanguard 401k): ~$60,000");
Console.WriteLine("  - Account B (Meme Stocks): ~$5,000");
Console.WriteLine("  - Account C (Emergency Fund): $5,000");
Console.WriteLine("  - Total: ~$70,000 (before transactions)");
