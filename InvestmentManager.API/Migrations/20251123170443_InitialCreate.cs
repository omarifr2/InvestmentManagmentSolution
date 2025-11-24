using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvestmentManager.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "InvestmentCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvestmentCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InvestmentAccounts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    CategoryId = table.Column<int>(type: "INTEGER", nullable: false),
                    InitialAmount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    YearGoal = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvestmentAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InvestmentAccounts_InvestmentCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "InvestmentCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MonthlySnapshots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AccountId = table.Column<int>(type: "INTEGER", nullable: false),
                    Month = table.Column<DateTime>(type: "TEXT", nullable: false),
                    AmountValue = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MonthlySnapshots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MonthlySnapshots_InvestmentAccounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "InvestmentAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Transactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Amount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    FromAccountId = table.Column<int>(type: "INTEGER", nullable: true),
                    ToAccountId = table.Column<int>(type: "INTEGER", nullable: true),
                    Date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Note = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Transactions_InvestmentAccounts_FromAccountId",
                        column: x => x.FromAccountId,
                        principalTable: "InvestmentAccounts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Transactions_InvestmentAccounts_ToAccountId",
                        column: x => x.ToAccountId,
                        principalTable: "InvestmentAccounts",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_InvestmentAccounts_CategoryId",
                table: "InvestmentAccounts",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_MonthlySnapshots_AccountId",
                table: "MonthlySnapshots",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_FromAccountId",
                table: "Transactions",
                column: "FromAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_ToAccountId",
                table: "Transactions",
                column: "ToAccountId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MonthlySnapshots");

            migrationBuilder.DropTable(
                name: "Transactions");

            migrationBuilder.DropTable(
                name: "InvestmentAccounts");

            migrationBuilder.DropTable(
                name: "InvestmentCategories");
        }
    }
}
