const authenitcation = require("../controllers/authentication");
const metadata = require("../controllers/metadata");
const localOffice = require("../controllers/localOffice");
const tokens = require("../controllers/tokens");
const redis = require("../controllers/redis");
const logger = require("../services/logger.js");

module.exports = (app) => {
  // app.get(
  //   "/api/localOffice/:id",
  //   authenitcation.isAuthenticated,
  //   metadata.loadMetadata,
  //   metadata.checkPermissionsOnFile,
  //   metadata.checkSizeOfFile,
  //   tokens.generateAccessToken,
  //   localOffice.downloadFromDrive,
  //   localOffice.initRedisSession,
  //   localOffice.redirectToLocalOffice,
  // );
};
