const authenitcation = require("../controllers/authentication");
const metadata = require("../controllers/metadata");
const files = require("../controllers/files");
const tokens = require("../controllers/tokens");
const redis = require("../controllers/redis");
const logger = require("../services/logger.js");
const drive = require("../controllers/drive");

module.exports = (app) => {
  app.get(
    "/api/files/:id",
    authenitcation.isAuthenticated,
    metadata.loadMetadata,
    metadata.checkPermissionsOnFile,
    metadata.checkSizeOfFile,
    tokens.generateAccessToken,
    files.generateUrl,
    (req, res) => {
      try {
        id = req.params.id;
        url = res.locals.url;
        accessToken = res.locals.accessToken;
        faviconUrl = res.locals.faviconUrl;
        res.render("index", {
          url: url,
          accessToken: accessToken,
          faviconUrl: faviconUrl,
          fileName: res.locals.metadata.name,
        });
        logger.log({
          level: "info",
          message: "index successfully render ",
          label: `session: ${id}`,
        });
      } catch (e) {
        logger.log({
          level: "error",
          message: `status 500, failed to render index, error: ${e}`,
          label: `session: ${req.params.id}`,
        });
        res.status(500).send(e);
      }
    }
  );

  app.post("/closeSession/:id", authenitcation.isAuthenticated, (req, res) => {
    try {
      id = req.params.id;
      user = req.user;
      redis.removeUserFromSession(id, user);
    } catch (e) {
      logger.log({
        level: "error",
        message: `status 500, failed to remove user from session, error: ${e}`,
        label: `session: ${id} user: ${user}`,
      });
      res.status(500).send(e);
    }
  });

  app.get("/isalive", (req, res) => {
    return res.send("alive");
  });

  app.get("/updateAndDownload/:id",
    authenitcation.isAuthenticated,
    metadata.loadMetadata,
    metadata.checkPermissionsOnFile,
    files.updateFile,
    drive.redirectToDownload,
    (req, res) => {
      try {
        res.render("downloadLink", {
          link: res.locals.link
        });
        // return res.redirect(res.locals.link);
      } catch (e) {
        res.status(500).send(e);
      }
    }
  );

};
