using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using DriveWopi.Models;
using DriveWopi.Exceptions;
using System.Net.Http;
using System.Net;
using System.Net.Http.Headers;
using Newtonsoft.Json;
using System.Text;
using Microsoft.Extensions.Logging;

namespace DriveWopi.Services
{
    public class IndexService
    {
        private static  HttpClient client;
        public static bool Index(String fileId, String authorization)
        {
            try
            {
                Task<bool> t = Task<bool>.Run(async () =>
                {
                    try
                    {
                        HttpClient client = new HttpClient();
                        client.DefaultRequestHeaders.Add("Authorization", authorization);
                        client.DefaultRequestHeaders.Add("Auth-Type", "Docs");
                        var response = await client.PostAsync(Config.DriveUrl+"/api/producer/file/"+ fileId+"/contentchange",null);
                        client.DefaultRequestHeaders.Clear();
                        client.Dispose();
                        Console.WriteLine("Success!:"+ Config.DriveUrl+"/api/producer/file/"+ fileId+"/contentchange");
                        return true;
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine("Error:" + Config.DriveUrl+"/api/producer/file/"+ fileId+"/contentchange");
                        Console.WriteLine(e.Message);
                        return false;
                    }
                });
                t.Wait();
                bool ret = t.Result;
                return ret;
            }
            catch (Exception ex)
            {
                Config.logger.LogError("Index, error: " + ex.Message);
                return false;
            }

        }
    }
}
