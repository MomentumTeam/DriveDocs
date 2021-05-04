using System;
using System.IO;
using System.Collections.Generic;
using Newtonsoft.Json;
using DriveWopi.Services;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace DriveWopi.Models
{
    public class HiBotRequest
    {
        public string _Message;
        public string _OwnerId;

        public HiBotRequest(string Message, string OwnerId){
            _Message = Message;
            _OwnerId = OwnerId;
        }

        public string Message
        {
            get { return _Message; }
            set { _Message = value; }
        }

        public string OwnerId
        {
            get { return _OwnerId; }
            set { _OwnerId = value; }
        }


    }
}