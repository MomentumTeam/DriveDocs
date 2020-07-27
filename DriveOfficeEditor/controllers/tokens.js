const jwt = require("jsonwebtoken");
// const { v4 } = require("uuid");
const { promisify } = require("util");
const metadataService = require("../services/metadataService");
const logger = require("../services/logger.js");

// const getUid = (userId) => {
//   return jwt.sign({ token: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
// };

exports.generateAccessToken = async (req, res, next) => {
  try {
    // const uid = getUid(req.user.id);
    const dataToSign = {
      user: { ...req.user, authorization: metadataService.getAuthorizationHeader(req.user) },
      // uid: uid,
      created: Date.now(),
      operation: req.query.operation ? req.query.operation : "edit",
    };
    if (res.locals.metadata) {
      dataToSign.metadata = res.locals.metadata;
    }
    if (req.query.template) {
      dataToSign.template = req.query.template;
    }
    const jwtToken = jwt.sign(
      {
        data: dataToSign,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.locals.accessToken = jwtToken;
    logger.log({
      level: "info",
      message: "accessToken successfully created",
      label: `user: ${req.user.id}`
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
