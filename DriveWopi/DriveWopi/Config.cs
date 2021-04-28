using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

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

        public static string RedisPassword;
        public static string DriveUrl;
        public static int AccessTokenExpiringTime;
        public static bool CleanUpEnabled;

        public static int idleTime;

        public static int timerTime;
        public static int intervalTime;

        public static int DriveUpdateTime;

        public static string WebDAV_Server;
        public static string  AllSessionsRedisKey = "AllSessions";
        public static string AuthorizationToken;
        public static string OfficeEditorUrl;
        public static Dictionary<string, string> Mimetypes = new Dictionary<string, string>(){
        {".pptx","application/vnd.openxmlformats-officedocument.presentationml.presentation"},
        {".xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
        {".docx","application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
        };
        public static int Timeout; //Time period to perform cleanUp

        public static ILogger logger;

                static Config(){
            Folder = Environment.GetEnvironmentVariable("FOLDER");
            TemplatesFolder = Environment.GetEnvironmentVariable("TEMPLATE_FOLDER");
            Port =  int.Parse(Environment.GetEnvironmentVariable("PORT"));
            JwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
            RedisHost = Environment.GetEnvironmentVariable("REDIS_HOST")+":"+Environment.GetEnvironmentVariable("REDIS_PORT");
            RedisPassword = Environment.GetEnvironmentVariable("REDIS_PASSWORD");
            DriveUrl =  Environment.GetEnvironmentVariable("DRIVE_URL");
            AccessTokenExpiringTime =  int.Parse(Environment.GetEnvironmentVariable("TOKEN_EXPIRE"));
            AuthorizationToken=Environment.GetEnvironmentVariable("AUTHORIZATION_TOKEN");
            CleanUpEnabled = bool.Parse(Environment.GetEnvironmentVariable("CLEANUP_ENABLED"));
            WebDAV_Server =  Environment.GetEnvironmentVariable("WEBDAV_URL");

            OfficeEditorUrl = Environment.GetEnvironmentVariable("OFFICE_EDITOR_URL");

            //Time in seconds period to perform cleanUp
            Timeout =  int.Parse(Environment.GetEnvironmentVariable("CLEANUP_TIME")); 

            // Time in seconds after which the file is updated in drive still without closing the sesson in mill
            DriveUpdateTime = int.Parse(Environment.GetEnvironmentVariable("DRIVE_UPDATE_TIME"));
            
            DriveSecret = Environment.GetEnvironmentVariable("DRIVE_SECRET");

            idleTime = int.Parse(Environment.GetEnvironmentVariable("MAX_USER_IDLE"));

            intervalTime = int.Parse(Environment.GetEnvironmentVariable("INTERVAL_TIME"));

            timerTime = int.Parse(Environment.GetEnvironmentVariable("TIMER_TIME"));
        }
    }
}
