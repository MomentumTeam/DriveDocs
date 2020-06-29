const axios = require("axios");

const generateAuthorizationHeader = (userId) => {
  try {
    //user1
    // const authorization =
    //   "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlNTY4ODMyNDIwM2ZjNDAwNDM1OTFhYSIsImFkZnNJZCI6InQyMzQ1ODc4OUBqZWxsby5jb20iLCJnZW5lc2lzSWQiOiI1ZTU2ODgzMjQyMDNmYzQwMDQzNTkxYWEiLCJuYW1lIjp7ImZpcnN0TmFtZSI6Iteg15nXmden15kiLCJsYXN0TmFtZSI6IteQ15PXmdeT16EifSwiZGlzcGxheU5hbWUiOiJ0MjM0NTg3ODlAamVsbG8uY29tIiwicHJvdmlkZXIiOiJHZW5lc2lzIiwiZW50aXR5VHlwZSI6ImRpZ2ltb24iLCJjdXJyZW50VW5pdCI6Im5pdHJvIHVuaXQiLCJkaXNjaGFyZ2VEYXkiOiIyMDIyLTExLTMwVDIyOjAwOjAwLjAwMFoiLCJyYW5rIjoibWVnYSIsImpvYiI6Iteo15XXpteXIiwicGhvbmVOdW1iZXJzIjpbIjA1Mi0xMjM0NTY3Il0sImFkZHJlc3MiOiLXqNeX15XXkSDXlNee157Xqten15nXnSAzNCIsInBob3RvIjpudWxsLCJqdGkiOiJhN2M0ZjFlOS01OGYxLTQ1YjUtODQ2MS01MjdlNjdlMzNhNzgiLCJpYXQiOjE1OTMwODQ2NTcsImV4cCI6MTU5NTY3NjY1NywiZmlyc3ROYW1lIjoi16DXmdeZ16fXmSIsImxhc3ROYW1lIjoi15DXk9eZ15PXoSJ9.KEim6QOQwA98ItN395AqFW86nt8BOIvKOkSN5u95Dwc";
    const authorization = process.env.AUTHORIZATION_TOKEN;
    return authorization;
  } catch (e) {
    throw e;
  }
};

exports.getMetadata = async (fileId, userId) => {
  try {
    const url = `${process.env.DRIVE_URL}/api/files/${fileId}`;
    const authorization = generateAuthorizationHeader(userId);
    const metadata = await axios.get(url, {
      headers: { Authorization: authorization },
    });
    return metadata.data;
  } catch (error) {
    throw error;
  }
};
