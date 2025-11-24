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
        _context.MonthlySnapshots.AddRange(snapshots);
        await _context.SaveChangesAsync();
        return Ok();
    }
}
