const metadataService = require("../services/metadataService");
const logger = require("../services/logger.js");

const fileTypes = {
  DOCX: "docx",
  XLSX: "xlsx",
  PPTX: "pptx",
  PDF: "pdf",
};

const operations = {
  VIEW: "view",
  EDIT: "edit",
  EDIT_NEW: "editNew",
};
const roles = {
  OWNER: "OWNER",
  READ: "READ",
  WRITE: "WRITE",
};

const sizes = {
  DOCX: parseInt(process.env.MAX_SIZE_DOCX),
  PPTX: parseInt(process.env.MAX_SIZE_PPTX),
  XLSX: parseInt(process.env.MAX_SIZE_XLSX),
  PDF: parseInt(process.env.MAX_SIZE_PDF),
};

exports.loadMetadata = async (req, res, next) => {
  try {
    if (req.query.operation == operations.EDIT_NEW) {
      next();
    } else {
      try {
        const fileId = req.query.template ? req.query.template : req.params.id;
        let metadata = await metadataService.getMetadata(fileId, req.user);
        console.log("req.user = ");
        console.log(req.user);
        console.log("metadata = ");
        console.log(metadata);
        metadata.type = metadata.name.substring(metadata.name.lastIndexOf(".") + 1, metadata.name.length).toLowerCase();
        res.locals.metadata = metadata;
        if (res.locals.metadata.hasOwnProperty("permission")) {
          delete res.locals.metadata["permission"];
        }
        logger.log({
          level: "info",
          message: "metadata is valid",
          label: `session ${req.params.id}`,
        });
        next();
      } catch (error) {
        logger.log({
          level: "error",
          message: "status 404: File does not exist, error: " + error,
          label: `session: ${req.params.id}`,
        });
        return res.status(404).send("File does not exist");
      }
    }
  } catch (e) {
    logger.log({
      level: "error",
      message: "status 404: File does not exist",
      label: `session: ${req.params.id}`,
    });
    return res.status(404).send("File does not exist");
  }
};

exports.checkPermissionsOnFile = (req, res, next) => {
  try {
    const metadata = res.locals.metadata;
    if (metadata.role == roles.OWNER || metadata.role == roles.WRITE) {
      req.query.operation = req.query.operation ? req.query.operation : operations.EDIT;
    } else if (metadata.role == roles.READ) {
      req.query.operation = operations.VIEW;
    } else {
      logger.log({
        level: "error",
        message: "status 403: Permissoin denied",
        label: `user: ${req.user.id}`,
      });
      return res.status(403).send("You do not have the right permission!");
    }
    logger.log({
      level: "info",
      message: "Permission granted",
      label: `user: ${req.user.id}`,
    });
    next();
  } catch (e) {
    return res.status(403).send("You do not have the right permission!");
  }
};

exports.checkSizeOfFile = (req, res, next) => {
  try {
    const metadata = res.locals.metadata;
    let maxSize = 0;
    switch (metadata.type) {
      case fileTypes.DOCX:
        maxSize = sizes.DOCX;
        break;
      case fileTypes.PPTX:
        maxSize = sizes.PPTX;
        break;
      case fileTypes.XLSX:
        maxSize = sizes.XLSX;
        break;
      case fileTypes.PDF:
        maxSize = sizes.PDF;
        break;
      default:
        maxSize = sizes.PDF;
    }
    if (metadata.size > maxSize) {
      logger.log({
        level: "error",
        message: "status 413: the file is too big",
        label: `file: ${req.params.id}`,
      });
      return res.status(413).send("the file is too big");
    }
    logger.log({
      level: "info",
      message: `the size of file is ok`,
      label: `file: ${req.params.id}`,
    });
    next();
  } catch (e) {
    logger.log({
      level: "error",
      message: `status 413: the file is too big, error: ${e}`,
      label: `file: ${req.params.id}`,
    });
    return res.status(413).send("the file is too big");
  }
};
