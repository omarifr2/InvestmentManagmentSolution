using InvestmentManager.API.Models;

namespace InvestmentManager.API.DTOs;

public class GoalDto
{
    public int Year { get; set; }
    public decimal ContributionGoal { get; set; }
    public List<CategoryGoalDto> CategoryGoals { get; set; } = new();
}

public class CategoryGoalDto
{
    public int CategoryId { get; set; }
    public decimal TargetAmount { get; set; }
}
