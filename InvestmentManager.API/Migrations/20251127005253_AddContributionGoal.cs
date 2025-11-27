using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvestmentManager.API.Migrations
{
    /// <inheritdoc />
    public partial class AddContributionGoal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ContributionGoal",
                table: "GlobalGoals",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContributionGoal",
                table: "GlobalGoals");
        }
    }
}
