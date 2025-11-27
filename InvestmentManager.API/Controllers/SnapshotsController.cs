using InvestmentManager.API.Data;
using InvestmentManager.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SnapshotsController : ControllerBase
{
    private readonly AppDbContext _context;

    public SnapshotsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MonthlySnapshot>>> GetSnapshots()
    {
        return await _context.MonthlySnapshots.Include(s => s.Account).ToListAsync();
    }

    [HttpPost("batch")]
    public async Task<ActionResult> CreateSnapshots(List<MonthlySnapshot> snapshots)
    {
        foreach (var snapshot in snapshots)
        {
            // Check if a snapshot already exists for this account and month
            var existingSnapshot = await _context.MonthlySnapshots
                .FirstOrDefaultAsync(s => s.AccountId == snapshot.AccountId && s.Month == snapshot.Month);

            if (existingSnapshot != null)
            {
                // Update existing
                existingSnapshot.AmountValue = snapshot.AmountValue;
                existingSnapshot.NetContribution = snapshot.NetContribution;
                _context.Entry(existingSnapshot).State = EntityState.Modified;
            }
            else
            {
                // Add new
                _context.MonthlySnapshots.Add(snapshot);
            }
        }

        await _context.SaveChangesAsync();
        return Ok();
    }
}
