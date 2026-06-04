using System.Text.Json;

namespace BibliotekUZ.Server.Services;

public class GoogleBooksService(HttpClient httpClient, IConfiguration config)
{
    public async Task<BookLookupResult?> LookupByIsbnAsync(string isbn)
    {
        var apiKey = config["GoogleBooks:ApiKey"];

        var url = $"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}";

        if (!string.IsNullOrWhiteSpace(apiKey))
            url += $"&key={apiKey}";

        httpClient.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", "BibliotekUZ/1.0");

        var response = await httpClient.GetAsync(url);

        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var root = doc.RootElement;
        if (root.TryGetProperty("totalItems", out var totalItems) && totalItems.GetInt32() == 0)
            return null;

        try
        {
            var volumeInfo = root.GetProperty("items")[0].GetProperty("volumeInfo");

            var title = volumeInfo.GetProperty("title").GetString();
            var authors = volumeInfo.TryGetProperty("authors", out var authorsProp)
                ? string.Join(", ", authorsProp.EnumerateArray().Select(a => a.GetString()))
                : "Nieznany autor";

            return new BookLookupResult(title ?? "Brak tytułu", authors);
        }
        catch
        {
            return null;
        }
    }
}

public record BookLookupResult(string Title, string Author);