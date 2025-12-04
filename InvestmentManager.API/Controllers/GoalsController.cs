using InvestmentManager.API.Data;
using InvestmentManager.API.Models;
using InvestmentManager.API.DTOs;
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
    public async Task<ActionResult<GoalDto>> GetGoal(int year)
    {
        var globalGoal = await _context.GlobalGoals.FirstOrDefaultAsync(g => g.Year == year);
        var categoryGoals = await _context.CategoryGoals.Where(g => g.Year == year).ToListAsync();

        if (globalGoal == null && !categoryGoals.Any())
        {
            return NotFound();
        }

        var dto = new GoalDto
        {
            Year = year,
            ContributionGoal = globalGoal?.ContributionGoal ?? 0,
            CategoryGoals = categoryGoals.Select(cg => new CategoryGoalDto
            {
                CategoryId = cg.CategoryId,
                TargetAmount = cg.TargetAmount
            }).ToList()
        };

        return dto;
    }

    [HttpPost]
    public async Task<ActionResult<GoalDto>> SetGoal(GoalDto goalDto)
    {
        // 1. Handle Global Goal (Contribution)
        var existingGlobalGoal = await _context.GlobalGoals.FirstOrDefaultAsync(g => g.Year == goalDto.Year);
        if (existingGlobalGoal != null)
        {
            existingGlobalGoal.ContributionGoal = goalDto.ContributionGoal;
            _context.Entry(existingGlobalGoal).State = EntityState.Modified;
        }
        else
        {
            _context.GlobalGoals.Add(new GlobalGoal
            {
                Year = goalDto.Year,
                ContributionGoal = goalDto.ContributionGoal
            });
        }

        // 2. Handle Category Goals
        foreach (var catGoalDto in goalDto.CategoryGoals)
        {
            var existingCatGoal = await _context.CategoryGoals
                .FirstOrDefaultAsync(g => g.Year == goalDto.Year && g.CategoryId == catGoalDto.CategoryId);

            if (existingCatGoal != null)
            {
                existingCatGoal.TargetAmount = catGoalDto.TargetAmount;
                _context.Entry(existingCatGoal).State = EntityState.Modified;
            }
            else
            {
                _context.CategoryGoals.Add(new CategoryGoal
                {
                    Year = goalDto.Year,
                    CategoryId = catGoalDto.CategoryId,
                    TargetAmount = catGoalDto.TargetAmount
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(goalDto);
    }
}
