using InvestmentManager.API.Data;
using InvestmentManager.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TransactionsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Transaction>>> GetTransactions([FromQuery] int? year)
    {
        var query = _context.Transactions
            .Include(t => t.FromAccount)
            .Include(t => t.ToAccount)
            .AsQueryable();

        if (year.HasValue)
        {
            query = query.Where(t => t.Date.Year == year.Value);
        }

        return await query.ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Transaction>> CreateTransaction(Transaction transaction)
    {
        _context.Transactions.Add(transaction);
        
        // Update account balances based on transaction type
        if (transaction.Type == TransactionType.Contribution && transaction.ToAccountId.HasValue)
        {
            // Logic to update current balance would go here if we were tracking it live, 
            // but we are using monthly snapshots for balance tracking in this MVP.
            // However, we might want to update the "InitialAmount" or have a "CurrentAmount" on the account.
            // For now, we just record the transaction.
        }

        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTransactions), new { id = transaction.Id }, transaction);
    }
}
