const axios = require("axios");
const jwt = require("jsonwebtoken");
const logger = require("../services/logger.js");

const handleUserName = (user) => {
  if (!user.name) {
    throw new Error("User has no name object");
  }

  const firstName = user.name.firstName || user.job;
  if (!firstName) {
    throw new Error("User has no first-name and no job");
  }
  const lastName = user.name.lastName || "";
  return { firstName, lastName };
};

const generateAuthorizationHeader = (userObj) => {
  try {
    const driveSecret = process.env.DRIVE_SECRET;
    const minute = 60;
    const hour = 60 * minute;
    const day = 24 * hour;
    const expiresIn = day * 1;

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiresIn;

    const user = { ...userObj, iat, exp };

    const name = handleUserName(user);

    user.firstName = name.firstName;
    user.lastName = name.lastName;

    const authorization = jwt.sign(JSON.parse(JSON.stringify(user)), driveSecret);
    logger.log({
      level: "info",
      message: `authorization created successfully ${authorization}`,
      label: `user: ${userObj.id}`
    });
    return "Bearer " + authorization;
  } catch (e) {
    logger.log({
      level: "error",
      message: `authorization creation fail, error: ${e}`,
      label: `user: ${userObj.id}`
    });
    throw e;
  }
};

exports.getAuthorizationHeader = (userObj) => {
  try {
    return generateAuthorizationHeader(userObj);
  } catch (e) {
    logger.log({
      level: "error",
      message: `authorization creation fail, error: ${e}`,
      label: `user: ${userObj.id}`
    });
    throw e;
  }
};

exports.getMetadata = async (fileId, user) => {
  try {
    const url = `${process.env.DRIVE_URL}/api/files/${fileId}`;
    const authorization = generateAuthorizationHeader(user);
    const metadata = await axios.get(url, {
      headers: { Authorization: authorization, "Auth-Type": "Docs" },
    });
    return metadata.data;
  } catch (error) {
    logger.log({
      level: "error",
      message: `getMetadata fail, error: ${error}`,
      label: `session: ${fileId} user: ${userObj.id}`
    });
    throw error;
  }
};
