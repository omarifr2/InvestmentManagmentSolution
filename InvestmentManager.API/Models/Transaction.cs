using System.ComponentModel.DataAnnotations;

namespace InvestmentManager.API.Models;

public enum TransactionType
{
    Contribution,
    Withdrawal,
    Transfer
}

public class Transaction
{
    public int Id { get; set; }
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public int? FromAccountId { get; set; }
    public InvestmentAccount? FromAccount { get; set; }
    public int? ToAccountId { get; set; }
    public InvestmentAccount? ToAccount { get; set; }
    public DateTime Date { get; set; }
    public string Note { get; set; } = string.Empty;
}
