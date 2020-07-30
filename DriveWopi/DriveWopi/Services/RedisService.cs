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
            try{
                string value = client.Get<string>(key);
                return value;
            }
            catch(Exception ex){
                Config.logger.LogDebug("problem with getting from Redis, error:"+ex.Message);
                throw ex;

            }
        }

        public static List<string> GetList(string key, IRedisClient client)
        {
            try{
                return client.GetAllItemsFromList(key);
            }
            catch(Exception ex){
                Config.logger.LogDebug("problem with GetList from Redis, error:"+ex.Message);
                throw ex;
            }

        }

        public static void Set(string key, string value, IRedisClient client)
        {
            try{
                client.Set(key, value);
            }
            catch(Exception ex){
                Config.logger.LogDebug("problem with set to Redis, error:"+ex.Message);
                throw ex;
            }
        }

        public static void Remove(string key, IRedisClient client)
        {
            try{
                client.Remove(key);
            }
            catch(Exception ex){
                Config.logger.LogDebug("problem with remove from Redis, error:"+ex.Message);
                throw ex;
            }
        }
        public static void AddItemToList(string key, string value, IRedisClient client)
        {
            try{
                client.AddItemToList(key, value);
            }
            catch(Exception ex){
                Config.logger.LogDebug("problem with AddItemToList in Redis, error:"+ex.Message);
                throw ex;
            }
 
        }
    }
}