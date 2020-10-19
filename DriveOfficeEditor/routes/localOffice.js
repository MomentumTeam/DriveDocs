const authenitcation = require("../controllers/authentication");
const metadata = require("../controllers/metadata");
const localOffice = require("../controllers/localOffice");
const tokens = require("../controllers/tokens");
const redis = require("../controllers/redis");

module.exports = (app) => {
  app.get(
    "/api/localOffice/:id",
    authenitcation.isAuthenticated,
    metadata.loadMetadata,
    metadata.checkPermissionsOnFile,
    tokens.generateAccessToken,
    localOffice.setFolderAndFileName,
    redis.canCreateSession,
    localOffice.webdavDownloadAndPermissions,
    localOffice.initRedisSession,
    localOffice.redirectToLocalOffice,
  );
  app.get(
    "/api/localOffice/view/:id",
    authenitcation.isAuthenticated,
    metadata.loadMetadata,
    metadata.setViewPermissionsOnFile,
    tokens.generateAccessToken,
    localOffice.setFolderAndFileName,
    localOffice.webdavDownloadAndPermissions,
    localOffice.initRedisSession,
    localOffice.redirectToLocalOffice,
  );
};
