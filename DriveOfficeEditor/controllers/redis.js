const { promisify } = require("util");
const redis = require("redis");
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  socket_keepalive:true,
  socket_initial_delay: 2*1000,
  password:process.env.REDIS_PASSWORD

});

client.on("error", function (error) {
  console.error(error);
});
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

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
    session.Users = session.Users.filter((u) => u.Id !== userToRemove.id);
    session.UserForUpload = userToRemove.id;
    session = JSON.stringify(JSON.stringify(session));
    await setAsync(id, session);
  } catch (err) {
    throw err;
  }
};
