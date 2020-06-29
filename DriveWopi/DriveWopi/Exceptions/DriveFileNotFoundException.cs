using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DriveWopi.Exceptions
{
    class DriveFileNotFoundException : Exception
    {
        public DriveFileNotFoundException(string id)
            : base(String.Format("File {0} Not Found", id))
        {

        }

    }
}