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

exports.initRedisSession = async (req,res,next) => {
  try{
     const redisKey = `local.${req.params.id}`;
     res.locals.redisKey = redisKey;
     const session = res.locals.dataToSign;
     session["lastUpdated"] = session["created"];
     delete session["created"];
     session["localFilePath"] = res.locals.localFilePath;
     session["localFileName"] = res.locals.localFileName;  
     res.locals.session = session;
     console.log("session = ");
     console.log(session);
     await redis.set(redisKey,JSON.stringify(session));
     next();
  }
  catch(err){
    return res.status(500).send("error in initializing session in Redis");
  }

};

exports.downloadFromDrive = async (req, res, next) => {
  try {
    const idToDownload = req.params.id;
    const fileType = res.locals.metadata.type;
    const localFileName = `${idToDownload}.${fileType}`;

    const path = `${process.env.LOCAL_OFFICE_FOLDER}/${localFileName}`;
    const path2 = `${process.env.LOCAL_OFFICE_FOLDER}/blabla.docx`;
    console.log(`idToDownload=${idToDownload}  fileType=${fileType}  localFileName=${localFileName}  path=${path}`);
    // const writer = fs.createWriteStream(path,{mode: fs.constants.S_IWOTH});
    // const writer = fs.createWriteStream(path);
    const writer = fs.createWriteStream(path2);
    res.locals.localFilePath = path;
    res.locals.localFileName = localFileName;
    const accessToken = metadataService.getAuthorizationHeader(req.user);
    console.log(`accessToken=${accessToken}`);
    console.log(`url=${process.env.DRIVE_URL}/api/files/${idToDownload}?alt=media`);
    const config = {
      method: "GET",
      url: `${process.env.DRIVE_URL}/api/files/${idToDownload}?alt=media`,
      responseType: "stream",
      headers: {
        Authorization: accessToken,
        "Auth-Type": "Docs",
      },
    };
    const response = await axios(config);
    response.data.pipe(writer);
    writer.on("finish", () => {
      console.log("FINISH!");
      next();
    });
    writer.on("error", () => {
      console.log("ERROR!");
      return res.status(500).send("error");
    });
  } catch (error) {
    console.log("error: " + error);
    writer.end();
    return res.status(500).send(error);
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

    const localFileName = res.locals.localFileName;

    if (operation == operations.EDIT) {
      switch (fileType) {
        case fileTypes.DOCX:
          return res.redirect(`ms-word:ofe|u|${process.env.WEBDAV_URL}/${localFileName}`);
          // res.locals.link = `ms-word:ofe|u|${process.env.WEBDAV_URL}/${localFileName}`;
          // break;
          case fileTypes.PPTX:
          return res.redirect(`ms-powerpoint:ofe|u|${process.env.WEBDAV_URL}/${localFileName}`);
          // res.locals.link = `ms-powerpoint:ofe|u|${process.env.WEBDAV_URL}/${localFileName}`;
          // break;
          case fileTypes.XLSX:
          return res.redirect(`ms-excel:ofe|u|${process.env.WEBDAV_URL}/${localFileName}`);
          // res.locals.link = `ms-excel:ofe|u|${process.env.WEBDAV_URL}/${localFileName}`;
          // break;
        default:
          return res.status(500).send("file type not supported");
      }
    } else {
      switch (fileType) {
        case fileTypes.DOCX:
          return res.redirect(`ms-word:ofv|u|${process.env.WEBDAV_URL}/${localFileName}`);
          // res.locals.link = `ms-word:ofv|u|${process.env.WEBDAV_URL}/${localFileName}`;
          // break;
        case fileTypes.PPTX:
          return res.redirect(`ms-powerpoint:ofv|u|${process.env.WEBDAV_URL}/${localFileName}`);
          // res.locals.link = `ms-powerpoint:ofv|u|${process.env.WEBDAV_URL}/${localFileName}`;
          // break;
        case fileTypes.XLSX:
          return res.redirect(`ms-excel:ofv|u|${process.env.WEBDAV_URL}/${localFileName}`);
          // res.locals.link = `ms-excel:ofv|u|${process.env.WEBDAV_URL}/${localFileName}`;
          // break;
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
