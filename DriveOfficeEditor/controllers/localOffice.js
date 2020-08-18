const logger = require("../services/logger.js");
const axios = require("axios");
const metadataService = require("../services/metadataService.js");
const fs = require("fs");

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

exports.downloadFromDrive = async (req, res, next) => {
  try {
    const idToDownload = req.params.id;
    const fileType = res.locals.metadata.type;
    const localFileName = `${idToDownload}.${fileType}`;

    const path = `${process.env.LOCAL_OFFICE_FOLDER}/${localFileName}`;
    console.log(`idToDownload=${idToDownload}  fileType=${fileType}  localFileName=${localFileName}  path=${path}`);
    const writer = fs.createWriteStream(path);
    res.locals.localPath = path;
    res.locals.localFileName = localFileName;
    const accessToken = metadataService.getAuthorizationHeader(req.user);
    console.log(`accessToken=${fs.accessToken}`);
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
        case fileTypes.PPTX:
          return res.redirect(`ms-powerpoint:ofe|u|${process.env.WEBDAV_URL}/${localFileName}`);
        case fileTypes.XLSX:
          return res.redirect(`ms-excel:ofe|u|${process.env.WEBDAV_URL}/${localFileName}`);
        default:
          return res.status(500).send("file type not supported");
      }
    } else {
      switch (fileType) {
        case fileTypes.DOCX:
          return res.redirect(`ms-word:ofv|u|${process.env.WEBDAV_URL}/${localFileName}`);
        case fileTypes.PPTX:
          return res.redirect(`ms-powerpoint:ofv|u|${process.env.WEBDAV_URL}/${localFileName}`);
        case fileTypes.XLSX:
          return res.redirect(`ms-excel:ofv|u|${process.env.WEBDAV_URL}/${localFileName}`);
        default:
          return res.status(500).send("file type not supported");
      }
    }
  } catch (e) {
    logger.log({
      level: "error",
      message: `status 500, failed to create url, error: ${e}`,
      label: `session: ${req.params.id}`,
    });
    return res.status(500).send(e);
  }
};
