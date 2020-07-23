using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using DriveWopi.Models;
using DriveWopi.Services;
using DriveWopi.Exceptions;
using Newtonsoft.Json;
using System.Net;
using System.Net.Http;
using System.IO;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Text.Json;
using Newtonsoft.Json.Linq;
using ServiceStack.Redis;
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
                Config.logger.LogDebug("enter CheckFileInfo");
                if (string.IsNullOrEmpty(access_token))
                {
                    Config.logger.LogError("status:500 accessToken is null");
                    return StatusCode(500);
                }
                IRedisClient client = RedisService.GenerateRedisClient();
                Dictionary<string, Object> token = AccessTokenVerifier.DecodeJWT(access_token);
                Dictionary<string, string> user = (Dictionary<string, string>)token["user"];
                Dictionary<string, string> metadata = (Dictionary<string, string>)token["metadata"];

                if (!AccessTokenVerifier.VerifyAccessToken(id, (string)metadata["id"], (string)token["created"]))
                {
                    Config.logger.LogError("status:500 accessToken is illegal");
                    return StatusCode(500); //access token is illegal
                }
                var sessionContext = Request.Headers["X-WOPI-SessionContext"];
                string idToDownload = token.ContainsKey("template") ? token["template"].ToString() : id;
                string fileName = Config.Folder + "/" + metadata["id"] + "." + metadata["type"];
                Session editSession = Session.GetSessionFromRedis(id, client);
                if (editSession == null)
                {
                    Config.logger.LogDebug("create new session");
                    FilesService.DownloadFileFromDrive(idToDownload, fileName, user["authorization"]);
                    editSession = new Session(id, fileName);
                    editSession.SaveToRedis();
                    editSession.AddSessionToListInRedis();
                }
                if (!editSession.UserIsInSession(user["id"]))
                {
                    Config.logger.LogDebug("add new user to session");
                    editSession.AddUser(user["id"], user["authorization"]);
                    editSession.SaveToRedis();
                }
                CheckFileInfo checkFileInfo = editSession.GetCheckFileInfo(user["id"], user["name"], metadata["name"]);
                return Ok(checkFileInfo);
            }
            catch (Exception e)
            {
                if (e is DriveFileNotFoundException)
                {
                    Config.logger.LogError("status:404 CheckFileInfo Drive LogError" + e.Message);
                    return StatusCode(404);
                }
                else
                {
                    Config.logger.LogError("status:500, CheckFileInfo LogError:" + e.Message);
                    return StatusCode(500);
                }
            }
        }

        // GetFile
        // GET: wopi/files/5/contents
        [HttpGet("{id}/contents", Name = "GetFileContents")]
        public async Task<IActionResult> GetFileContents(string id, [FromQuery] string access_token)
        {
            Config.logger.LogDebug("enter GetFileContents");
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
                IRedisClient client = RedisService.GenerateRedisClient();
                Session editSession = Session.GetSessionFromRedis(id, client);
                if (editSession == null)
                {
                    return StatusCode(500);
                }
                byte[] content = editSession.GetFileContent();
                return File(content, "application/octet-stream", id);
            }
            catch (Exception e)
            {
                if (e is DriveFileNotFoundException)
                {
                    Config.logger.LogError("status:404 GetFileContents Drive LogError" + e.Message);
                    return StatusCode(404);
                }
                else
                {
                    Config.logger.LogError("status:500, GetFileContents LogError:" + e.Message);
                    return StatusCode(500);
                }
            }
        }

        // PutFile
        // POST: wopi/files/5/contents
        [HttpPost("{id}/contents")]

        public async Task<IActionResult> PutFile(string id, [FromQuery] string access_token)
        {
            Config.logger.LogDebug("enter PutFile");
            try
            {
                if (string.IsNullOrEmpty(access_token))
                {
                    Config.logger.LogError("status:500 accessToken is null");
                    return StatusCode(500);
                }
                IRedisClient client = RedisService.GenerateRedisClient();
                Dictionary<string, Object> token = AccessTokenVerifier.DecodeJWT(access_token);
                Dictionary<string, string> user = (Dictionary<string, string>)token["user"];
                Dictionary<string, string> metadata = (Dictionary<string, string>)token["metadata"];
                if (!AccessTokenVerifier.VerifyAccessToken(id, (string)metadata["id"], (string)token["created"]))
                {
                    Config.logger.LogError("status:500 accessToken is illegal");
                    return StatusCode(500); //access token is illegal
                }

                Session editSession = Session.GetSessionFromRedis(id, client);
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
                    //explain
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
                                editSession.ChangesMade = true;
                                editSession.SaveToRedis();
                                Config.logger.LogDebug("status 200, the file saved");
                                return StatusCode(200);
                            }
                            else
                            {
                                //User unauthorized
                                Config.logger.LogError("status 404, save file is fail");
                                return StatusCode(404);
                            }
                        }
                        else
                        {
                            Response.Headers.Add("X-WOPI-Lock", lockValue);
                            return StatusCode(409);
                        }
                    //TODO case "RELATIVE_PUT"
                    default:
                        return StatusCode(500);
                }
            }
            catch (Exception e)
            {
                if (e is DriveFileNotFoundException)
                {
                    Config.logger.LogError("status:404 PutFile Drive LogError" + e.Message);
                    return StatusCode(404);
                }
                else
                {
                    Config.logger.LogError("status:500, PutFile LogError:" + e.Message);
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
                Config.logger.LogDebug("enter Lock");
                if (string.IsNullOrEmpty(access_token))
                {
                    Config.logger.LogError("status:500 accessToken is null");
                    return StatusCode(500);
                }
                IRedisClient client = RedisService.GenerateRedisClient();
                Dictionary<string, Object> token = AccessTokenVerifier.DecodeJWT(access_token);
                Dictionary<string, string> metadata = (Dictionary<string, string>)token["metadata"];
                Dictionary<string, string> user = (Dictionary<string, string>)token["user"];
                if (!AccessTokenVerifier.VerifyAccessToken(id, (string)metadata["id"], (string)token["created"]))
                {
                    Config.logger.LogError("status:500 accessToken is illegal");
                    return StatusCode(500); //access token is illegal
                }
                Session editSession = Session.GetSessionFromRedis(id, client);
                string fileName = editSession.LocalFilePath;
                if (!FilesService.FileExists(fileName))
                {
                    Config.logger.LogError("status:404 the file is not exsist");
                    return StatusCode(404);
                }
                string lockValue, operation, xWopiLock, xWopiOldLock = "";
                editSession = Session.GetSessionFromRedis(id, client);
                if (editSession == null)
                {
                    Config.logger.LogError("status:500 the session is null");
                    return StatusCode(500);
                }
                Request.Headers.TryGetValue("X-WOPI-Override", out var xWopiOverrideHeader);
                if (xWopiOverrideHeader.Count != 1 || string.IsNullOrWhiteSpace(xWopiOverrideHeader.FirstOrDefault()))
                {
                    return StatusCode(400);
                }
                else
                {
                    operation = xWopiOverrideHeader.FirstOrDefault();
                }
                Request.Headers.TryGetValue("X-WOPI-Lock", out var xWopiLockHeader);
                if ((xWopiLockHeader.Count != 1 || string.IsNullOrWhiteSpace(xWopiLockHeader.FirstOrDefault())) && operation != "GET_LOCK")
                {
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
                            Config.logger.LogDebug("status:200, the session locked");
                            return StatusCode(200);
                        }
                        else if (!lockValue.Equals(xWopiLock))
                        {
                            Response.Headers.Add("X-WOPI-Lock", lockValue);
                            //explain
                            return StatusCode(409);
                        }
                        else
                        {
                            editSession.RefreshLock(lockValue);
                            editSession.SaveToRedis();
                            //explain
                            return StatusCode(200);
                        }
                    case "GET_LOCK":
                        lockValue = editSession.LockString;
                        Response.Headers.Add("X-WOPI-Lock", lockValue);
                        Config.logger.LogDebug("statusL200, GET_LOCK sucess");
                        return StatusCode(200);
                    case "REFRESH_LOCK":
                        lockValue = editSession.LockString;
                        if (!xWopiLock.Equals(lockValue))
                        {
                            Response.Headers.Add("X-WOPI-Lock", lockValue);
                            return StatusCode(409);
                        }
                        else
                        {
                            editSession.RefreshLock(xWopiLock);
                            editSession.SaveToRedis();
                            Config.logger.LogDebug("status:200, RefreshLock success");
                            return StatusCode(200);
                        }
                    case "UNLOCK":
                        lockValue = editSession.LockString;
                        if (!xWopiLock.Equals(lockValue))
                        {
                            Response.Headers.Add("X-WOPI-Lock", lockValue);
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
                            Config.logger.LogDebug("status:200, UnlockSession success");
                            return StatusCode(200);
                        }
                    case "UNLOCK_RELOCK":
                        lockValue = editSession.LockString;
                        if (!xWopiOldLock.Equals(lockValue))
                        {
                            Response.Headers.Add("X-WOPI-Lock", lockValue);
                            return StatusCode(409);
                        }
                        else
                        {
                            editSession.UnlockAndRelock(xWopiLock);
                            editSession.SaveToRedis();
                            Config.logger.LogDebug("status:200, UnlUnlockAndRelock success");
                            return StatusCode(200);
                        }
                    default:{
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
