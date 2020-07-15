using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DriveWopi
{
    public class Config
    {
        public static string Folder;
        public static string TemplatesFolder;
        public static int Port;
        public static string JwtSecret;

        public static string DriveSecret;

        public static string RedisHost;
        public static string DriveUrl;
        public static int AccessTokenExpiringTime;

        public static int DriveUpdateTime;
        public static string  AllSessionsRedisKey = "AllSessions";
        public static string AuthorizationToken;
        public static Dictionary<string, string> Mimetypes = new Dictionary<string, string>(){
        {".pptx","application/vnd.openxmlformats-officedocument.presentationml.presentation"},
        {".xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
        {".docx","application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
        };
        public static int Timeout; //Time period to perform cleanUp
        public static int Closewait; // Time before the session is deleted after not being updated
        public static int Removewaituser; // Time before the user is deleted from the session after begin inactive
        
        public static int MaxRedisSessionTime;
        static Config(){
            Folder = Environment.GetEnvironmentVariable("FOLDER");
            TemplatesFolder = Environment.GetEnvironmentVariable("TEMPLATE_FOLDER");
            Port =  int.Parse(Environment.GetEnvironmentVariable("PORT"));
            JwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
            RedisHost = Environment.GetEnvironmentVariable("REDIS_PASSWORD")+ "@" + Environment.GetEnvironmentVariable("REDIS_HOST")+":"+Environment.GetEnvironmentVariable("REDIS_PORT");
            DriveUrl =  Environment.GetEnvironmentVariable("DRIVE_URL");
            AccessTokenExpiringTime =  int.Parse(Environment.GetEnvironmentVariable("TOKEN_EXPIRE"));
            AuthorizationToken=Environment.GetEnvironmentVariable("AUTHORIZATION_TOKEN");

            //Time period to perform cleanUp
            Closewait =  int.Parse(Environment.GetEnvironmentVariable("CLOSE_WAIT"));       

            //Time period to perform cleanUp
            Timeout =  int.Parse(Environment.GetEnvironmentVariable("TIME_OUT")); 

            // Time before the user is deleted from the session after begin inactive
            Removewaituser =  int.Parse(Environment.GetEnvironmentVariable("REMOVE_WAIT_USER"));
            
            // Time after which the session is surely deleted from redis in mil
            MaxRedisSessionTime = int.Parse(Environment.GetEnvironmentVariable("MAX_REDIS_SESSION_TIME"));

            // Time after which the file is updated in drive still without closing the sesson in mill
            DriveUpdateTime = int.Parse(Environment.GetEnvironmentVariable("DRIVE_UPDATE_TIME"));
            DriveSecret = Environment.GetEnvironmentVariable("DRIVE_SECRET");
        }
    }
}
