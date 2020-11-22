using System;
using System.Collections.Generic;
using System.Runtime;
using System.Linq;
using System.Threading.Tasks;
using Jose;
using Newtonsoft.Json;
using System.Text;
using DriveWopi.Services;
using Microsoft.Extensions.Logging;

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

                Dictionary<string, Object> dataDict = JsonConvert.DeserializeObject<Dictionary<string, Object>>(jsonString);
                //Dictionary<string, Object> dataDict = JsonConvert.DeserializeObject<Dictionary<string, Object>>(bigDict["data"].ToString());

                string create = dataDict["created"].ToString();
                //string operation = dataDict["operation"].ToString();
                string template = dataDict.ContainsKey("template") ? dataDict["template"].ToString() : null;
                Dictionary<string, string> user = JsonConvert.DeserializeObject<Dictionary<string, string>>(dataDict["user"].ToString());
                Dictionary<string, string> metadata = dataDict.ContainsKey("metadata") ? JsonConvert.DeserializeObject<Dictionary<string, string>>(dataDict["metadata"].ToString()) : null;

                // dict["uid"] = uid;
                //dict["operation"] = operation;
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
                Config.logger.LogError("DecodeJwt of {0} fail, error: {1}", jwt, e.Message);
                throw e;
            }
        }

        public static bool VerifyAccessToken(string fileId, string idFromToken, string created)
        {
            //TODO check expiring time
            if (idFromToken.Equals(fileId) && DateTimeOffset.Now.ToUnixTimeMilliseconds() - Convert.ToDouble(created) < Config.AccessTokenExpiringTime)
            {
                return true;
            }
            else
            {
                return false;
            }

        }


    }
}
