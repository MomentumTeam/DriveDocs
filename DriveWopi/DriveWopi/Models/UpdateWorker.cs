using System;
using System.IO;
using System.Collections.Generic;
using Newtonsoft.Json;
using DriveWopi.Services;
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
                try{
                    Config.logger.LogDebug("changes detected in file {0} wait 30 seconds to save", this.SessionId);
                    Thread.Sleep(Config.DriveUpdateTime*1000);
                    session = Session.GetSessionFromRedis(this.SessionId);
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
                            session.DeleteSessionFromAllSessionsInRedis(this.SessionId);
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
                Config.logger.LogDebug("Create a new worker for file {0}", this.SessionId);
                this.UpdateInDrive();
            }
            catch(Exception e){
                throw e;
            }
        }
    }
}