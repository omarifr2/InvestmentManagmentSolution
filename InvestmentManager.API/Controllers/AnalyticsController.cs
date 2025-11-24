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
}
