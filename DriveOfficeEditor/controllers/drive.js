const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const mime = require('mime-types');
const path = require('path');
const metadataService = require("../services/metadataService");
const logger = require("../services/logger.js");
const { config } = require("../config/config.js");

exports.uploadNewFileToDrive = async (req, res, next) => {
  const xTypes = Object.values(config.xTypes);
  if (!req.query.name || !req.query.type) {
    logger.log({
      level: "error",
      message: `Status 400: name and type are required to create a blank file`,
      label: `user: ${req.user.id}`,
    });
    return res.status(400).send("Status 400: name and type are required to create a blank file");
  }
  req.query.type = req.query.type.toLowerCase();
  if (!xTypes.includes(req.query.type)) {
    return res.status(400).send("status 400: type must be docx,pptx, or xlsx!");
  }
  const blankFilePath = `${process.env.BLANK_PATH}/blank.${req.query.type}`;
  const newFilePath = `${process.env.TEMPLATE_FOLDER}/${req.query.name}.${req.query.type}`;
  fs.copyFileSync(blankFilePath, newFilePath);
  const data = new FormData();
  data.append("file", fs.createReadStream(newFilePath));
  fs.unlinkSync(newFilePath)
  const accessToken = metadataService.getAuthorizationHeader(req.user);
  let fileId;
  try {
    fileId = await upload(data, req.query.parent, accessToken);
    res.locals.fileId = fileId;
    next();
  } catch (error) {
    if (error.response.status == 400) {
      logger.log({
        level: "error",
        message: "status 400: name of newFile is already taken",
        label: `user: ${req.user.id}`,
      });
      return res.status(400).send("status 400: name of newFile is already taken");
    } else {
      logger.log({
        level: "error",
        message: `status 500: ${error.message} `,
        label: `user: ${req.user.id} `,
      });
      return res.status(500).send(`status 500: ${error.message} `);
    }
  }
};

exports.redirectToDriveDownload = (req, res, next) => {
  try {
    return res.redirect(`${process.env.DRIVE_URL}/api/files/${req.params.id}?alt=media`);
  }
  catch{
    return res.status(500).send("error");
  }
}

async function upload(filedata, parentId, accessToken) {
  try {
    const uploadRequest = {
      method: "post",
      url: `${process.env.DRIVE_URL}/api/upload?uploadType=multipart${parentId ? `&parent=${parentId}` : ""} `,
      headers: {
        Authorization: accessToken,
        "Auth-Type": "Docs",
        ...filedata.getHeaders(),
      },
      data: filedata,
    };
    const response = await axios(uploadRequest);
    return response.data;
  } catch (error) {
    throw error;
  }
}

exports.updateFile = async (fileId, filePath, accessToken) => {
  try {
    const size = getFileSize(filePath); //
    mimeType = mime.contentType(path.extname(filePath))
    const data = new FormData();
    data.append('file', fs.createReadStream(filePath));
    const uploadId = await getUploadId(size, fileId, accessToken);
    const updateRequest = {
      method: 'post',
      url: `${process.env.DRIVE_URL}/api/upload?uploadType=resumable&uploadId=${uploadId}`,
      headers: {
        'Content-Range': `bytes 0-${size - 1}/${size}`,
        'Authorization': accessToken,
        "Auth-Type": "Docs",
        ...data.getHeaders(),
        "X-Mime-Type": mimeType
      },
      data: data
    };
    await axios(updateRequest);
  } catch (error) {
    throw error;
  }
}

exports.downloadFileFromDrive = async (idToDownload, downloadedFilePath, accessToken) => {
  try {
    const writer = fs.createWriteStream(downloadedFilePath);
    const url = `${process.env.DRIVE_URL}/api/files/${idToDownload}?alt=media`;
    const downloadRequest = {
      method: "GET",
      responseType: 'stream',
      url,
      headers: {
        Authorization: accessToken,
        "Auth-Type": "Docs",
      },
    };
    const response = await axios(downloadRequest);
    response.data.pipe(writer)
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    })
  } catch (error) {
    throw error;
  }
};

async function getUploadId(size, fileId, accessToken) {
  const uploadIdRequest = {
    method: 'PUT',
    url: `${process.env.DRIVE_URL}/api/upload/${fileId}`,
    headers: {
      'Authorization': accessToken,
      "Auth-Type": "Docs",
      'X-Content-Length': size,
    },
  };
  try {
    const response = await axios(uploadIdRequest);
    return response.headers["x-uploadid"];
  } catch (error) {
    throw error;
  }
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return `${stats.size}`;
  }
  catch (error) {
    throw error;
  }
}