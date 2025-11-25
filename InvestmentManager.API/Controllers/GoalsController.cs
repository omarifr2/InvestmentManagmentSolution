using InvestmentManager.API.Data;
using InvestmentManager.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GoalsController : ControllerBase
{
    private readonly AppDbContext _context;

    public GoalsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("{year}")]
    public async Task<ActionResult<GlobalGoal>> GetGoal(int year)
    {
        var goal = await _context.GlobalGoals.FirstOrDefaultAsync(g => g.Year == year);
        if (goal == null)
        {
            return NotFound();
        }
        return goal;
    }

    [HttpPost]
    public async Task<ActionResult<GlobalGoal>> SetGoal(GlobalGoal goal)
    {
        var existingGoal = await _context.GlobalGoals.FirstOrDefaultAsync(g => g.Year == goal.Year);
        if (existingGoal != null)
        {
            existingGoal.TargetAmount = goal.TargetAmount;
            _context.Entry(existingGoal).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return Ok(existingGoal);
        }
        else
        {
            _context.GlobalGoals.Add(goal);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetGoal), new { year = goal.Year }, goal);
        }
    }
}
