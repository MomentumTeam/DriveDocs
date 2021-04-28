const authenitcation = require("../controllers/authentication");
const metadata = require("../controllers/metadata");
const localOffice = require("../controllers/localOffice");
const tokens = require("../controllers/tokens");
const conflict = require("../controllers/conflict");

module.exports = (app) => {
  app.get(
    "/api/localOffice/:id",
    authenitcation.isAuthenticated,
    metadata.loadMetadata,
    metadata.checkPermissionsOnFile,
    metadata.checkSizeOfFile,
    tokens.generateAccessToken,
    localOffice.setFolderAndFileName,
    conflict.resolver,
    localOffice.webdavDownloadAndPermissions,
    localOffice.initRedisSession,
    localOffice.redirectToLocalOffice,
  );
};
