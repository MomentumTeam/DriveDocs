using System;
using ServiceStack.Redis;
using System.Collections.Generic;
namespace DriveWopi.Services
{
    public class RedisService
    {
        static RedisService()
        {
        }

        public static IRedisClient GenerateRedisClient(){
            try{
            RedisManagerPool manager = new RedisManagerPool(Config.RedisHost);
           //Console.WriteLine("REDIS HOST variable = "+Environment.GetEnvironmentVariable("REDIS_HOST"));
        //    RedisManagerPool manager = new RedisManagerPool(Environment.GetEnvironmentVariable("REDIS_HOST"));
            IRedisClient client =  client = manager.GetClient();
            return client;
            }
            catch(Exception e){
                throw e;
            }

        }

        public static string Get(string key, IRedisClient client)
        {
            string value = client.Get<string>(key);
            return value;
        }

        public static List<string> GetList(string key , IRedisClient client)
        {
            return client.GetAllItemsFromList(key);
        }

        public static void Set(string key, string value , IRedisClient client)
        {
            client.Set(key, value);
        }

        public static void Remove(string key , IRedisClient client)
        {
            client.Remove(key);
        }        
        public static void AddItemToList (string key, string value , IRedisClient client)
        {
            client.AddItemToList(key, value);
        }
    }
}