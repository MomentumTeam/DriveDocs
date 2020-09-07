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
    [Route("[controller]")]
    [ApiController]
    public class UpdateController : ControllerBase
    {     
        [HttpGet("{id}", Name = "UpdateSession")]
        [Produces("application/json")]
        public async Task<IActionResult> Update(string id)
        {
            try{
                IRedisClient client = RedisService.GenerateRedisClient();
                Session session = Session.GetSessionFromRedis(id,client);
                User userForUpload;
                if(session.Users != null && session.Users.Count > 0){
                    userForUpload = session.Users[0];
                }
                else if(session.UserForUpload != null){
                    userForUpload = session.UserForUpload;
                }
                else{
                    return StatusCode(500);
                }
                bool updateResult = session.SaveToDrive(userForUpload);
                if(!updateResult){
                    return StatusCode(500);
                }
                else{
                    return Ok("ok");
                }
            }
            catch(Exception error){
                return StatusCode(500);
            }

}
}
}
