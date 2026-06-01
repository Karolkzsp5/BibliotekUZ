namespace BibliotekUZ.Server.Settings;

public class LoanSettings
{
    public int MaxLoansPerUser { get; set; } = 5;
    public int LoanDurationDays { get; set; } = 30;
    public decimal FinePerDay { get; set; } = 0.50m;
}
