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
            _Timer = new Timer(Config.Timeout);
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
                bool needToCloseSomeSessions = false, needToDeleteSession = false;
                int usersCountBefore, usersCountAfter;
                List<Session> allSessions = Session.GetAllSessions(client);
                allSessions = allSessions.Where(x => x != null).ToList();
                for (int i = 0; i < allSessions.Count; i++)
                {
                    needToDeleteSession = false;
                    Session session = allSessions[i];
                    usersCountBefore = session.Users == null ? 0 : session.Users.Count;

                    // Delete session from Redis after maximum 24 hours
                    if (session.LastUpdated.AddSeconds(Config.MaxRedisSessionTime) < DateTime.Now)
                    {
                        needToDeleteSession = true;
                    }
                    else if (usersCountBefore == 0 && (!session.ChangesMade))
                    {
                        needToDeleteSession = true;
                    }
                    else{
                        session.Users.RemoveAll((User user) =>{
                        if (user.LastUpdated.AddSeconds(Config.Removewaituser) < DateTime.Now){
                            logger.Debug("user {0} LastUpdated time pased", user.Id);
                            return true;
                        }
                        else{
                            return false;
                        }
                        });
                        usersCountAfter = session.Users.Count;
                        if (usersCountAfter != usersCountBefore){
                            logger.Debug("the number of users on the session {0} has changed", session.SessionId);
                            if (usersCountAfter == 0 && (!session.ChangesMade)){
                                needToDeleteSession = true;
                            }
                            else{
                                session.SaveToRedis();
                            }
                        }
                    }
                    if(needToDeleteSession){
                        needToCloseSomeSessions = true;
                        allSessions[i] = null;
                        session.DeleteSessionFromRedis();
                        session.RemoveLocalFile();
                    }
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