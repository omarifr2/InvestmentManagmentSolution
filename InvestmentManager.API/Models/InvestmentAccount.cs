using System.ComponentModel.DataAnnotations;

namespace InvestmentManager.API.Models;

public class InvestmentAccount
{
    public int Id { get; set; }
    [Required]
    public string Name { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public InvestmentCategory? Category { get; set; }
    public decimal InitialAmount { get; set; }
    public decimal? YearGoal { get; set; }
}
