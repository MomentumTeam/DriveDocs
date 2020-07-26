const axios = require("axios");
const jwt = require("jsonwebtoken");

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
    console.log("authorization = ");
    console.log(authorization);

    //user1
    // const authorization =
    //   "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlNTY4ODMyNDIwM2ZjNDAwNDM1OTFhYSIsImFkZnNJZCI6InQyMzQ1ODc4OUBqZWxsby5jb20iLCJnZW5lc2lzSWQiOiI1ZTU2ODgzMjQyMDNmYzQwMDQzNTkxYWEiLCJuYW1lIjp7ImZpcnN0TmFtZSI6Iteg15nXmden15kiLCJsYXN0TmFtZSI6IteQ15PXmdeT16EifSwiZGlzcGxheU5hbWUiOiJ0MjM0NTg3ODlAamVsbG8uY29tIiwicHJvdmlkZXIiOiJHZW5lc2lzIiwiZW50aXR5VHlwZSI6ImRpZ2ltb24iLCJjdXJyZW50VW5pdCI6Im5pdHJvIHVuaXQiLCJkaXNjaGFyZ2VEYXkiOiIyMDIyLTExLTMwVDIyOjAwOjAwLjAwMFoiLCJyYW5rIjoibWVnYSIsImpvYiI6Iteo15XXpteXIiwicGhvbmVOdW1iZXJzIjpbIjA1Mi0xMjM0NTY3Il0sImFkZHJlc3MiOiLXqNeX15XXkSDXlNee157Xqten15nXnSAzNCIsInBob3RvIjpudWxsLCJqdGkiOiJhN2M0ZjFlOS01OGYxLTQ1YjUtODQ2MS01MjdlNjdlMzNhNzgiLCJpYXQiOjE1OTMwODQ2NTcsImV4cCI6MTU5NTY3NjY1NywiZmlyc3ROYW1lIjoi16DXmdeZ16fXmSIsImxhc3ROYW1lIjoi15DXk9eZ15PXoSJ9.KEim6QOQwA98ItN395AqFW86nt8BOIvKOkSN5u95Dwc";
    //const authorization = process.env.AUTHORIZATION_TOKEN;
    return "Bearer " + authorization;
  } catch (e) {
    throw e;
  }
};

exports.getAuthorizationHeader = (userObj) => {
  try {
    return generateAuthorizationHeader(userObj);
  } catch (e) {
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
    throw error;
  }
};
