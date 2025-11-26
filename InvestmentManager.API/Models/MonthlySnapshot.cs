using System.ComponentModel.DataAnnotations;

namespace InvestmentManager.API.Models;

public class MonthlySnapshot
{
    public int Id { get; set; }
    public int AccountId { get; set; }
    public InvestmentAccount? Account { get; set; }
    public DateTime Month { get; set; }
    public decimal AmountValue { get; set; }
    public decimal NetContribution { get; set; }
}
