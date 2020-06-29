using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using DriveWopi.Models;

namespace DriveWopi
{
    public class Program
    {
        public static void Main(string[] args)
        {
            SessionManager manager = new SessionManager();
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseUrls($"http://0.0.0.0:{Config.Port}").UseIISIntegration().UseStartup<Startup>();
                    webBuilder.ConfigureKestrel(serverOptions =>
                    {
                        serverOptions.AllowSynchronousIO = true;
                        serverOptions.Limits.MaxRequestBodySize = int.MaxValue;

                    });
                });
    }
}
