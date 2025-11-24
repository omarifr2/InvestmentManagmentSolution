namespace InvestmentManager.API.Middleware;

public class BasicAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;

    public BasicAuthMiddleware(RequestDelegate next, IConfiguration configuration)
    {
        _next = next;
        _configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Headers.ContainsKey("Authorization"))
        {
            context.Response.StatusCode = 401;
            return;
        }

        var authHeader = context.Request.Headers["Authorization"].ToString();
        if (authHeader != null && authHeader.StartsWith("Basic "))
        {
            var encodedUsernamePassword = authHeader.Substring(6).Trim();
            var encoding = System.Text.Encoding.UTF8;
            var usernamePassword = encoding.GetString(Convert.FromBase64String(encodedUsernamePassword));
            var parts = usernamePassword.Split(':');

            if (parts.Length == 2)
            {
                var username = parts[0];
                var password = parts[1];

                var configUsername = _configuration["BasicAuth:Username"] ?? "admin";
                var configPassword = _configuration["BasicAuth:Password"] ?? "password";

                if (username == configUsername && password == configPassword)
                {
                    await _next(context);
                    return;
                }
            }
        }

        context.Response.StatusCode = 401;
    }
}

public static class BasicAuthMiddlewareExtensions
{
    public static IApplicationBuilder UseBasicAuth(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<BasicAuthMiddleware>();
    }
}
