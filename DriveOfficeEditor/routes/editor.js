const authenitcation = require("../controllers/authentication");
const metadata = require("../controllers/metadata");
const files = require("../controllers/files");
const tokens = require("../controllers/tokens");
const redis = require("../controllers/redis");
const logger = require("../services/logger.js");


module.exports = (app) => {
  app.get(
    "/api/files/:id",
    authenitcation.isAuthenticated,
    metadata.loadMetadata,
    metadata.checkPermissionsOnFile,
    tokens.generateAccessToken,
    //tokens.refreshTokensForSessionsMembers,
    files.generateUrl,

    //   (req, res) => {
    //     let pathRewrite = { "^/api/files/(.*)": "/" };
    //     if (
    //       req.originalUrl.includes("RemoteUls") ||
    //       req.originalUrl.includes("OneNote") ||
    //       req.originalUrl.includes("ResReader") ||
    //       req.originalUrl.includes("proofing")
    //     ) {
    //       pathRewrite = function(path, req) {
    //         return path
    //           .replace("/api/files/OneNote.ashx", "/we/OneNote.ashx")
    //           .replace("/api/files/RemoteUls.ashx", "/we/RemoteUls.ashx")
    //           .replace("/api/files/ResReader.ashx", "/we/ResReader.ashx")
    //           .replace("/api/files/proofing.ashx", "/we/proofing.ashx");
    //       };
    //     }

    //     createProxyMiddleware({
    //       target: res.locals.proxyUrl,
    //       changeOrigin: true,
    //       pathRewrite: pathRewrite,
    //       ws: true,
    //       headers: {
    //         "Access-Control-Allow-Origin": "*",
    //         "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    //       }
    //     })(req, res);
    //   }
    // );

    // app.use("*", (req, res) => {
    //   let pathRewrite = {};
    //   if (req.originalUrl.includes("/api/files")) {
    //     pathRewrite = function(path, req) {
    //       return path.replace("/api/files", "/");
    //     };
    //   }
    //   if (
    //     req.originalUrl.includes("RemoteUls") ||
    //     req.originalUrl.includes("OneNote") ||
    //     req.originalUrl.includes("ResReader") ||
    //     req.originalUrl.includes("proofing")
    //   ) {
    //     pathRewrite = function(path, req) {
    //       return path
    //         .replace("/api/files/OneNote.ashx", "/we/OneNote.ashx")
    //         .replace("/api/files/RemoteUls.ashx", "/we/RemoteUls.ashx")
    //         .replace("/api/files/ResReader.ashx", "/we/ResReader.ashx")
    //         .replace("/api/files/proofing.ashx", "/we/proofing.ashx");
    //     };
    //   }

    //   createProxyMiddleware({
    //     target: `${process.env.OFFICE_ONLINE_URL}`,
    //     changeOrigin: true,
    //     pathRewrite: pathRewrite,
    //     ws: true,
    //     headers: {
    //       "Access-Control-Allow-Origin": "*",
    //       "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    //     }
    //   })(req, res);
    // });

    // UNCOMMENT THIS TO RETURN TO OLD VERSION
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
          label: `session: ${id}`
        });
      } catch (e) {
        logger.log({
          level: "error",
          message: `status 500, failed to render index, error: ${e}`,
          label: `session: ${req.params.id}`
        });
        res.status(500).send(e);
      }
    }
  );
  // UNCOMMENT THIS TO RETURN TO OLD VERSION

  app.post("/closeSession/:id", authenitcation.isAuthenticated, (req, res) => {
    try {
      id = req.params.id;
      user = req.user;
      redis.removeUserFromSession(id, user);
    } catch (e) {
      logger.log({
        level: "error",
        message: `status 500, failed to remove user from session, error: ${e}`,
        label: `session: ${id} user: ${user}`
      });
      res.status(500).send(e);
    }
  });
};
