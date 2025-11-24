using InvestmentManager.API.Data;
using InvestmentManager.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public CategoriesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InvestmentCategory>>> GetCategories()
    {
        return await _context.InvestmentCategories.ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<InvestmentCategory>> CreateCategory(InvestmentCategory category)
    {
        _context.InvestmentCategories.Add(category);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, category);
    }
}
