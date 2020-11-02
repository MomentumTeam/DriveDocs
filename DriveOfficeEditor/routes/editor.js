const authenitcation = require("../controllers/authentication");
const metadata = require("../controllers/metadata");
const files = require("../controllers/files");
const tokens = require("../controllers/tokens");
const redis = require("../controllers/redis");
const logger = require("../services/logger.js");
const drive = require("../controllers/drive");

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

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
        const id = req.params.id;
        const url = res.locals.url;
        const accessToken = res.locals.accessToken;
        const faviconUrl = res.locals.faviconUrl;
        const fileName = res.locals.metadata.name;
        const userId = req.user.id;
        const intervalTime = process.env.INTERVAL_TIME;
        res.render("index", {
          url: url,
          accessToken: accessToken,
          faviconUrl: faviconUrl,
          fileName: fileName,
          fileId: id,
          userId: userId,
          intervalTime: intervalTime
        });
        logger.log({
          level: "info",
          message: "Index successfully rendered",
          label: `FileId: ${id}`,
        });
      } catch (e) {
        logger.log({
          level: "error",
          message: `Status 500, failed to render index, error: ${e}`,
          label: `FileId: ${req.params.id}`,
        });
        res.status(500).send(e);
      }
    }
  );

  app.post("/closeSession/:id", async (req, res, next) => {
    next();
  },
    authenitcation.isAuthenticated,
    files.updateFile,
    async (req, res) => {
      try {
        const id = req.params.id;
        const user = req.user;
        await redis.removeUserFromSession(id, user);
        res.status(200).send("ok");
      } catch (e) {
        logger.log({
          level: "error",
          message: `Status 500, failed to remove user from session, error: ${e}`,
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
    drive.redirectToDriveDownload,
  );

  app.get("/isIdle/:id",
    authenitcation.isAuthenticated,
    async (req, res) => {
      const sessionId = req.params.id;
      const existingSession = await redis.get(sessionId);
      const session = existingSession == null ? {} : JSON.parse(JSON.parse(existingSession));
      const user = session.Users.find(user => user.Id == req.user.id);
      res.send((Date.now() - new Date(user.LastUpdated)) / 1000 > process.env.MAX_USER_IDLE);
  });

  app.get("/update/:id",
    authenitcation.isAuthenticated,
    async (req, res) => {
      await redis.updateUserLastUpdated(req.params.id, req.user.id);
      res.send("ok");  
  });
};
