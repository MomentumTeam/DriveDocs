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

namespace DriveWopi.Controllers
{
    [Route("/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {     
        [HttpDelete("session/{sessionId}/user/{userId}", Name = "DeleteUser")]
        public async Task<IActionResult> DeleteUser(string sessionId, string userId)
        {
            Console.WriteLine("Im in DELETE USER");
            Console.WriteLine("sessionId = "+sessionId + "  userId = "+userId);
            try{
                IRedisClient client = RedisService.GenerateRedisClient();
                Session editSession = Session.GetSessionFromRedis(sessionId,client);
                if(editSession == null || editSession.Users == null || editSession.Users.Count == 0){
                    Console.WriteLine("1");
                    return StatusCode(500); 
                }
                User result = editSession.Users.FirstOrDefault<User>((User user) => 
                {return user!=null && user.Id!=null && user.Id.Equals(userId);});
                if(result == null)
                {
                    Console.WriteLine("2");
                    return StatusCode(200);
                }
                editSession.RemoveUser(userId);
                editSession.SaveToRedis();
                Console.WriteLine("3");
                return StatusCode(200);
            }
            catch(Exception){
                Console.WriteLine("4");
                return StatusCode(500);
            }
        }
}
}
