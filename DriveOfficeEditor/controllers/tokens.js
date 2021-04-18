const jwt = require("jsonwebtoken");
const metadataService = require("../services/metadataService");
const logger = require("../services/logger.js");


exports.generateAccessToken = async (req, res, next) => {
  try {
    const authorization = metadataService.getAuthorizationHeader(req.user);
    res.locals.authorization = authorization;
    const name = req.user["name"] ? req.user["name"] : "User";
    const dataToSign = {
      user: { id: req.user["id"], 
      name: name, 
      permission: res.locals.permission, 
      authorization: authorization },
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
      label: `fileId: ${req.params.id}, User: ${req.user.id}`,
    });
    next();
  } catch (e) {
    logger.log({
      level: "error",
      message: `Status 500: ${e}`,
    });
    return res.status(500).send(e);
  }
};
