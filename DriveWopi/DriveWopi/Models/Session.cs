using System;
using System.IO;
using System.Collections.Generic;
using Newtonsoft.Json;
using DriveWopi.Services;
using ServiceStack.Redis;
using System.Threading.Tasks;

namespace DriveWopi.Models
{
    public class Session
    {
        protected string _SessionId;
        protected DateTime _LastUpdated;

        protected string _LocalFilePath;
        protected List<User> _Users;

        protected LockStatus _LockStatus;

        protected string _LockString;

        protected bool _ChangesMade;

        protected User _UserForUpload = null;

        protected FileInfo _FileInfo;
        protected IRedisClient Client;

        public Session(string SessionId, string LocalFilePath)
        {
            _FileInfo = new FileInfo(LocalFilePath);
            _SessionId = SessionId;
            _LastUpdated = DateTime.Now;
            _LocalFilePath = LocalFilePath;
            _Users = new List<User>();
            _LockStatus = LockStatus.UNLOCK;
            _LockString = "";
            Client = RedisService.GenerateRedisClient();
            _ChangesMade = false;
        }


        public string SessionId
        {
            get { return _SessionId; }
            set { _SessionId = value; }
        }

         public bool ChangesMade
        {
            get { return _ChangesMade; }
            set { _ChangesMade = value; }
        }

        public User UserForUpload
        {
            get { return _UserForUpload; }
            set { _UserForUpload = value; }
        }
        public DateTime LastUpdated
        {
            get { return _LastUpdated; }
            set { _LastUpdated = value; }
        }
        public string LocalFilePath
        {
            get { return _LocalFilePath; }
            set { _LocalFilePath = value; }
        }
        
        public List<User> Users
        {
            get { return _Users; }
            set { _Users = value; }
        }
        public LockStatus LockStatus
        {
            get { return _LockStatus; }
            set { _LockStatus = value; }
        }
        public string LockString
        {
            get { return _LockString; }
            set { _LockString = value; }
        }

        public bool LocalFileExists(){
            return  _FileInfo.Exists;      
        }
        public CheckFileInfo GetCheckFileInfo(string userId, string userName, string name)
        {
            try
            {
                Console.WriteLine("name:"+_FileInfo.Name);
                CheckFileInfo cfi = new CheckFileInfo();
                cfi.SupportsCoauth = true;
                cfi.BaseFileName = name;
                //cfi.OwnerId = m_login;
                cfi.UserFriendlyName = userName;
                cfi.UserId = userId;
                lock (_FileInfo)
                {
                    if (_FileInfo.Exists)
                    {
                        cfi.Size = _FileInfo.Length;
                    }
                    else
                    {
                        FilesService.CreateBlankFile(_FileInfo.FullName);
                        _FileInfo = new FileInfo(_FileInfo.FullName);
                        cfi.Size = _FileInfo.Length;
                    }
                }

                cfi.Version = DateTime.Now.ToString("s");
               // cfi.HostEmbeddedEditUrl = Config.HostUrl + "/files/" + this._SessionId + "operation=edit";
               // cfi.HostEmbeddedViewUrl = Config.HostUrl + "/files/" + this._SessionId + "operation=view";
                //cfi.HostEditUrl = Config.HostUrl + "/files/" + this._SessionId + "operation=edit";
               // cfi.HostViewUrl = Config.HostUrl + "/files/" + this._SessionId + "operation=view";
                cfi.SupportsCoauth = true;
                cfi.SupportsCobalt = false;
                cfi.SupportsFolders = true;
                cfi.SupportsLocks = false;
                cfi.SupportsScenarioLinks = false;
                cfi.SupportsSecureStore = false;
                cfi.SupportsUpdate = true;
                cfi.UserCanWrite = true;
                cfi.LicenseCheckForEditIsEnabled = true;
                cfi.SupportsGetLock = true;

                return cfi;
            }
            catch (Exception e)
            {
                throw e;
            }
        }


        public void AddUser(string id)
        {
            _Users.Add(new User(id));
        }

        public void AddUser(string id,string authorization)
        {
            _Users.Add(new User(id,authorization));
        }

        public void AddUser(User user)
        {
            _Users.Add(user);
        }

        public void RemoveUser(string id)
        {
            
            Users.RemoveAll((User user) => { return user == null || user.Id.Equals(id); });
        }

        public void CopyUsers(List<User> users)
        {
            try
            {
                this.Users = new List<User>();
                foreach (User user in users)
                {
                    this.Users.Add(user);
                }
            }
            catch (Exception e)
            {
                throw e;
            }
        }

