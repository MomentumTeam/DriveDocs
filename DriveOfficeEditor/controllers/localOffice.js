const axios = require("axios");
const logger = require("../services/logger.js");
const redis = require("./redis");
const { config } = require("../config/config.js");

const localOfficeFileTypes = config.fileTypes;
delete localOfficeFileTypes["pdf"];
delete localOfficeFileTypes["PDF"];

const operations = config.operations;
const typeToLocalOffice = config.typeToLocalOffice;
const operationToLocalFlag = config.operationToLocalFlag;
const fileTypes = config.fileTypes;
delete fileTypes["pdf"];
delete fileTypes["PDF"];

exports.webdavDownloadAndPermissions = async (req, res, next) => {
  try {
    const user = {...req.user};
    user.name = user.name? user.name : "User";
    let body = {
      fileId: req.params.id,
      authorization: res.locals.authorization,
      user: user,
      webDavFolder: res.locals.webDavFolder,
      webDavFileName: res.locals.webDavFileName,
      permission: res.locals.permission,
    };
    await axios.post(`${process.env.WEBDAV_MANAGER_URL}/downloadToWebdav`, body);
    next();
  } catch (err) {
    return res.status(500).send(err);
  }
};

exports.setFolderAndFileName = (req, res, next) => {
  const d = new Date();
  const mil = d.getTime();
  res.locals.webDavFolder = res.locals.metadata.type;
  res.locals.webDavFileName = `${req.params.id}-${mil}.${res.locals.metadata.type}`;
  next();
};

exports.initRedisSession = async (req, res, next) => {
  try {
    if (res.locals.permission == "write") {
      const redisKey = `local.${req.params.id}`;
      const user = {
        id: req.user.id,
        name: req.user.name ? req.user.name : "User",
        authorization: res.locals.authorization,
        permission: res.locals.permission,
      };
      const session = {
        id: req.params.id,
        webDavFolder: res.locals.webDavFolder,
        webDavFileName: res.locals.webDavFileName,
        user: user,
      };
      res.locals.session = session;
      await redis.set(redisKey, JSON.stringify(session));
      next();
    }
  } catch (err) {
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
        message: `Status 501: ${fileType} file type not supported!`,
        label: `fileId: ${req.params.id}`,
      });
      return res.status(501).send("File type not supported!");
    }

    if (operation && !Object.values(operations).includes(operation)) {
      logger.log({
        level: "error",
        message: `Status 501: ${operation} operation not supported!`,
        label: `fileId: ${req.params.id}`,
      });
      return res.status(501).send("Operation not supported!");
    } else if (!operation) {
      operation = operations.EDIT;
    }

    const webDavPath = `${process.env.WEBDAV_URL}/files/${res.locals.webDavFolder}/${res.locals.webDavFileName}`;
    const redirectLink = `ms-${typeToLocalOffice[fileType]}:${operationToLocalFlag[operation]}|u|${webDavPath}`;
    return res.redirect(redirectLink);
  } catch (e) {
    logger.log({
      level: "error",
      message: `Status 500, failed to create url, error: ${e}`,
      label: `session: ${req.params.id}`,
    });
    return res.status(500).send(e);
  }
};
