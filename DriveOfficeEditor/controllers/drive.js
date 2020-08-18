const fs = require("fs");
const axios = require("axios");
var FormData = require("form-data");
const metadataService = require("../services/metadataService");
const logger = require("../services/logger.js");
const mime = require('mime-types');
const path = require('path');

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

exports.updateFile = async (fileId, filePath, accessToken) => {
  const size = getFileSize(filePath); //
  mimeType = mime.contentType(path.extname(filePath))
  const data = new FormData();
  data.append('file', fs.createReadStream(filePath));
  const uploadId = await getUploadId(size, fileId, accessToken); 
  const config = {
      method: 'post',
      url: `${process.env.DRIVE_URL}/api/upload?uploadType=resumable&uploadId=${uploadId}`,
      headers: { 
          'Content-Range': `bytes 0-${size-1}/${size}`, 
          'Authorization': accessToken,
          "Auth-Type": "Docs",
          ...data.getHeaders(),
          "X-Mime-Type" : mimeType
      },
  data : data
  };
  try { 
    const response = await axios(config);
    console.log(response.data)
 } catch(error) {
   console.log(error.message);
 }
}

exports.downloadFileFromDrive = async (idToDownload, accessToken) => {
  try {
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

async function getUploadId (size, fileId, accessToken) {
  const config = { 
    method: 'PUT',
    url: `${process.env.DRIVE_URL}/api/upload/${fileId}`,
    headers: { 
      'Authorization': accessToken, 
      "Auth-Type": "Docs",
      'X-Content-Length': size,
    },
  };
  try { 
     const response = await axios(config);
     return response.headers["x-uploadid"];
  } catch(error) {
    console.log(error.message);
  }
}

function getFileSize (filePath) {
  const stats = fs.statSync(filePath);
  return `${stats.size}`;
}