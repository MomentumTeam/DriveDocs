using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DriveWopi.Services
{
    public class LockService
    {

        public static string GetLockValue(string id)
        {
            return "lock";
        }
        public static void Lock(string id)
        {

        }
        public static void Unlock(string id)
        {

        }

        public static bool IsLocked(string id)
        {
            return false;
        }
        public static bool LockConflict(string id, string xWopiLock)
        {
            return false;
        }
        public static void RefreshLock(string id)
        {

        }
        public static void LockFile(string id, string xWopiLock)
        {

        }

        public static void UnlockAndRelock(string id, string xWopiLock, string xWopiOldLock)
        {

        }



    }
}
