const authenitcation = require("../controllers/authentication");
const metadata = require("../controllers/metadata");
const localOffice = require("../controllers/localOffice");
const tokens = require("../controllers/tokens");
const redis = require("../controllers/redis");
const logger = require("../services/logger.js");

module.exports = (app) => {
  app.get(
    "/api/localOffice/:id",
    authenitcation.isAuthenticated,
    metadata.loadMetadata,
    metadata.checkPermissionsOnFile,
    metadata.checkSizeOfFile,
    tokens.generateAccessToken,
    localOffice.downloadFromDrive,
    localOffice.redirectToLocalOffice
  );
  //   app.post("/closeSession/:id", authenitcation.isAuthenticated, (req, res) => {
  //     try {
  //       id = req.params.id;
  //       user = req.user;
  //       redis.removeUserFromSession(id, user);
  //     } catch (e) {
  //       logger.log({
  //         level: "error",
  //         message: `status 500, failed to remove user from session, error: ${e}`,
  //         label: `session: ${id} user: ${user}`,
  //       });
  //       res.status(500).send(e);
  //     }
  //   });
  //   app.get("/isalive", (req, res) => {
  //     return res.send("alive");
  //   });
};
