const { promisify } = require("util");
const redis = require("redis");
const moment = require("moment");
const logger = require("../services/logger.js");

const { config } = require("../config/config.js");

const typeToLocalOffice = config.typeToLocalOffice;
const operationToLocalFlag = config.operationToLocalFlag;
const client = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  socket_keepalive: true,
  socket_initial_delay: 2 * 1000,
  password: process.env.REDIS_PASSWORD,
  no_ready_check: true,
});

client.on("connect", () => {
  global.console.log("connected");
  logger.log({
    level: "info",
    message: "Connected to Redis",
    label: "redis connection",
  });
});
client.on("error", function (error) {
  console.error(error);
  logger.log({
    level: "error",
    message: `Status 500, failed to connect to redis, error: ${error}`,
  });
});

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

exports.set = async (key, value) => {
  try {
    await setAsync(key, value);
  } catch (e) {
    throw e;
  }
};

exports.get = async (key) => {
  try {
    const value = await getAsync(key);
    return value;
  } catch (e) {
    throw e;
  }
};

exports.removeUserFromSession = async (id, userToRemove) => {
  try {
    let res = await getAsync(id);
    if (!res || res == null) {
      logger.log({
        level: "info",
        message: "Try to remove user but result is null - the session closed",
        label: `Session: ${id}, User: ${userToRemove}`,
      });
      return;
    }
    let session = JSON.parse(res);
    if (!session || session == null || session.Users.length == 0 || session.Users == null) {
      logger.log({
        level: "info",
        message: "Try to remove user but session is null or no users in the session- the session closed ",
        label: `Session: ${id}, User: ${userToRemove}`,
      });
      return;
    }
    const userToRemoveAsInSession = session.Users.find((user) => user.Id == userToRemove);
    if (!userToRemoveAsInSession) {
      logger.log({
        level: "info",
        message: "Try to remove user but user isnt exsist - remove from unlock",
        label: `Session: ${id}, User: ${userToRemove}`,
      });
      return;
    }
    session.Users = session.Users.filter((user) => user.Id !== userToRemove);
    session.UserForUpload = userToRemoveAsInSession;
    sessionStr = JSON.stringify(session);
    await setAsync(id, sessionStr);
    logger.log({
      level: "info",
      message: "User was successfully removed",
      label: `Session: ${id}, User: ${userToRemove}`,
    });
  } catch (err) {
    logger.log({
      level: "error",
      message: `Status 500, failed to remove user from session, error: ${err}`,
      label: `Session: ${id}, User: ${userToRemove}`,
    });
    throw err;
  }
};


exports.updateUserLastUpdated = async (id, userId) => {
  try {
    let res = await getAsync(id);
    if (!res || res == null) {
      return;
    }
    let session = JSON.parse(res);
    if (!session || session == null || !session.Users || session.Users.length == 0 || session.Users == null) {
      return;
    }
    const userIndex = session.Users.findIndex(user => user.Id == userId);
    if (!userIndex) {
      logger.log({
        level: "info",
        message: "Try to update user lastUpdated, but user isnt exsist",
        label: `Session: ${id}, User: ${userIndex}`,
      });
      return;
    }
    session.Users[userIndex].LastUpdated = moment().format();
    session = JSON.stringify(session);
    await setAsync(id, session);
    logger.log({
      level: "info",
      message: "LastUpdated of user successfully update",
      label: `Session: ${id}, User: ${userId}`,
    });
  } catch (err) {
    logger.log({
      level: "error",
      message: `Status 500, failed to update user LastUpdated, error: ${err}`,
      label: `Session: ${id}, User: ${userId}`,
    });
  }
};


