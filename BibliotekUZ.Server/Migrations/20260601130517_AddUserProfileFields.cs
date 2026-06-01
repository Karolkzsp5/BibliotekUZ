using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BibliotekUZ.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "DateOfBirth",
                table: "AspNetUsers",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LibraryCardNumber",
                table: "AspNetUsers",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(
                "UPDATE \"AspNetUsers\" SET \"LibraryCardNumber\" = 'LIB-' || UPPER(HEX(RANDOMBLOB(8))) " +
                "WHERE \"LibraryCardNumber\" = ''");

            migrationBuilder.AddColumn<DateTime>(
                name: "RegistrationDate",
                table: "AspNetUsers",
                type: "TEXT",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_LibraryCardNumber",
                table: "AspNetUsers",
                column: "LibraryCardNumber",
                unique: true,
                filter: "\"LibraryCardNumber\" <> ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_LibraryCardNumber",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LibraryCardNumber",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "RegistrationDate",
                table: "AspNetUsers");
        }
    }
}
