const drive = require("../controllers/drive.js");
const authenitcation = require("../controllers/authentication");
const logger = require("../services/logger.js");


module.exports = (app) => {
  app.get(
    "/api/blank",
    authenitcation.isAuthenticated,
    drive.uploadNewFileToDrive,
    (req, res) => {
      logger.log({
        level: "info",
        message: `New file successfully created`,
        label: `FileId: ${res.locals.fileId}`,
      })
      return res.redirect(`/api/files/${res.locals.fileId}`);
    }
  );
};
