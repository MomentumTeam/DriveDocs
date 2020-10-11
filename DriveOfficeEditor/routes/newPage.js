const drive = require("../controllers/drive.js");
const authenitcation = require("../controllers/authentication");

module.exports = (app) => {
  app.get(
    "/api/blank",
    authenitcation.isAuthenticated,
    drive.uploadNewFileToDrive,
    (req, res) => {
      return res.redirect(`/api/files/${res.locals.fileId}`);
    }
  );
};
