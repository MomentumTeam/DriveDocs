using System;
using System.Collections.Generic;
using System.Runtime;
using System.Linq;
using System.Threading.Tasks;
using Jose;
using Newtonsoft.Json;
using System.Text;
using DriveWopi.Services;
using ServiceStack.Redis;

namespace DriveWopi.Services
{
    public class AccessTokenVerifier
    {
        public static Dictionary<string, Object> DecodeJWT(string jwt)
        {
            try
            {
                byte[] secretKey = Encoding.ASCII.GetBytes(Config.JwtSecret);
                string jsonString = Jose.JWT.Decode(jwt, secretKey);
                Dictionary<string, Object> dict = new Dictionary<string, object>();

                Dictionary<string, Object> bigDict = JsonConvert.DeserializeObject<Dictionary<string, Object>>(jsonString);
                Dictionary<string, Object> dataDict = JsonConvert.DeserializeObject<Dictionary<string, Object>>(bigDict["data"].ToString());
                string uid = dataDict["uid"].ToString();
                string create = dataDict["created"].ToString();
                string operation = dataDict["operation"].ToString();
                string template = dataDict.ContainsKey("template") ? dataDict["template"].ToString() : null;
                Dictionary<string, string> user = JsonConvert.DeserializeObject<Dictionary<string, string>>(dataDict["user"].ToString());
                Dictionary<string, string> metadata = dataDict.ContainsKey("metadata") ? JsonConvert.DeserializeObject<Dictionary<string, string>>(dataDict["metadata"].ToString()) : null;

                dict["uid"] = uid;
                dict["operation"] = operation;
                dict["user"] = user;
                dict["created"] = create;
                if (metadata != null)
                {
                    dict["metadata"] = metadata;
                }
                if (template != null)
                {
                    dict["template"] = template;
                }
                return dict;
            }
            catch (Exception e)
            {
                throw e;
            }
        }

        public static string GetUidFromRedis(string userId, IRedisClient client)
        {
            try
            {
                string uid = RedisService.Get(userId, client);
                return uid;
            }
            catch (Exception ex)
            {
                throw ex;
            }

        }
        public static void RemoveUidFromRedis(string userId, IRedisClient client)
        {
            RedisService.Remove(userId, client);
        }


        public static double Time1970()
        {
            DateTime dt1970 = new DateTime(1970, 1, 1);
            DateTime current = DateTime.Now;//DateTime.UtcNow for unix timestamp
            TimeSpan span = current - dt1970;
            return span.TotalMilliseconds;
        }
        public static bool VerifyAccessToken(string fileId, string uidFromToken, string created)
        {
            //TODO check expiring time
            if (uidFromToken.Equals(fileId) && DateTimeOffset.Now.ToUnixTimeMilliseconds() - Convert.ToDouble(created) < Config.AccessTokenExpiringTime)
            {
                //RemoveUidFromRedis(userId , client);
                return true;
            }
            else
            {
                return false;
            }

        }


    }
}
