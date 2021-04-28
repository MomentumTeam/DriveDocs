using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using DriveWopi.Models;
using DriveWopi.Services;
using DriveWopi.Exceptions;
using System.Threading;
using Newtonsoft.Json;
using System.Net;
using System.Net.Http;
using System.IO;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Text.Json;
using Newtonsoft.Json.Linq;
using Microsoft.Extensions.Logging;

namespace DriveWopi.Controllers
{
    [Route("wopi/[controller]")]
    [ApiController]
    public class FilesController : ControllerBase
    {
        private static ILogger<FilesController> _logger;

        public FilesController(ILogger<FilesController> logger)
        {
            _logger = logger;
            Config.logger = _logger;
        }

        // CheckFileInfo
        // GET: wopi/Files/5
        [HttpGet("{id}", Name = "CheckFileInfo")]
        [Produces("application/json")]
        public async Task<IActionResult> CheckFileInfo(string id, [FromQuery] string access_token)
        {
            try
            {
                Config.logger.LogDebug("CheckFileInfo: id="+id);
                if (string.IsNullOrEmpty(access_token))
                {
                    Config.logger.LogError("status:500 accessToken is null");
                    return StatusCode(500);
                }
                Dictionary<string, Object> token = AccessTokenVerifier.DecodeJWT(access_token);
                Dictionary<string, string> user = (Dictionary<string, string>)token["user"];
                Dictionary<string, string> metadata = (Dictionary<string, string>)token["metadata"];

                if (!AccessTokenVerifier.VerifyAccessToken(id, (string)metadata["id"], (string)token["created"]))
                {
                    Config.logger.LogError("status:500 accessToken is illegal");
                    return StatusCode(500); //access token is illegal
                }
                var sessionContext = Request.Headers["X-WOPI-SessionContext"];
                string idToDownload = id;
                string fileName = Config.Folder + "/" + metadata["id"] + "." + metadata["type"];
                Session editSession = Session.GetSessionFromRedis(id);
                if (editSession == null)
                {
                    FilesService.DownloadFileFromDrive(idToDownload, fileName, user["authorization"]);
                    editSession = new Session(id, fileName);
                    editSession.SaveToRedis();
                    editSession.AddSessionToSetInRedis();
                    Config.logger.LogDebug("New session added to Redis for id=" + id);
                }
                if (!editSession.UserIsInSession(user["id"]))
                {
                    Config.logger.LogDebug("add new user to session");
                    editSession.AddUser(user["id"], user["authorization"], user["permission"], user["name"]);
                    editSession.SaveToRedis();
                    Config.logger.LogDebug("Added user {0} to session {1}", user["id"], id);
                }
                CheckFileInfo checkFileInfo = editSession.GetCheckFileInfo(user["id"], user["name"], metadata["name"]);
                return Ok(checkFileInfo);
            }
            catch (Exception ex)
            {
                if (ex is DriveFileNotFoundException)
                {
                    Config.logger.LogError("status:404 CheckFileInfo Drive Error" + ex.Message);
                    return StatusCode(404);
                }
                else
                {
                    Config.logger.LogError("status:500, CheckFileInfo Error:" + ex.Message);
                    return StatusCode(500);
                }
            }
        }

