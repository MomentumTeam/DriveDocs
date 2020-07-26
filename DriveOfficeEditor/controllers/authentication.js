const logger = require("../services/logger.js");
exports.isAuthenticated = (req, res, next) => {
  try {
    if (req.isAuthenticated()) {
      logger.log({
        level: "info",
        message: "isAuthenticated",
        label: `user: ${req.user.id}`
      });
      return next();
    } else {
      logger.log({
        level: "info",
        message: "status:401 is not Authenticated",
        label: "user is not Authenticated"
      });
      return res.redirect("/login?RelayState=" + req.originalUrl);
    }
  } catch (e) {
    logger.log({
      level: "error",
      message: `status 500: ${e}`,
      label: "user is not Authenticated"
    });
    return res.status(500).send(e);
  }
};
