using System;
using StackExchange.Redis;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using Microsoft.VisualBasic;

namespace DriveWopi.Services
{
    public class RedisService
    {
        public static ConnectionMultiplexer Redis;
        public static IDatabase DB;
        static RedisService(){
            var options = ConfigurationOptions.Parse(Config.RedisHost);
            options.Password = Config.RedisPassword;
            Redis = ConnectionMultiplexer.Connect(options);
            DB = Redis.GetDatabase();
        }

        public static string Get(string key)
        {
            try{
                var value = DB.StringGet(key);
                if(value.IsNull){
                    return null;
                }
                return (string)value;
            }
            catch(Exception ex){
                Config.logger.LogDebug("problem with getting from Redis, error:"+ex.Message);
                throw ex;

            }
        }


        public static void Set(string key, string value)
        {
            try{
                DB.StringSet(key, value);
            }
            catch(Exception ex){
                Config.logger.LogDebug("problem with set to Redis, error:"+ex.Message);
                throw ex;
            }
        }

        public static void Remove(string key)
        {
            try{
                DB.KeyDelete(key);
            }
            catch(Exception ex){
                Config.logger.LogDebug("problem with remove from Redis, error:"+ex.Message);
                throw ex;
            }
        }

        public static HashSet<string> GetSet(string key)
        {
            try{
                HashSet<string> setMembers = new HashSet<string>();
                string value = Get(key);
                if(value == null){
                    return setMembers;
                }
                else{
                    string[] ids = value.Split(',');
                    foreach(string id in ids) {
                        setMembers.Add(id);
                    }
                    return setMembers;
                }
            }
            catch(Exception ex){
                Config.logger.LogDebug("problem with GetSet from Redis, error:"+ex.Message);
                throw ex;
            }

        }

        public static void AddItemToSet(string key, string value)
        {
            try{
                HashSet<string> setMembers = GetSet(key);
                if(!setMembers.Contains(value)){
                    string newSetString = value;
                    foreach(string id in setMembers){
                        newSetString = newSetString + "," + id;
                    }
                    Set(key , newSetString);
                } 
            }
            catch(Exception ex){
                Config.logger.LogDebug("problem with AddItemToSet in Redis, error:"+ex.Message);
                throw ex;
            }
 
        }
    }
}