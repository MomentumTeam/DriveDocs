const { promisify } = require("util");
const redis = require("redis");

const client = redis.createClient({
  url: `redis://${process.env.REDIS_URL}:${process.env.REDIS_PORT}`,
  socket_keepalive: true,
  socket_initial_delay: 2 * 1000,
  password: process.env.REDIS_PASSWORD,
  no_ready_check: true,
});

client.on("connect", () => {
  console.log("connected");
});
client.on("error", function (error) {
  console.error(error);
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

