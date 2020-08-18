const webdav = require("webdav-server").v2,
  request = require("request");

const specialAuthentication = {
  askForAuthentication: () => [],
  getUser: (arg, callback) => {
    callback(null, { name: "hahaha" });
  },
};

// const userManager = new webdav.SimpleUserManager();
// const user = userManager.addUser("lihi", "lihi", true);
// const privilegeManager = new webdav.SimplePathPrivilegeManager();
// privilegeManager.setRights(user, "/", ["all"]);

const server = new webdav.WebDAVServer({
  httpAuthentication: specialAuthentication,
});

server.afterRequest((arg, next) => {
  // Display the method, the URI, the returned status code and the returned message
  console.log(">>", arg.request.method, arg.requested.uri, ">", arg.response.statusCode, arg.response.statusMessage);
  // If available, display the body of the response
  console.log(arg.responseBody);
  next();
});

server.setFileSystemSync("/", new webdav.PhysicalFileSystem("/home/barak/barak/DockerizedDriveDocs/localOfficeFiles"));
const express = require("express");
const app = express();

// Mount the WebDAVServer instance
app.use(webdav.extensions.express("/", server));
app.listen(3005); // Start the Express server
