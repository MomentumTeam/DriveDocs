const drive = require("../controllers/drive.js");
const authenitcation = require("../controllers/authentication");
const tokens = require("../controllers/tokens");

module.exports = (app) => {
    app.get(
      "/api/newEmptyFile",
      authenitcation.isAuthenticated,
      drive.uploadNewFileToDrive,
      (req, res) => {
        return res.redirect(`/api/files/${res.locals.fileId}`);
      }
    );
  };
  