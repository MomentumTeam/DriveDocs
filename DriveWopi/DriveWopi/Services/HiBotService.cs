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
    public class HiBotService
    {
        private static  HttpClient client;
        public static bool SendToHiBot(HiBotRequest hiBotRequest,string fileId, String authorization)
        {
            try
            {
                string url = Config.DriveUrl+"/api/hiBot/"+ fileId;
                Task<bool> t = Task<bool>.Run(async () =>
                {
                    try
                    {
                        var json = JsonConvert.SerializeObject(hiBotRequest);
                        var data = new StringContent(json, Encoding.UTF8, "application/json");
                        HttpClient client = new HttpClient();
                        client.DefaultRequestHeaders.Add("Authorization", authorization);
                        client.DefaultRequestHeaders.Add("Auth-Type", "Docs");
                        var response = await client.PostAsync(url ,data);
                        client.DefaultRequestHeaders.Clear();
                        client.Dispose();
                        Console.WriteLine("Success!:"+ url);
                        return true;
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine("Error:" + url);
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
                Config.logger.LogError("HiBot, error: " + ex.Message);
                return false;
            }

        }
    }
}
