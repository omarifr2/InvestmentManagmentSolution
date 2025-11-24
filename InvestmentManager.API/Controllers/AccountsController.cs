using InvestmentManager.API.Data;
using InvestmentManager.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AccountsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InvestmentAccount>>> GetAccounts()
    {
        return await _context.InvestmentAccounts.Include(a => a.Category).ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<InvestmentAccount>> CreateAccount(InvestmentAccount account)
    {
        _context.InvestmentAccounts.Add(account);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAccounts), new { id = account.Id }, account);
    }
}
