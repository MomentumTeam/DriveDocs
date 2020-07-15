const { promisify } = require("util");
const redis = require("redis");
const jwt = require("jsonwebtoken");

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
});
client.on("error", function (error) {
  console.error(error);
});

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

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
  } catch (err) {
    throw err;
  }
};

// exports.removeUserFromSession = async (id, userToRemove) => {
//   console.log("remove user from session");
//   try {
//     const response = axios.delete(`${process.env.WOPI_URL}/users/session/${id}/user/${userToRemove.id}`);
//     console.log(response);
//   } catch (err) {
//     throw err;
//   }
// };
