const authenitcation = require("../controllers/authentication");
const metadata = require("../controllers/metadata");
const files = require("../controllers/files");
const tokens = require("../controllers/tokens");
const redis = require("../controllers/redis");
const conflict = require("../controllers/conflict");
const logger = require("../services/logger.js");
const drive = require("../controllers/drive");
const intervalTime = process.env.INTERVAL_TIME;
const timerTime = process.env.TIMER_TIME;
module.exports = (app) => {
  app.get(
    "/api/files/:id",
    authenitcation.isAuthenticated,
    metadata.loadMetadata,
    metadata.checkPermissionsOnFile,
    metadata.checkSizeOfFile,
    conflict.resolver,
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
        const timerTime = process.env.TIMER_TIME;
        res.render("index", {
          url: url,
          accessToken: accessToken,
          faviconUrl: faviconUrl,
          fileName: fileName,
          fileId: id,
          userId: userId,
          intervalTime: intervalTime,
          timerTime: timerTime
        });
        logger.log({
          level: "info",
          message: "Index successfully rendered",
          label: `FileId: ${id} userId: ${userId}`,
        });
      } catch (e) {
        logger.log({
          level: "error",
          message: `Status 500, failed to render index, error: ${e}`,
          label: `FileId: ${req.params.id} userId: ${userId}`,
        });
        res.status(500).send(e);
      }
    }
  );

  app.get(
    "/api/files/view/:id",
    authenitcation.isAuthenticated,
    metadata.loadMetadata,
    metadata.setViewPermissionsOnFile,
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
        res.render("index", {
          url: url,
          accessToken: accessToken,
          faviconUrl: faviconUrl,
          fileId: id,
          userId: userId,
          fileName: fileName,
          intervalTime: intervalTime,
          timerTime: timerTime,
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


  app.post("/closeSession/:id",
    authenitcation.isAuthenticated,
    files.updateFile,
    async (req, res) => {
      try {
        const id = req.params.id;
        const user = req.user;
        await redis.removeUserFromSession(id, user.id);
        logger.log({
          level: "info",
          message: `User removed from session because it was idle`,
          label: `session: ${id} user: ${user.id}`,
        });
        res.status(200).send("ok");
      } catch (e) {
        logger.log({
          level: "error",
          message: `Status 500, failed to remove user from session, error: ${e}`,
          label: `session: ${id} user: ${user.id}`,
        });
        res.status(500).send(e);
      }
    });

  app.get("/isalive", (req, res) => {
    return res.send("alive");
  });

  app.get(
    "/updateAndDownload/:id",
    authenitcation.isAuthenticated,
    metadata.loadMetadata,
    metadata.checkPermissionsOnFile,
    files.updateFile,
    drive.redirectToDriveDownload
  );

  app.get("/isIdle/:id",
    authenitcation.isAuthenticated,
    async (req, res) => {
      try {
        const sessionId = req.params.id;
        const existingSession = await redis.get(sessionId);
        const session = existingSession == null ? {} : JSON.parse(existingSession);
        const user = session.Users.find(user => user.Id == req.user.id);
        const isIdle = (Date.now() - new Date(user.LastUpdated)) / 1000 > process.env.MAX_USER_IDLE;
        logger.log({
          level: "info",
          message: `${isIdle ? "is Idle" : "is not Idle"}`,
          label: `FileId: ${sessionId} user: ${req.user.id}`,
        });
        res.send(isIdle);
      } catch (e) {
        logger.log({
          level: "error",
          message: `Status 500, failed to check if user idle, error: ${e}`,
          label: `FileId: ${req.params.id} user: ${req.user.id}`,
        });
      }
    });

  app.get("/update/:id",
    authenitcation.isAuthenticated,
    async (req, res) => {
      await redis.updateUserLastUpdated(req.params.id, req.user.id);
      res.send("ok");
    });
};
