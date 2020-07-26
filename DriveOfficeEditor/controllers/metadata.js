const metadataService = require("../services/metadataService");
const logger = require("../services/logger.js");

const permissions = {
  READONLY: "readonly",
  WRITE: "write",
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

exports.loadMetadata = async (req, res, next) => {
  try {
    if (req.query.operation == operations.EDIT_NEW) {
      next();
    } else {
      try {
        const fileId = req.query.template ? req.query.template : req.params.id;
        let metadata = await metadataService.getMetadata(fileId, req.user);
        metadata.type = metadata.name.substring(metadata.name.indexOf(".") + 1, metadata.name.length);
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
          message: "status 404: File does not exist",
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
