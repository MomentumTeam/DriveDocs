using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;
using Newtonsoft.Json;
using DriveWopi.Services;

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
                bool needToCloseSomeSessions = false;
                HashSet<Session> allSessions = Session.GetAllSessions();
                List<Session> allSessionsList = allSessions.Where(x => x != null).ToList();
                for (int i = 0; i < allSessionsList.Count; i++)
                {
                    
                    Session session = allSessionsList[i];
                    if (session.Users.Count == 0 && !session.ChangesMade) {
                        needToCloseSomeSessions = true;
                        allSessionsList[i] = null;
                        session.DeleteSessionFromRedis();
                        session.RemoveLocalFile();
                        logger.Debug("Delete session "+ allSessionsList[i] + "- All useres left and no changes made");
                    } else {
                        session.Users.RemoveAll((User user) => {
                            int maxTime = Config.intervalTime + Config.idleTime + Config.timerTime;
                            if (user.LastUpdated.AddSeconds(maxTime) < DateTime.Now)
                            {
                                logger.Debug("Remove user {0} from cleanUp", user.Id);
                                return true;
                            }
                            else
                            {
                                return false;
                            }
                        });
                        session.SaveToRedis();
                    }
                }
                allSessionsList = allSessionsList.Where(x => x != null).ToList();
                if (needToCloseSomeSessions){
                    Session.UpdateSessionsSetInRedis(new HashSet<Session>(allSessionsList));
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