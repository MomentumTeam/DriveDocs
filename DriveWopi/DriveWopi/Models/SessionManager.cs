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
            _Timer = new Timer(Config.Timeout);
            _Timer.AutoReset = true;
            _Timer.Elapsed += CleanUp;
            _Timer.Enabled = true;
        }

        private void CleanUp(object sender, ElapsedEventArgs e)
        {
            try{
                IRedisClient client = RedisService.GenerateRedisClient();
                User userForUpload = null;
                Console.WriteLine("CleanUp");
                bool needToCloseSomeSessions = false , updateSuccess = true;
                    int usersCountBefore, usersCountAfter;
                    List<Session> allSessions = Session.GetAllSessions(client);
                    allSessions = allSessions.Where(x => x != null).ToList();
                        for (int i = 0; i < allSessions.Count; i++)
                        {
                            Session session = allSessions[i];

                            if (session.LastUpdated.AddSeconds(Config.MaxRedisSessionTime) < DateTime.Now)
                            {
                                needToCloseSomeSessions = true;
                                session.DeleteSessionFromRedis();
                                allSessions[i] = null;
                                session.RemoveLocalFile();
                                continue;
                            }

                            usersCountBefore = session.Users==null?0:session.Users.Count;
                            // Zero users in the sessions
                            if (usersCountBefore == 0)
                            {
                                updateSuccess = true;
                                if(session.ChangesMade && session.UserForUpload != null){
                                    updateSuccess = session.SaveToDrive(session.UserForUpload);
                                }
                                // UserForUpload is null or upload was successful
                                if(updateSuccess){
                                    session.DeleteSessionFromRedis();
                                    session.RemoveLocalFile();
                                    allSessions[i] = null;
                                    needToCloseSomeSessions = true;
                                }
                                continue;
                            }

                            userForUpload = session.Users[0];
                            session.Users.RemoveAll((User user) =>
                            {
                                if (user.LastUpdated.AddSeconds(Config.Removewaituser) < DateTime.Now)
                                {
                                    return true;
                                }
                                else
                                {
                                    return false;
                                }
                            });

                            usersCountAfter = session.Users.Count;
                            if (usersCountAfter != usersCountBefore)
                            {
                                if (usersCountAfter == 0)
                                {
                                    updateSuccess = session.ChangesMade?session.SaveToDrive(userForUpload):true;
                                    if(updateSuccess){
                                        session.DeleteSessionFromRedis();
                                        session.RemoveLocalFile();
                                        allSessions[i] = null;
                                        needToCloseSomeSessions = true;
                                    }
                                    else{
                                        session.SaveToRedis();
                                    }
                                    continue;
                                }
                                else
                                {
                                    session.SaveToRedis();
                                }
                            }

                            if (session.LastUpdated.AddSeconds(Config.Closewait) < DateTime.Now)
                            {
                                // save the changes to the file and close session
                                updateSuccess = session.ChangesMade?session.SaveToDrive(userForUpload):true;
                                if(updateSuccess){
                                    needToCloseSomeSessions = true;
                                    session.RemoveLocalFile();
                                    session.DeleteSessionFromRedis();
                                    allSessions[i] = null;
                                }
                                continue;
                            }

                            if (session.ChangesMade && session.LastUpdated.AddSeconds(Config.DriveUpdateTime) < DateTime.Now)
                            {
                                // save the changes to the file
                                updateSuccess = session.SaveToDrive(userForUpload);
                                if(updateSuccess){
                                    session.ChangesMade = false;
                                    session.SaveToRedis();
                                }

                            }
                        }
                    allSessions = allSessions.Where(x => x != null).ToList();
                    if (needToCloseSomeSessions)
                    {
                        Session.UpdateSessionsListInRedis(allSessions, client);
                    }
            }
            catch(Exception ex){
                throw ex;
            }

            }
        }
    }