        // GetFile
        // GET: wopi/files/5/contents
        [HttpGet("{id}/contents", Name = "GetFileContents")]
        public async Task<IActionResult> GetFileContents(string id, [FromQuery] string access_token)
        {
            Config.logger.LogDebug("GetFileContents: id="+id);
            try
            {
                if (string.IsNullOrEmpty(access_token))
                {
                    Config.logger.LogError("status:500 accessToken is null");
                    return StatusCode(500);
                }
                Dictionary<string, Object> token = AccessTokenVerifier.DecodeJWT(access_token);
                Dictionary<string, string> user = (Dictionary<string, string>)token["user"];
                Dictionary<string, string> metadata = (Dictionary<string, string>)token["metadata"];

                if (!AccessTokenVerifier.VerifyAccessToken(id, (string)metadata["id"], (string)token["created"]))
                {
                    Config.logger.LogError("status:500 accessToken is illegal");
                    return StatusCode(500); //access token is illegal
                }
                Session editSession = Session.GetSessionFromRedis(id);
                if (editSession == null)
                {
                    Config.logger.LogError("status:500 the session is null");
                    return StatusCode(500);
                }
                byte[] content = editSession.GetFileContent();
                Config.logger.LogDebug("the file {0} opens successfully", id);
                return File(content, "application/octet-stream", id);
            }
            catch (Exception e)
            {
                if (e is DriveFileNotFoundException)
                {
                    Config.logger.LogError("status:404 GetFileContents Drive Error" + e.Message);
                    return StatusCode(404);
                }
                else
                {
                    Config.logger.LogError("status:500, GetFileContents Error:" + e.Message);
                    return StatusCode(500);
                }
            }
        }

        // PutFile
        // POST: wopi/files/5/contents
        [HttpPost("{id}/contents")]

        public async Task<IActionResult> PutFile(string id, [FromQuery] string access_token)
        {
            Config.logger.LogDebug("PutFile: id="+id);
            try
            {
                if (string.IsNullOrEmpty(access_token))
                {
                    Config.logger.LogError("status:500 accessToken is null");
                    return StatusCode(500);
                }
                Dictionary<string, Object> token = AccessTokenVerifier.DecodeJWT(access_token);
                Dictionary<string, string> user = (Dictionary<string, string>)token["user"];
                Dictionary<string, string> metadata = (Dictionary<string, string>)token["metadata"];
                if (!AccessTokenVerifier.VerifyAccessToken(id, (string)metadata["id"], (string)token["created"]))
                {
                    Config.logger.LogError("status:500 accessToken is illegal");
                    return StatusCode(500);
                }

                Session editSession = Session.GetSessionFromRedis(id);
                if (editSession == null)
                {
                    Config.logger.LogError("status:500 the session is null");
                    return StatusCode(500);
                }
                string fileName = editSession.LocalFilePath;

                if (!FilesService.FileExists(fileName))
                {
                    Config.logger.LogError("status:404 the file is not exsist");
                    return StatusCode(404);
                }

                string lockValue = editSession.LockString;
                string operation, xWopiLock = null;
                string[] xWopiEditors;
                var content = default(byte[]);
                using (var memstream = new MemoryStream())
                {
                    memstream.Flush();
                    memstream.Position = 0;
                    Request.Body.CopyTo(memstream);
                    content = memstream.ToArray();
                }

                Request.Headers.TryGetValue("X-WOPI-Override", out var xWopiOverrideHeader);
                if (xWopiOverrideHeader.Count != 1 || string.IsNullOrWhiteSpace(xWopiOverrideHeader.FirstOrDefault()))
                {
                    Config.logger.LogError("status:400, X-WOPI-Override header not found");
                    return StatusCode(400);
                }
                else
                {
                    operation = xWopiOverrideHeader.FirstOrDefault();
                }

                Request.Headers.TryGetValue("X-WOPI-Lock", out var xWopiLockHeader);
                if (xWopiLockHeader.Count > 0 && (!string.IsNullOrWhiteSpace(xWopiLockHeader.FirstOrDefault())))
                {
                    xWopiLock = xWopiLockHeader.FirstOrDefault();
                }

                Request.Headers.TryGetValue("X-WOPI-Editors", out var xWopiEditorsHeader);
                if (xWopiEditorsHeader.Count > 0 && string.IsNullOrWhiteSpace(xWopiEditorsHeader.FirstOrDefault()))
                {
                    xWopiEditors = xWopiLockHeader.FirstOrDefault().Split(",");
                }

                switch (operation)
                {
                    case "PUT":
                        if (xWopiLock == null || lockValue.Equals(xWopiLock))
                        {
                            if (editSession.Save(content, user["id"]))
                            {
                                bool needWorker = !editSession.ChangesMade;
                                editSession.ChangesMade = true;
                                editSession.UserForUpload = new User(user["id"], user["authorization"]);
                                editSession.SaveToRedis();
                                if(needWorker){
                                    UpdateWorker worker = new UpdateWorker(id);
                                    Thread t = new Thread(new ThreadStart(worker.Work));
                                    t.Start();
                                }
                                Config.logger.LogDebug("status 200, the session {0} saved in redis", editSession.SessionId);
                                return StatusCode(200);
                            }
                            else
                            {
                                //User unauthorized
                                Config.logger.LogError("status 404, save session {0} is fail", editSession.SessionId);
                                return StatusCode(404);
                            }
                        }
                        else
                        {
                            Response.Headers.Add("X-WOPI-Lock", lockValue);
                            Config.logger.LogError("status:409, lock value isnt the same");
                            return StatusCode(409);
                        }
                    //TODO case "RELATIVE_PUT"
                    default:
                        {
                            Config.logger.LogError("status 500, Put fail");
                            return StatusCode(500);
                        }

                }
            }
            catch (Exception e)
            {
                if (e is DriveFileNotFoundException)
                {
                    Config.logger.LogError("status:404 PutFile Drive Error" + e.Message);
                    return StatusCode(404);
                }
                else
                {
                    Config.logger.LogError("status:500, PutFile Error:" + e.Message);
                    return StatusCode(500);
                }
            }
        }

