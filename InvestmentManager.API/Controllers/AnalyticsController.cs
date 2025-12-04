using InvestmentManager.API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AnalyticsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("networth")]
    public async Task<ActionResult<IEnumerable<object>>> GetNetWorthHistory()
    {
        var snapshots = await _context.MonthlySnapshots
            .GroupBy(s => s.Month)
            .Select(g => new
            {
                Month = g.Key,
                TotalValue = g.Sum(s => s.AmountValue)
            })
            .OrderBy(x => x.Month)
            .ToListAsync();

        return Ok(snapshots);
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<object>>> GetCategoriesAnalytics()
    {
        // Get the latest snapshot for each account
        var latestSnapshots = await _context.MonthlySnapshots
            .GroupBy(s => s.AccountId)
            .Select(g => g.OrderByDescending(s => s.Month).FirstOrDefault())
            .ToListAsync();

        if (latestSnapshots == null || !latestSnapshots.Any())
        {
             return Ok(new List<object>());
        }

        // We need to fetch accounts to get the category
        // Since we have the snapshots in memory now (ToListAsync), we can't easily join in memory if we didn't Include.
        // Better approach: Query accounts and their latest snapshot.
        
        var categoryData = await _context.InvestmentAccounts
            .Include(a => a.Category)
            .Select(a => new 
            {
                CategoryName = a.Category.Name,
                // Get the latest snapshot value for this account
                CurrentValue = _context.MonthlySnapshots
                    .Where(s => s.AccountId == a.Id)
                    .OrderByDescending(s => s.Month)
                    .Select(s => s.AmountValue)
                    .FirstOrDefault()
            })
            .ToListAsync();

        var result = categoryData
            .GroupBy(x => x.CategoryName)
            .Select(g => new 
            {
                Category = g.Key,
                TotalValue = g.Sum(x => x.CurrentValue)
            })
            .ToList();

        return Ok(result);
    }
}
