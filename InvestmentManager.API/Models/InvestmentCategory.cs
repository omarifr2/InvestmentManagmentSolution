using System.ComponentModel.DataAnnotations;

namespace InvestmentManager.API.Models;

public class InvestmentCategory
{
    public int Id { get; set; }
    [Required]
    public string Name { get; set; } = string.Empty;
}
