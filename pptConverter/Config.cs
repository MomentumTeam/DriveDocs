using System;
namespace pptConverter{
public class Config{

public static string DownloadsFolder;
public static string ConvertedFilesFolder;

public static int Port;

static Config(){
    DownloadsFolder = Environment.GetEnvironmentVariable("DOWNLOADS_FOLDER");
    ConvertedFilesFolder = Environment.GetEnvironmentVariable("CONVERTED_FOLDER");
    Port = int.Parse(Environment.GetEnvironmentVariable("PPT_CONVERT_PORT"));
}
}
}