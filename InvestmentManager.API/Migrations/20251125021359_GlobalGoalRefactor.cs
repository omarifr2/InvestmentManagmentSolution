using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvestmentManager.API.Migrations
{
    /// <inheritdoc />
    public partial class GlobalGoalRefactor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "YearGoal",
                table: "InvestmentAccounts");

            migrationBuilder.CreateTable(
                name: "GlobalGoals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Year = table.Column<int>(type: "INTEGER", nullable: false),
                    TargetAmount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GlobalGoals", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GlobalGoals");

            migrationBuilder.AddColumn<decimal>(
                name: "YearGoal",
                table: "InvestmentAccounts",
                type: "TEXT",
                precision: 18,
                scale: 2,
                nullable: true);
        }
    }
}
