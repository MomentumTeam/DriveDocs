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
        protected string _Permission;
        protected string _Name;
        
        public User(string id){
            _Id = id;
            _LastUpdated = DateTime.Now;
        }
        public User(string id,string authorization){
            _Id = id;
            _Authorization = authorization;
            _LastUpdated = DateTime.Now;
        }

        public User(string id, string authorization, string permission,string name){
            _Id = id;
            _Authorization = authorization;
            _LastUpdated = DateTime.Now;
            _Permission = permission;
            _Name = name;
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
        public string Permission 
        { 
            get { return _Permission; }
            set { _Permission = value;}
        }

        public string Name 
        { 
            get { return _Name; }
            set { _Name = value;}
        }

    }
}