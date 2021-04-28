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

namespace DriveWopi.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class CleanupController : ControllerBase
    {     
        [HttpGet("{id}", Name = "cleanupId")]
        [Produces("application/json")]
        public async Task<IActionResult> CleanupId(string id)
        {
            try{
                Session session = Session.GetSessionFromRedis(id);
                if(session != null){
                    if(session.ChangesMade){
                        FilesService.UpdateSessionInDrive(id);
                    }
                    session.DeleteSessionFromAllSessionsInRedis(id);
                    session.RemoveLocalFile();
                    session.DeleteSessionFromRedis();
                }
                return Ok("ok");

            }
            catch(Exception e){
                return StatusCode(500);
            }

}
}
}
