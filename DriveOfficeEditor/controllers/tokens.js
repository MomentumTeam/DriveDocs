const jwt = require("jsonwebtoken");
const { v4 } = require("uuid");
const { promisify } = require("util");
const metadataService = require("../services/metadataService");
const logger = require("../services/logger.js");

const getUid = (userId) => {
  return jwt.sign({ token: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// exports.refreshTokensForSessionsMembers = async (req, res, next) => {
//   try {
//     let promises = [];
//     let sessionString = await getAsync(req.params.id);
//     if (!sessionString) {
//       return next();
//     }
//     const session = JSON.parse(JSON.parse(sessionString));
//     const users = session.Users;
//     for (let user of users) {
//       if (user.Id != req.user.id) {
//         promises.push(
//           new Promise((resolve, reject) => {
//             setAsync(user.Id, getUid(user.id), "EX", 500)
//               .then(() => {
//                 resolve();
//               })
//               .catch(() => {
//                 reject();
//               });
//           })
//         );
//       }
//     }
//     await Promise.all(promises);
//     return next();
//   } catch (e) {
//     res.status(500).send("error in refresh tokens");
//   }
// };

exports.generateAccessToken = async (req, res, next) => {
  try {
    const uid = getUid(req.user.id);
    const dataToSign = {
      user: { ...req.user, authorization: metadataService.getAuthorizationHeader(req.user) },
      uid: uid,
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
