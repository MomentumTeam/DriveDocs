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
                bool needToCloseSomeSessions = false;
                lock (SessionManager._SyncObj)
                {
                    int usersCountBefore, usersCountAfter;
                    List<Session> allSessions = Session.GetAllSessions(client);
                    allSessions = allSessions.Where(x => x != null).ToList();
                    lock (allSessions)
                    {
                        Console.WriteLine(allSessions);
                        for (int i = 0; i < allSessions.Count; i++)
                        {
                            Session session = allSessions[i];
                            Console.WriteLine(session);
                            usersCountBefore = session.Users==null?0:session.Users.Count;
                            Console.WriteLine(usersCountBefore);
                            if (usersCountBefore == 0)
                            {
                                Console.WriteLine("X PRESS");
                                Console.WriteLine("USER FOR UPLOAD:"+session.UserForUpload);
                                if(session.UserForUpload != null){
                                    session.SaveToDrive(new User(session.UserForUpload));
                                }
                                session.DeleteSessionFromRedis();
                                allSessions[i] = null;
                                needToCloseSomeSessions = true;
                                continue;
                            }
                            userForUpload = session.Users[0];
                            //Update the file instead
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
                                    session.SaveToDrive(userForUpload);
                                    session.DeleteSessionFromRedis();
                                    allSessions[i] = null;
                                    needToCloseSomeSessions = true;
                                    continue;
                                }
                                else
                                {
                                    // string convertedSession = JsonConvert.SerializeObject(session);
                                    session.SaveToRedis();
                                }
                            }
                            if (session.LastUpdated.AddSeconds(Config.Closewait) < DateTime.Now || session.Users.Count == 0)
                            {
                                needToCloseSomeSessions = true;
                                // save the changes to the file
                                session.SaveToDrive(userForUpload);

                                session.DeleteSessionFromRedis();
                                allSessions[i] = null;
                                // clean up
                            }
                        }
                    }
                    allSessions = allSessions.Where(x => x != null).ToList();
                    if (needToCloseSomeSessions)
                    {
                        Session.UpdateSessionsListInRedis(allSessions, client);
                    }
                }
            }
            catch(Exception ex){
                // Console.WriteLine("Exception in CleanUp");
                throw ex;
            }

            }
        }
    }