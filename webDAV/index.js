require('dotenv').config();
const webdav = require("webdav-server").v2;
const drive = require("./drive");
const redis = require("./redis");

const specialAuthentication = {
  askForAuthentication: () => [],
  getUser: (arg, callback) => {
    callback(null, {"name":"barak"});
  },
};

const userManager = new webdav.SimpleUserManager();
const user = userManager.addUser("lihi", "lihi", true);
const privilegeManager = new webdav.SimplePathPrivilegeManager();
privilegeManager.setRights(user, "/", ["all"]);

const server = new webdav.WebDAVServer({
  httpAuthentication: new webdav.HTTPDigestAuthentication(userManager, 'Default realm'),
  privilegeManager: privilegeManager,
  // httpAuthentication: specialAuthentication,
  // requireAuthentification: false,
  // port: 3005, // Load the server on the port 2000 (if not specified, default is 1900)
});

server.afterRequest(async(arg, next) => {
  // Display the method, the URI, the returned status code and the returned message
  console.log(">>", arg.request.method, arg.requested.uri, ">", arg.response.statusCode, arg.response.statusMessage);
  // If available, display the body of the response
  // console.log(arg.responseBody);
  if(arg.request.method == "PUT"){
    const fileName = arg.requested.uri.substring(1,arg.requested.uri.length);
    const fileId = fileName.substring(0,fileName.lastIndexOf("."));
    const redisKey = `local.${fileId}`;
    const value = await redis.get(redisKey);
    const session = JSON.parse(value);
    const accessToken = session.user.authorization;
    const filePath = `${process.env.LOCAL_OFFICE_FILES_FOLDER}/${fileName}`;
    console.log(session);
    await drive.updateFile(fileId,filePath,accessToken);
  }

  next();
});

server.setFileSystemSync("/", new webdav.PhysicalFileSystem("/home/barak/barak/DockerizedDriveDocs/localOfficeFiles"));

const express = require("express");
const app = express();

// Mount the WebDAVServer instance
app.use(webdav.extensions.express("/", server));
app.listen(3005); // Start the Express server
