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
    [ApiController]
    public class ApiController : ControllerBase
    {     
        [HttpGet("/isalive", Name = "IsAlive")]
        public string IsAlive()
        {
            return "alive";
        }
}
}
