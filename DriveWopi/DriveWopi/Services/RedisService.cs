using System;
using ServiceStack.Redis;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using Microsoft.VisualBasic;

namespace DriveWopi.Services
{
    public class RedisService
    {
        public static IRedisClient GenerateRedisClient()
        {
            try
            {
                RedisManagerPool manager = new RedisManagerPool(Config.RedisHost);
                IRedisClient client = client = manager.GetClient();
                return client;
            }
            catch (Exception e)
            {
                Config.logger.LogDebug("problem with Redisclient creation, error:"+e.Message);
                throw e;
            }

        }

        public static string Get(string key, IRedisClient client)
        {
            string value = client.Get<string>(key);
            return value;
        }

        public static List<string> GetList(string key, IRedisClient client)
        {
            return client.GetAllItemsFromList(key);
        }

        public static void Set(string key, string value, IRedisClient client)
        {
            client.Set(key, value);
        }

        public static void Remove(string key, IRedisClient client)
        {
            client.Remove(key);
        }
        public static void AddItemToList(string key, string value, IRedisClient client)
        {
            client.AddItemToList(key, value);
        }
    }
}