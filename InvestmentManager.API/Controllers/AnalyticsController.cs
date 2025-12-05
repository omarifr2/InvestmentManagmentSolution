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
                TotalValue = g.Sum(s => s.AmountValue),
                MonthlyContribution = g.Sum(s => s.NetContribution)
            })
            .OrderBy(x => x.Month)
            .ToListAsync();

        decimal runningInvested = 0;
        var result = snapshots.Select(s => {
            runningInvested += s.MonthlyContribution;
            return new {
                s.Month,
                s.TotalValue,
                TotalInvested = runningInvested
            };
        });

        return Ok(result);
    }

    [HttpGet("performance/monthly")]
    public async Task<ActionResult<IEnumerable<object>>> GetMonthlyPerformance()
    {
        var snapshots = await _context.MonthlySnapshots
            .GroupBy(s => s.Month)
            .Select(g => new
            {
                Month = g.Key,
                TotalValue = g.Sum(s => s.AmountValue),
                NetContribution = g.Sum(s => s.NetContribution)
            })
            .OrderBy(x => x.Month)
            .ToListAsync();

        var result = new List<object>();
        decimal previousTotalValue = 0;

        foreach (var s in snapshots)
        {
            var marketReturn = s.TotalValue - previousTotalValue - s.NetContribution;
            
            result.Add(new {
                s.Month,
                s.NetContribution,
                MarketReturn = marketReturn
            });

            previousTotalValue = s.TotalValue;
        }

        return Ok(result);
    }

    [HttpGet("performance/categories")]
    public async Task<ActionResult<IEnumerable<object>>> GetCategoryPerformance()
    {
        var categoryStats = await _context.InvestmentAccounts
            .Include(a => a.Category)
            .Select(a => new 
            {
                CategoryName = a.Category.Name,
                CurrentValue = _context.MonthlySnapshots
                    .Where(s => s.AccountId == a.Id)
                    .OrderByDescending(s => s.Month)
                    .Select(s => s.AmountValue)
                    .FirstOrDefault(),
                TotalInvested = _context.MonthlySnapshots
                    .Where(s => s.AccountId == a.Id)
                    .Sum(s => s.NetContribution)
            })
            .ToListAsync();

        var result = categoryStats
            .GroupBy(x => x.CategoryName)
            .Select(g => {
                var totalValue = g.Sum(x => x.CurrentValue);
                var totalInvested = g.Sum(x => x.TotalInvested);
                var totalGain = totalValue - totalInvested;
                var returnPercentage = totalInvested != 0 ? (totalGain / totalInvested) * 100 : 0;
                
                return new 
                {
                    Category = g.Key,
                    TotalValue = totalValue,
                    TotalInvested = totalInvested,
                    ReturnPercentage = Math.Round(returnPercentage, 2)
                };
            })
            .ToList();

        return Ok(result);
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<object>>> GetCategoriesAnalytics()
    {
        var latestSnapshots = await _context.MonthlySnapshots
            .GroupBy(s => s.AccountId)
            .Select(g => g.OrderByDescending(s => s.Month).FirstOrDefault())
            .ToListAsync();

        if (latestSnapshots == null || !latestSnapshots.Any())
        {
             return Ok(new List<object>());
        }

        var categoryData = await _context.InvestmentAccounts
            .Include(a => a.Category)
            .Select(a => new 
            {
                CategoryName = a.Category.Name,
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
