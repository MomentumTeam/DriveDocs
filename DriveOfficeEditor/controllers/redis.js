const { promisify } = require("util");
const redis = require("redis");
const moment = require("moment");
const logger = require("../services/logger.js");

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
      return;
    }
    let session = JSON.parse(JSON.parse(res));
    if (!session || session == null || !session.Users || session.Users == null) {
      return;
    }
    const userToRemoveAsInSession = session.Users.find((user) => user.Id == userToRemove.id);
    if (!userToRemoveAsInSession) {
      return;
    }
    session.Users = session.Users.filter((u) => u.Id !== userToRemove.id);
    session.UserForUpload = userToRemoveAsInSession;
    session = JSON.stringify(JSON.stringify(session));
    await setAsync(id, session);
    logger.log({
      level: "info",
      message: "User was successfully removed",
      label: `Session: ${id}, User: ${userToRemove.id}`,
    });
  } catch (err) {
    logger.log({
      level: "error",
      message: `Status 500, failed to remove user from session, error: ${err}`,
      label: `Session: ${id}, User: ${userToRemove}`,
    });
    res.status(500).send(e);
  }
};


exports.updateUserLastUpdated = async (id, userId) => {
  try {
    let res = await getAsync(id);
    console.log(res)
    if (!res || res == null) {
      return;
    }
    let session = JSON.parse(JSON.parse(res));
    if (!session || session == null || !session.Users || session.Users == null) {
      return;
    }
    console.log("enter");
    const userIndex = session.Users.findIndex(user => user.Id == userId);
    console.log("old"+ session.Users[userIndex].LastUpdated);
    session.Users[userIndex].LastUpdated = moment().format();
    console.log("new"+ session.Users[userIndex].LastUpdated);
    session = JSON.stringify(JSON.stringify(session));
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
    // res.status(500).send(e);
  }
};


