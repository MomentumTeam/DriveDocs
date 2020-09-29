const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const metadataService = require("../services/metadataService");
const logger = require("../services/logger.js");


exports.generateAccessToken = async (req, res, next) => {
  try {
    res.locals.driveAccessToken = metadataService.getAuthorizationHeader(req.user);
    const authorization = metadataService.getAuthorizationHeader(req.user);
    res.locals.authorization = authorization;
    const dataToSign = {
      user: { id: req.user["id"], name: req.user["name"], authorization: authorization },
      created: Date.now(),
    };
    if (res.locals.metadata) {
      dataToSign.metadata = {
        id: res.locals.metadata["id"],
        name: res.locals.metadata["name"],
        type: res.locals.metadata["type"],
      };
    }
    res.locals.dataToSign = dataToSign;
    const jwtToken = jwt.sign(dataToSign, process.env.JWT_SECRET, { expiresIn: "24h" });
    res.locals.accessToken = jwtToken;
    logger.log({
      level: "info",
      message: "accessToken successfuly created",
      label: `user: ${req.user.id}`,
    });
    next();
  } catch (e) {
    logger.log({
      level: "error",
      message: `status 500: ${e}`,
    });
    return res.status(500).send(e);
  }
};
