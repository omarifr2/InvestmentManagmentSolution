using System.ComponentModel.DataAnnotations;

namespace InvestmentManager.API.Models;

public class GlobalGoal
{
    public int Id { get; set; }
    public int Year { get; set; }
    public decimal TargetAmount { get; set; }
}
