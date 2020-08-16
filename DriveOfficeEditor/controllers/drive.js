const fs = require("fs");
const axios = require("axios");
var FormData = require("form-data");
const metadataService = require("../services/metadataService");
const logger = require("../services/logger.js");

const types = ["docx", "pptx", "xlsx"];

exports.uploadNewFileToDrive = async (req, res, next) => {
  if (!req.query.name || !req.query.type) {
    logger.log({
      level: "error",
      message: `status 500: the name and type must be inserted`,
      label: `user: ${user.id}`,
    });
    return res.status(500).send("status 500: the name and type must be inserted");
  }
  req.query.type = req.query.type.toLowerCase();
  if (!types.includes(req.query.type)) {
    return res.status(500).send("status 500: type must be docx,pptx, or xlsx!");
  }
  const path = `..${process.env.TEMPLATE_FOLDER}/${req.query.name}.${req.query.type}`;
  res.locals.path = path;
  fs.openSync(path, "w");
  const data = new FormData();
  data.append("file", fs.createReadStream(path));
  fs.unlinkSync(path)
  const accessToken = metadataService.getAuthorizationHeader(req.user);
  let fileId;
  try {
    fileId = await upload(data, req.query.parentId, accessToken);
    res.locals.fileId = fileId;
    next();
  } catch (error) {
    if (error.response.status == 400) {
      logger.log({
        level: "error",
        message: "status 400: name of newFile is already taken",
        label: `user: ${user.id}`,
      });
      return res.status(400).send("status 400: name of newFile is already taken");
    } else {
      logger.log({
        level: "error",
        message: `status 500: ${error.message}`,
        label: `user: ${user.id}`,
      });
      return res.status(500).send(`status 500: ${error.message}`);
    }
  }
};

async function upload(filedata, parentId, accessToken) {
  try {
    const config = {
      method: "post",
      url: `${process.env.DRIVE_URL}/api/upload?uploadType=multipart${parentId ? `&parent=${parentId}` : ""}`,
      headers: {
        Authorization: accessToken,
        "Auth-Type": "Docs",
        ...filedata.getHeaders(),
      },
      data: filedata,
    };
    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw error;
  }
}

async function updateFile(fileId, filedata, accessToken) {
  //TODO Update the file in Drive
}

// client.Headers.Set("Auth-Type", "Docs");
// client.Headers.Set("Authorization", authorization);
// client.DownloadFile(Config.DriveUrl + "/api/files/" + idToDownload + "?alt=media", localPath);

exports.downloadFileFromDrive = async (idToDownload, accessToken) => {
  try {
    console.log("start downloading");
    console.log(`accessToken = ${accessToken}`);
    console.log(`idToDownload = ${idToDownload}`);
    const config = {
      method: "GET",
      url: `${process.env.DRIVE_URL}/api/files/${idToDownload}?alt=media`,
      headers: {
        Authorization: accessToken,
        "Auth-Type": "Docs",
      },
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.log("error: "+ error);
    throw error;
  }
};
