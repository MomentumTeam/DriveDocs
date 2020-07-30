const { promisify } = require("util");
const redis = require("redis");
const jwt = require("jsonwebtoken");
const logger = require("../services/logger.js");

console.log(process.env.REDIS_PASSWORD);
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
    message: "redis is connect",
    label: "redis up",
  });
});
client.on("error", function (error) {
  console.error(error);
  logger.log({
    level: "error",
    message: `status 500, failed to connect to redis, error: ${error}`,
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
  console.log("remove user from session");
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

    console.log("User deleted and updated in redis:");
    console.log(userToRemoveAsInSession);
    session.UserForUpload = userToRemoveAsInSession;
    session = JSON.stringify(JSON.stringify(session));
    await setAsync(id, session);
    logger.log({
      level: "info",
      message: "user is successfully remove",
      label: `session: ${id} user: ${userToRemove.id}`,
    });
  } catch (err) {
    logger.log({
      level: "error",
      message: `status 500, failed to remove user from session, error: ${err}`,
      label: `session: ${id} user: ${userToRemove}`,
    });
    res.status(500).send(e);
  }
};
