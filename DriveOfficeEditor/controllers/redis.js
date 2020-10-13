const { promisify } = require("util");
const redis = require("redis");
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

exports.canCreateSession = async (id) => {
  let onlineSession = await getAsync(id);
  let localSession = await getAsync(`local.${id}`);
  console.log("canCreateSession = ")
  console.log(onlineSession)
  console.log(onlineSession)
  if(!onlineSession && !localSession){
    return true
  }else{

    return false
  }
}
