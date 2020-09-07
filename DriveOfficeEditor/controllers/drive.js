const fs = require("fs");
const axios = require("axios");
var FormData = require("form-data");
const metadataService = require("../services/metadataService");
const logger = require("../services/logger.js");

const types = ["docx", "pptx", "xlsx"];

exports.uploadNewFileToDrive = async (req, res, next) => {
  if (!req.query.name || !req.query.type) {
    logger.log({
      level: "error",
      message: `status 500: the name and type must be inserted`,
      label: `user: ${user.id}`,
    });
    return res.status(500).send("status 500: the name and type must be inserted");
  }
  req.query.type = req.query.type.toLowerCase();
  if (!types.includes(req.query.type)) {
    return res.status(500).send("status 500: type must be docx,pptx, or xlsx!");
  }
  const path = `${req.query.name}.${req.query.type}`;
  res.locals.path = path;
  fs.openSync(path, "w");
  const data = new FormData();
  data.append("file", fs.createReadStream(path));
  const accessToken = metadataService.getAuthorizationHeader(req.user);
  let fileId;
  try {
    fileId = await upload(data, req.query.parentId, accessToken);
    res.locals.fileId = fileId;
    next();
  } catch (error) {
    if (error.response.status == 400) {
      logger.log({
        level: "error",
        message: "status 400: name of newFile is already taken",
        label: `user: ${user.id}`,
      });
      return res.status(400).send("status 400: name of newFile is already taken");
    } else {
      logger.log({
        level: "error",
        message: `status 500: ${error.message}`,
        label: `user: ${user.id}`,
      });
      return res.status(500).send(`status 500: ${error.message}`);
    }
  }
};

exports.redirectToDownload = (req,res,next) => {
  try{
    res.locals.link = `${process.env.DRIVE_URL}/api/files/${req.params.id}?alt=media`;
    // return res.redirect(downloadUrl); 
    // return res.render(html);
    next();
  }
  catch{
    return  res.status(500).send("error");
  }
}

async function upload(filedata, parentId, accessToken) {
  try {
    const config = {
      method: "post",
      url: `${process.env.DRIVE_URL}/api/upload?uploadType=multipart${parentId ? `&parent=${parentId}` : ""}`,
      headers: {
        Authorization: accessToken,
        "Auth-Type": "Docs",
        ...filedata.getHeaders(),
      },
      data: filedata,
    };
    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw error;
  }
}
