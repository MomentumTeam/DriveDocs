const logger = require("../services/logger.js");
exports.isAuthenticated = (req, res, next) => {
  try {
    if (req.isAuthenticated()) {
      logger.log({
        level: "info",
        message: "The user is authenticated",
        label: `user: ${req.user.id}`
      });
      return next();
    } else {
      logger.log({
        level: "info",
        message: "Status:401 user is not Authenticated",
        label: "user is not Authenticated"
      });
      return res.redirect("/login?RelayState=" + encodeURIComponent(req.originalUrl.replace('&', '%26')));
    }
  } catch (e) {
    logger.log({
      level: "error",
      message: `Status 500: ${e}`,
      label: "user is not Authenticated"
    });
    return res.status(500).send(e);
  }
};
