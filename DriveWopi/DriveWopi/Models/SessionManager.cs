using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;
using Newtonsoft.Json;
using DriveWopi.Services;
using ServiceStack.Redis;

namespace DriveWopi.Models
{
    public class SessionManager
    {
        private static volatile SessionManager _Instance;
        private static object _SyncObj = new object();
        private Timer _Timer;

        public static SessionManager Instance
        {
            get
            {
                if (SessionManager._Instance == null)
                {
                    lock (SessionManager._SyncObj)
                    {
                        if (SessionManager._Instance == null)
                            SessionManager._Instance = new SessionManager();
                    }
                }
                return SessionManager._Instance;
            }
        }

        public SessionManager()
        {
            var logger = NLog.Web.NLogBuilder.ConfigureNLog("nlog.config").GetCurrentClassLogger();
            _Timer = new Timer(Config.Timeout*1000);
            _Timer.AutoReset = true;
            _Timer.Elapsed += CleanUp;
            _Timer.Enabled = Config.CleanUpEnabled;
            logger.Debug("SessionManager created");
        }

        private void CleanUp(object sender, ElapsedEventArgs e)
        {
            try
            {
                var logger = NLog.Web.NLogBuilder.ConfigureNLog("nlog.config").GetCurrentClassLogger();
                logger.Debug("CleanUp : "+ DateTime.Now);
                IRedisClient client = RedisService.GenerateRedisClient();
                bool needToCloseSomeSessions = false;
                List<Session> allSessions = Session.GetAllSessions(client);
                allSessions = allSessions.Where(x => x != null).ToList();
                for (int i = 0; i < allSessions.Count; i++)
                {
                    Session session = allSessions[i];
                    Console.WriteLine(session.Users.Count);
                    if (session.Users.Count == 0 && !session.ChangesMade) {
                        needToCloseSomeSessions = true;
                        allSessions[i] = null;
                        session.DeleteSessionFromRedis();
                        session.RemoveLocalFile();
                    }

                    session.Users.RemoveAll((User user) =>
                    {
                        int maxTime = Config.intervalTime + Config.idleTime;
                        if (user.LastUpdated.AddSeconds(maxTime) < DateTime.Now)
                        {
                            Console.WriteLine("x problem");
                            logger.Debug("user {0} LastUpdated time pased", user.Id);
                            return true;
                        }
                        else
                        {
                            return false;
                        }
                    });
                }
                allSessions = allSessions.Where(x => x != null).ToList();
                if (needToCloseSomeSessions){
                    Session.UpdateSessionsListInRedis(allSessions, client);
                }
            }
            catch (Exception ex){
                var logger = NLog.Web.NLogBuilder.ConfigureNLog("nlog.config").GetCurrentClassLogger();
                logger.Error("status:500, cleanUp fail, error: " + ex.Message);
                throw ex;
            }

        }
    }
}