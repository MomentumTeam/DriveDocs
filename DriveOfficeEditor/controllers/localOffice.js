const logger = require("../services/logger.js");
const axios = require("axios");
const metadataService = require("../services/metadataService.js");
const fs = require("fs");
const redis = require("./redis");

const convertTypes = {
  DOC: "doc",
  XLS: "xls",
  PPT: "ppt",
};

const fileTypes = {
  DOCX: "docx",
  XLSX: "xlsx",
  PPTX: "pptx",
  ...convertTypes,
};

const operations = {
  VIEW: "view",
  EDIT: "edit",
  EDIT_NEW: "editNew",
};

exports.webdavDownloadAndPermissions = async (req, res, next) => {
  try {
    let body = {
      fileId: req.params.id,
      authorization: res.locals.authorization,
      userId: req.user.id,
      webDavFolder: res.locals.webDavFolder,
      webDavFileName: res.locals.webDavFileName,
      permission: res.locals.permission
    }
    await axios.post(`${process.env.WEBDAV_MANAGER_URL}/downloadToWebdav`, body);
    next();
  }
  catch (err) {
    return res.error(err);
  }
};

exports.setFolderAndFileName = (req, res, next) => {
  res.locals.webDavFolder = res.locals.metadata.type;
  res.locals.webDavFileName = `${req.params.id}.${res.locals.metadata.type}`;
  next();
};

exports.initRedisSession = async (req, res, next) => {
  try {
    const redisKey = `local.${req.params.id}`;
    const existingSession = await redis.get(redisKey);
    const session = existingSession == null ? {} : JSON.parse(existingSession);
    console.log("session = ");
    console.log(session);
    const user = {
      id: req.user.id,
      name: req.user.name,
      authorization: res.locals.authorization,
      permission: res.locals.permission
    };
    if (existingSession != null) {
      session.users.push(user);
    }
    else {
      session.users = [user];
      session.id = req.params.id;
      session.webDavFolder = res.locals.webDavFolder;
      session.webDavFileName = res.locals.webDavFileName;
    }

    res.locals.session = session;
    console.log("session = ");
    console.log(session);
    await redis.set(redisKey, JSON.stringify(session));
    next();
  }
  catch (err) {
    console.log("error redis:");
    console.log(err);
    return res.status(500).send("error in initializing session in Redis");
  }
};

exports.redirectToLocalOffice = (req, res, next) => {
  try {
    const fileType = res.locals.metadata.type;
    let operation = req.query.operation;

    if (!fileType || !Object.values(fileTypes).includes(fileType)) {
      logger.log({
        level: "error",
        message: `status 501: ${fileType} file type not supported!`,
        label: `session: ${req.params.id}`,
      });
      return res.status(501).send("File type not supported!");
    }

    if (operation && !Object.values(operations).includes(operation)) {
      logger.log({
        level: "error",
        message: `status 501: ${operation} operation not supported!`,
        label: `session: ${req.params.id}`,
      });
      return res.status(501).send("Operation not supported!");
    } else if (!operation) {
      operation = operations.EDIT;
      logger.log({
        level: "info",
        message: "operation is edit",
        label: `session: ${req.params.id}`,
      });
    }

    const webDavPath = `${process.env.WEBDAV_URL}/files/${res.locals.webDavFolder}/${res.locals.webDavFileName}`;

    if (operation == operations.EDIT) {
      switch (fileType) {
        case fileTypes.DOCX:
          return res.redirect(`ms-word:ofe|u|${webDavPath}`);
        case fileTypes.PPTX:
          return res.redirect(`ms-powerpoint:ofe|u|${webDavPath}`);

        case fileTypes.XLSX:
          return res.redirect(`ms-excel:ofe|u|${webDavPath}`);
        default:
          return res.status(500).send("file type not supported");
      }
    } else {
      switch (fileType) {
        case fileTypes.DOCX:
          return res.redirect(`ms-word:ofv|u|${webDavPath}`);
        case fileTypes.PPTX:
          return res.redirect(`ms-powerpoint:ofv|u|${webDavPath}`);
        case fileTypes.XLSX:
          return res.redirect(`ms-excel:ofv|u|${webDavPath}`);
        default:
          return res.status(500).send("file type not supported");
      }
    }
    // next();
  } catch (e) {
    logger.log({
      level: "error",
      message: `status 500, failed to create url, error: ${e}`,
      label: `session: ${req.params.id}`,
    });
    return res.status(500).send(e);
  }
};
