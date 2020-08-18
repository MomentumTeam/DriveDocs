const fs = require('fs');
const request = require('request');
const drive = require("../controllers/drive.js");

exports.convertAndUpdateInDrive = async (fileId, newFormat, oldFormat, driveAccessToken) => {
  const newFileName = `${process.env.CONVERT_FOLDER}/${fileId}.${newFormat}`;
  await drive.updateFile(fileId, newFileName, driveAccessToken);
  fs.unlinkSync(newFileName);
};
