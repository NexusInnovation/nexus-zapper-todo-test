using System.Diagnostics;
using System.IO;

using Nexus.ZapperTodo.Api;
using Nexus.ZapperTodo.Application;
using Nexus.ZapperTodo.Domain;
using Nexus.ZapperTodo.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddOpenApi();
}
if (!builder.Environment.IsDevelopment())
{
    builder.Services.AddApplicationInsightsTelemetry();
}

builder.Services
    .RegisterDomainServices()
    .RegisterApplicationServices()
    .RegisterInfrastructureServices(builder.Configuration)
    .RegisterApiServices(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    EnsureSqlServerRunning(app.Logger, app.Environment.ContentRootPath);
}

app.UseExceptionHandler();
app.UseHttpsRedirection();
app.UseCors(Nexus.ZapperTodo.Api.ConfigureServices.CorsPolicyName);
app.MapControllers();
app.MapHealthChecks("/api/health");
app.Run();

static void EnsureSqlServerRunning(ILogger logger, string contentRootPath)
{
    var dir = new DirectoryInfo(contentRootPath);
    while (dir is not null && !File.Exists(Path.Join(dir.FullName, "docker-compose.yml")))
    {
        dir = dir.Parent;
    }

    if (dir is null)
    {
        logger.LogWarning("docker-compose.yml not found — skipping SQL Server startup.");
        return;
    }

    try
    {
        using var process = new Process();
        process.StartInfo = new ProcessStartInfo
        {
            FileName = "docker",
            Arguments = "compose up -d sqlserver",
            WorkingDirectory = dir.FullName,
            UseShellExecute = false
        };

        if (!process.Start())
        {
            logger.LogWarning("Failed to launch docker — skipping SQL Server startup.");
            return;
        }

        process.WaitForExit(30_000);

        if (!process.HasExited)
        {
            logger.LogWarning("docker compose timed out — SQL Server may still be starting.");
            return;
        }

        if (process.ExitCode != 0)
        {
            logger.LogWarning("docker compose exited with code {ExitCode} — SQL Server may not have started.", process.ExitCode);
            return;
        }

        logger.LogInformation("SQL Server Docker container started.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Could not start Docker SQL Server — make sure Docker Desktop is running.");
    }
}
