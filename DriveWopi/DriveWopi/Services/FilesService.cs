using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using DriveWopi.Models;
using DriveWopi.Exceptions;
using System.Net.Http;
using System.Net;
using System.Net.Http.Headers;
using Newtonsoft.Json;
using System.Text;

namespace DriveWopi.Services
{
    public class FilesService
    {

        public static string GenerateAuthorizationToken(string userId)
        {
            //TODO
            return Config.AuthorizationToken;
        }

        public async static Task<string> getUploadId(FileInfo fileInfo, string authorization, string fileId)
        {
            try
            {
                using (var httpClient = new HttpClient())
                {
                    string uploadId = "";
                    httpClient.DefaultRequestHeaders.Add("X-Content-Length", fileInfo.Length.ToString());
                    httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    if (!Config.Mimetypes.ContainsKey(fileInfo.Extension.ToString().ToLower()))
                    {
                        throw new Exception();
                    }
                    var body = new { title = fileInfo.Name.ToString(), mimeType = Config.Mimetypes[fileInfo.Extension.ToString().ToLower()] };
                    // Construct the JSON to Put.
                    string convertedBody = JsonConvert.SerializeObject(body, new JsonSerializerSettings());
                    HttpContent content = new StringContent(convertedBody, System.Text.Encoding.UTF8, "application/json");
                    HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Put, Config.DriveUrl + "/api/upload/"+fileId);
                    request.Headers.Add("X-Content-Length", fileInfo.Length.ToString());
                    request.Headers.Add("Authorization", authorization);
                    request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    request.Content = content;
                    var response = await httpClient.SendAsync(request);
                    HttpHeaders headers = response.Headers;
                    IEnumerable<string> values;
                    Console.WriteLine("Reponse Status = "+ response.StatusCode);

                    if (headers.TryGetValues("X-Uploadid", out values))
                    {
                        uploadId = values.First();
                        Console.WriteLine("uploadId = "+ uploadId);
                    }
                    else
                    {
                        throw new Exception();
                        
                    }
                    return uploadId;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Got an exception in GetUploadId:" + ex.Message.ToString());
                return null;
                //throw ex;
            }
        }
        public static bool UpdateFileInDrive(FileInfo fileInfo, string authorization, string fileId)
        {
            try
            {
            
                //string uploadId = await getUploadId(fileInfo, authorization, fileId);
                Task<string> t = Task<string>.Run(async () => {
                    try{
                        string uploadId = await getUploadId(fileInfo, authorization, fileId);
                        return uploadId;
                    }
                    catch(Exception e){
                        return null;
                    }
                });
                t.Wait();
                string uploadId = t.Result;
                if(uploadId == null){
                    return false;
                }
                using (var client = new WebClient())
                {
                    Console.WriteLine("Going to update with uploadId="+uploadId);
                    client.Headers.Set("Content-Range", "bytes 0-" + (fileInfo.Length - 1) + "/" + fileInfo.Length);
                    string url = Config.DriveUrl + "/api/upload?uploadType=resumable&uploadId=" + uploadId;
                    Console.WriteLine("URL = "+url);
                    byte[] responseArray = client.UploadFile(url, fileInfo.FullName);
                    Console.WriteLine("\nResponse Received. The contents of the file uploaded are:\n{0}", System.Text.Encoding.ASCII.GetString(responseArray));
                    return true;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Got an exception in UploadFileInDrive:" + ex.Message.ToString());

                return false;
            }
        }
        public static void DownloadFileFromDrive(string idToDownload, string localPath, string authorization)
        {
            try
            {
                using (var client = new WebClient())
                {
                    client.Headers.Set("Authorization", authorization);
                    client.DownloadFile(Config.DriveUrl + "/api/files/" + idToDownload + "?alt=media", localPath);
                    Console.WriteLine("");
                }
            }
            catch (Exception ex)
            {
                throw ex;
            }

        }

        public static void CopyTemplate(string template, string id)
        {
            try
            {
                string source = source = Config.TemplatesFolder + "/" + template;
                string dest = Config.Folder + "/" + id;
                File.Copy(source, dest, true);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }
        public static void CreateBlankFile(string path)
        {
            try
            {
                string type = path.Substring(path.LastIndexOf(".") + 1, path.Length - path.LastIndexOf(".") - 1).ToLower();
                string source;
                string dest = path;
                switch (type)
                {
                    case "docx":
                        source = Config.TemplatesFolder + "/blankDocx.docx";
                        break;
                    case "xlsx":
                        source = Config.TemplatesFolder + "/blankXlsx.xlsx";
                        break;
                    default:
                        source = Config.TemplatesFolder + "/blankDocx.docx";
                        break;
                }
                File.Copy(source, dest, true);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        public static void Save(string id, byte[] newContent)
        {
            try
            {
                string filePath = GeneratePath(id);
                FileInfo fileInfo = new FileInfo(filePath);
                using (FileStream fileStream = fileInfo.Open(FileMode.Truncate))
                {
                    fileStream.Write(newContent, 0, newContent.Length);
                }
            }
            catch (Exception ex)
            {
                throw ex;
            }

        }

        public static byte[] GetByteArrayFromStream(Stream input)
        {
            try
            {
                byte[] buffer = new byte[16 * 1024];
                using (MemoryStream ms = new MemoryStream())
                {
                    int read;
                    while ((read = input.Read(buffer, 0, buffer.Length)) > 0)
                    {
                        ms.Write(buffer, 0, read);
                    }
                    return ms.ToArray();
                }
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        public static byte[] GetFileContent(string filePath)
        {
            try
            {
                if (!FileExists(filePath))
                {
                    throw new DriveFileNotFoundException(filePath);
                }
                //string filePath = GeneratePath(id);
                MemoryStream ms = new MemoryStream();
                FileInfo fileInfo = new FileInfo(filePath);
                lock (fileInfo)
                {
                    using (FileStream fileStream = fileInfo.OpenRead())
                    {
                        fileStream.CopyTo(ms);
                    }
                }
                ms.Position = 0;
                return ms.ToArray();
            }
            catch (Exception ex)
            {
                throw ex;
            }

        }

        public static bool FileExists(string filePath)
        {
            try
            {
                //string filePath = GeneratePath(id);
                return File.Exists(filePath);
            }
            catch (Exception ex)
            {
                throw ex;
            }

        }

        public static void CreateEmptyFile(string path)
        {
            File.Create(path).Dispose();
        }


        public static string GeneratePath(string id)
        {
            return Config.Folder + "/" + id;
        }

        public static void RemoveFile(string path)
        {
            Console.WriteLine(path);
            try {
                File.Delete(path);
            } 
            catch (Exception ex) {
                throw ex;
            }
            
        }
    }
}
