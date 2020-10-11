const authenitcation = require("../controllers/authentication");
const metadata = require("../controllers/metadata");
const localOffice = require("../controllers/localOffice");
const tokens = require("../controllers/tokens");

module.exports = (app) => {
  app.get(
    "/api/localOffice/:id",
    authenitcation.isAuthenticated,
    metadata.loadMetadata,
    metadata.checkPermissionsOnFile,
    tokens.generateAccessToken,
    localOffice.setFolderAndFileName,
    localOffice.webdavDownloadAndPermissions,
    localOffice.initRedisSession,
    localOffice.redirectToLocalOffice,
  );
};
