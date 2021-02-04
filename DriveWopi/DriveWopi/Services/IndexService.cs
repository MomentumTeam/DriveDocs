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
        static IndexService(){
            client = new HttpClient();
        }
        public static bool Index(String fileId, String authorization)
        {
            try
            {
                Task<bool> t = Task<bool>.Run(async () =>
                {
                    try
                    {
                        client.DefaultRequestHeaders.Add("Authorization", authorization);

                        var response = await client.PostAsync(Config.DriveUrl+"/api/producer/file/"+ fileId+"/contentchange",null);
                        return true;
                    }
                    catch (Exception e)
                    {
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