        public static Session GetSessionFromRedis(string sessionId, IRedisClient client)
        {
            //TODO Get from Redis and decode to Session object and return
            try
            {
                string session = RedisService.Get(sessionId, client);
                if (session == null)
                {
                    return null;
                }
                else
                {
                    // Session sessionObj = JsonConvert.DeserializeObject<Session>(session.ToString());
                    Dictionary<string, object> deserializedSessionDict = JsonConvert.DeserializeObject<Dictionary<string, Object>>(session.ToString(), new JsonSerializerSettings()
                    { ContractResolver = new IgnorePropertiesResolver(new[] { "Client" }) });
                    List<Dictionary<string, object>> UsersListDict = JsonConvert.DeserializeObject<List<Dictionary<string, Object>>>(deserializedSessionDict["Users"].ToString());
                    
                    Dictionary<string,object> userForUploadDict = deserializedSessionDict["UserForUpload"]==null? null : JsonConvert.DeserializeObject<Dictionary<string,object>>(deserializedSessionDict["UserForUpload"].ToString());
                    User userForUpload = userForUploadDict==null?null:new User((string)userForUploadDict["Id"], (DateTime)userForUploadDict["LastUpdated"],(string)userForUploadDict["Authorization"]);
                    Session sessionObj = new Session((string)deserializedSessionDict["SessionId"], (string)deserializedSessionDict["LocalFilePath"]);
                    sessionObj.LastUpdated = (DateTime)deserializedSessionDict["LastUpdated"];
                    string lockStatusAsString = ((long)deserializedSessionDict["LockStatus"]).ToString();
                    string lockStringAsString = (string)deserializedSessionDict["LockString"];
                    sessionObj.UserForUpload = userForUpload;
                    sessionObj.ChangesMade = (bool)deserializedSessionDict["ChangesMade"];
                    sessionObj.LockStatus = lockStatusAsString.Equals("1") ? LockStatus.LOCK : LockStatus.UNLOCK;
                    sessionObj.LockString = lockStringAsString;
                    foreach (Dictionary<string, object> userDict in UsersListDict)
                    {
                        User user = new User((string)userDict["Id"], (DateTime)userDict["LastUpdated"],(string)userDict["Authorization"]);
                        sessionObj.AddUser(user);
                    }
                    return sessionObj;
                }
            }
            catch (Exception e)
            {
                throw e;
            }
        }

        public static List<Session> GetAllSessions(IRedisClient client)
        {
            try
            {
                List<string> listIds = RedisService.GetList(Config.AllSessionsRedisKey, client);
                List<Session> sessionLists = new List<Session>();
                foreach (string sessionId in listIds)
                {
                    Session s = GetSessionFromRedis(sessionId, client);
                    sessionLists.Add(s);
                }
                return sessionLists;
            }
            catch (Exception e)
            {
                throw e;
            }
        }

        public void AddSessionToListInRedis()
        {
            RedisService.AddItemToList(Config.AllSessionsRedisKey, _SessionId, this.Client);
        }

        public static void UpdateSessionsListInRedis(List<Session> sessions, IRedisClient client)
        {
            //lihi
            //TODO save the list with the ids of sessions in redis
            try
            {
                RedisService.Remove(Config.AllSessionsRedisKey, client);
                foreach (Session s in sessions)
                {
                    s.AddSessionToListInRedis();
                }
            }
            catch (Exception e)
            {
                throw e;
            }
        }
        public void SaveToRedis()
        {
            try
            {
                string convertedSession = JsonConvert.SerializeObject(this, new JsonSerializerSettings()
                { ContractResolver = new IgnorePropertiesResolver(new[] { "Client" }) });
                RedisService.Set($"{this._SessionId}", convertedSession, this.Client);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        public bool SaveToDrive(User userForUpload)
        {
            try{
                bool ret =  Services.FilesService.UpdateFileInDrive(this._FileInfo,FilesService.GenerateAuthorizationToken(userForUpload),this._SessionId);
                return ret;
            }
            catch(Exception){
                return false;
                //throw ex;
            }
            
        }

        public void RemoveLocalFile()
        {
            try{
                if(LocalFileExists()){
                    Services.FilesService.RemoveFile(this._LocalFilePath);
                }
            }
            catch(Exception ex){
                throw ex;
            }

        }

        public void DeleteSessionFromRedis()
        {
            try{
                RedisService.Remove(this._SessionId, this.Client);
            }
            catch(Exception ex){
                throw ex;
            }

        }

        public byte[] GetFileContent()
        {
            try
            {
                byte[] content = Services.FilesService.GetFileContent(_FileInfo.FullName);
                return content;
            }
            catch (Exception e)
            {
                throw e;
            }
        }

        public void LockSession(string lockString)
        {
            _LockStatus = LockStatus.LOCK;
            _LockString = lockString;
            //Start timer
            //m_timer.Stop();
            //m_timer.Start();
        }
        public void UnlockSession(string lockString)
        {
            _LockStatus = LockStatus.UNLOCK;
            _LockString = lockString;
        }
        public void RefreshLock(string lockString)
        {
            LockSession(lockString);
        }
        public void UnlockAndRelock(string newLockString)
        {
            LockSession(newLockString);
        }

        public bool UserIsInSession(string userId)
        {
            try
            {
                return Users.Find((User u) => u.Id.Equals(userId)) != null;
            }
            catch (Exception e)
            {
                throw e;
            }
        }

        public bool Save(byte[] new_content, string user_id)
        {
            try
            {
                User user = _Users.Find(x => x.Id.Equals(user_id));
                if (user != null)
                {
                    Services.FilesService.Save(_FileInfo.Name, new_content);
                    _LastUpdated = DateTime.Now;
                    user.LastUpdated = DateTime.Now;
                    return true;
                }
                else
                {
                    AddUser(user_id);
                    Console.WriteLine(user_id + " not in session refresh the page");
                    return false;
                }
            }
            catch (Exception e)
            {
                throw e;
            }
        }
    }
}