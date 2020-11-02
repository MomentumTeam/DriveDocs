using System;
using System.IO;
using System.Collections.Generic;
using Newtonsoft.Json;
using DriveWopi.Services;
using ServiceStack.Redis;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace DriveWopi.Models
{
    public class UpdateWorker
    {
        public string SessionId;
        public int FailedTries = 0;
        public UpdateWorker(string sessionId){
            this.SessionId = sessionId;
        }

        public bool UpdateInDrive(){
            if(this.FailedTries >= 6){
                return false;
            }
            Session session = null;
            IRedisClient client = null;
                try{
                    Thread.Sleep(Config.DriveUpdateTime*1000);
                    client = RedisService.GenerateRedisClient();
                    session = Session.GetSessionFromRedis(this.SessionId,client);
                    if(session == null){
                        return true;
                    }
                    bool updateResult = FilesService.UpdateSessionInDrive(this.SessionId);
                    if(!updateResult){
                        this.FailedTries++;
                        return this.UpdateInDrive();
                    }
                    else{
                        session.ChangesMade = false;
                        session.SaveToRedis();
                        return true;
                    }
                }
                catch(Exception error){
                    if(error is DriveNotFoundException){
                        try{
                            session.DeleteSessionFromAllSessionsInRedis(this.SessionId,client);
                            session.DeleteSessionFromRedis();
                            session.RemoveLocalFile();
                            return true;
                        }
                        catch(Exception){
                            this.FailedTries++;
                            return this.UpdateInDrive();
                        }
                    }
                    else{
                        this.FailedTries++;
                        return this.UpdateInDrive();
                    }
                }
        }

        public void Work(){
            try{
                this.UpdateInDrive();
            }
            catch(Exception e){
                throw e;
            }
        }
    }
}