        // POST: api/Files
        [HttpPost("{id}", Name = "lockMethods")]
        public async Task<IActionResult> Lock(string id, [FromQuery] string access_token)
        {
            try
            {
                Config.logger.LogDebug("Lock: id="+id);
                if (string.IsNullOrEmpty(access_token))
                {
                    Config.logger.LogError("status:500 accessToken is null");
                    return StatusCode(500);
                }
                Dictionary<string, Object> token = AccessTokenVerifier.DecodeJWT(access_token);
                Dictionary<string, string> metadata = (Dictionary<string, string>)token["metadata"];
                Dictionary<string, string> user = (Dictionary<string, string>)token["user"];
                if (!AccessTokenVerifier.VerifyAccessToken(id, (string)metadata["id"], (string)token["created"]))
                {
                    Config.logger.LogError("status:500 accessToken is illegal");
                    return StatusCode(500); //access token is illegal
                }
                Session editSession = Session.GetSessionFromRedis(id);
                string fileName = editSession.LocalFilePath;
                if (!FilesService.FileExists(fileName))
                {
                    Config.logger.LogError("status:404 the file {0} is not exsist", fileName);
                    return StatusCode(404);
                }
                string lockValue, operation, xWopiLock, xWopiOldLock = "";
                editSession = Session.GetSessionFromRedis(id);
                if (editSession == null)
                {
                    Config.logger.LogError("status:500 the session is null");
                    return StatusCode(500);
                }
                Request.Headers.TryGetValue("X-WOPI-Override", out var xWopiOverrideHeader);
                if (xWopiOverrideHeader.Count != 1 || string.IsNullOrWhiteSpace(xWopiOverrideHeader.FirstOrDefault()))
                {
                    Config.logger.LogError("status:400, X-WOPI-Override header not found");
                    return StatusCode(400);
                }
                else
                {
                    operation = xWopiOverrideHeader.FirstOrDefault();
                }
                Request.Headers.TryGetValue("X-WOPI-Lock", out var xWopiLockHeader);
                if ((xWopiLockHeader.Count != 1 || string.IsNullOrWhiteSpace(xWopiLockHeader.FirstOrDefault())) && operation != "GET_LOCK")
                {
                    Config.logger.LogError("status:400, X-WOPI-Lock header not found");
                    return StatusCode(400);
                }
                else
                {
                    xWopiLock = xWopiLockHeader.FirstOrDefault();
                }
                if (operation == "LOCK")
                {
                    Request.Headers.TryGetValue("X-WOPI-OldLock", out var xWopiOldLockHeader);
                    if (xWopiOldLockHeader.Count > 0 && (!string.IsNullOrWhiteSpace(xWopiOldLockHeader.FirstOrDefault())))
                    {
                        operation = "UNLOCK_RELOCK";
                        xWopiOldLock = xWopiOldLockHeader.FirstOrDefault();
                    }
                }
                switch (operation)
                {
                    case "LOCK":
                        lockValue = editSession.LockString;
                        if (lockValue.Equals(""))
                        {
                            editSession.LockSession(xWopiLock);
                            editSession.SaveToRedis();
                            Config.logger.LogDebug("status:200, the session {0} locked", editSession.SessionId);
                            return StatusCode(200);
                        }
                        else if (!lockValue.Equals(xWopiLock))
                        {
                            Response.Headers.Add("X-WOPI-Lock", lockValue);
                            Config.logger.LogError("status:409, lock value isnt the same");
                            return StatusCode(409);
                        }
                        else
                        {
                            editSession.RefreshLock(lockValue);
                            editSession.SaveToRedis();
                            return StatusCode(200);
                        }
                    case "GET_LOCK":
                        lockValue = editSession.LockString;
                        Response.Headers.Add("X-WOPI-Lock", lockValue);
                        Config.logger.LogDebug("status200, GET_LOCKsession {0} success ", editSession.SessionId);
                        return StatusCode(200);
                    case "REFRESH_LOCK":
                        lockValue = editSession.LockString;
                        if (!xWopiLock.Equals(lockValue))
                        {
                            Response.Headers.Add("X-WOPI-Lock", lockValue);
                            Config.logger.LogError("status:409, lock value isnt the same");
                            return StatusCode(409);
                        }
                        else
                        {
                            editSession.RefreshLock(xWopiLock);
                            editSession.SaveToRedis();
                            Config.logger.LogDebug("status:200, RefreshLockSession {0} success ", editSession.SessionId);
                            return StatusCode(200);
                        }
                    case "UNLOCK":
                        lockValue = editSession.LockString;
                        if (!xWopiLock.Equals(lockValue))
                        {
                            Response.Headers.Add("X-WOPI-Lock", lockValue);
                            Config.logger.LogError("status:409, lock value isnt the same");
                            return StatusCode(409);
                        }
                        else
                        {
                            editSession.UnlockSession(lockValue);
                            editSession.Users.RemoveAll((User sessionUser) =>
                            {
                                return sessionUser.Id.Equals(user["id"]);
                            });
                            editSession.SaveToRedis();
                            Config.logger.LogDebug("status:200, UnlockSession {0} success ", editSession.SessionId);
                            return StatusCode(200);
                        }
                    case "UNLOCK_RELOCK":
                        lockValue = editSession.LockString;
                        if (!xWopiOldLock.Equals(lockValue))
                        {
                            Response.Headers.Add("X-WOPI-Lock", lockValue);
                            Config.logger.LogError("status:409, lock value isnt the same");
                            return StatusCode(409);
                        }
                        else
                        {
                            editSession.UnlockAndRelock(xWopiLock);
                            editSession.SaveToRedis();
                            Config.logger.LogDebug("status:200, UnlUnlockAndRelockSession {0} success ", editSession.SessionId);
                            return StatusCode(200);
                        }
                    default:
                        {
                            Config.logger.LogError("status:500, Lock method fail");
                            return StatusCode(500);
                        }
                }
            }
            catch (Exception e)
            {
                Config.logger.LogError("status:500, Lock error:" + e.Message);
                return StatusCode(500);
            }
        }
    }
}
