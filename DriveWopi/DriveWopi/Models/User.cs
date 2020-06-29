using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DriveWopi.Models
{
    public class User
    {
        protected string _Id ;
        protected DateTime _LastUpdated ;

        public User(string id){
            _Id = id;
            _LastUpdated = DateTime.Now;
        }

        public User(string id,DateTime lastUpdated){
            _Id = id;
            _LastUpdated = lastUpdated;
        }
        public string Id 
        { 
            get { return _Id; }
            set {}
        }
        public DateTime LastUpdated 
        { 
            get { return _LastUpdated; }
            set { _LastUpdated = value;}
        }
    }
}