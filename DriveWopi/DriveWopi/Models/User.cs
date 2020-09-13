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
        protected string _Authorization;

        public User(string id){
            _Id = id;
            _LastUpdated = DateTime.Now;
        }
        public User(string id,string authorization){
            _Id = id;
            _Authorization = authorization;
            _LastUpdated = DateTime.Now;
        }

        public User(string id,DateTime lastUpdated){
            _Id = id;
            _LastUpdated = lastUpdated;
        }
        public User(string id,DateTime lastUpdated,string authorization){
            _Id = id;
            _LastUpdated = lastUpdated;
            _Authorization = authorization;
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
        public string Authorization 
        { 
            get { return _Authorization; }
            set { _Authorization = value;}
        }
    }
}