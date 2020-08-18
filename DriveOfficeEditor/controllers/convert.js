const fs = require('fs');
const axios = require("axios");
const FormData = require("form-data");
const drive = require("../controllers/drive.js");
const request = require('request');


exports.convertAndUpdateInDrive = async (fileId, newFormat, oldFormat, driveAccessToken, accessToken) => {
  const oldName = `${fileId}.${oldFormat}`;
  const newName = `${fileId}.${newFormat}`;
  const downloadedFilePath = `../..${process.env.DOWNLOADS_FOLDER}/${oldName}`;
  const convertedFilePath = `../..${process.env.CONVERTED_FOLDER}/${newName}`;

  await drive.downloadFileFromDrive(fileId, downloadedFilePath, driveAccessToken, accessToken);
  
  const req = request.post(`${process.env.CONVERT_SERVICE_URL}/convert`);
  const form = req.form();
  form.append('file', fs.createReadStream(downloadedFilePath));
  form.append('format', newFormat);
  req.pipe(fs.createWriteStream(convertedFilePath));
  
  fs.unlinkSync(downloadedFilePath);
};
