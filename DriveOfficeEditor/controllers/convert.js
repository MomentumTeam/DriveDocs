const fs = require('fs');
const request = require('request');
const drive = require("../controllers/drive.js");
const logger = require("../services/logger.js");
const { config } = require("../config/config.js");

exports.convertAndUpdateInDrive = async (fileId, newFormat, oldFormat, driveAccessToken, accessToken) => {
  try {
    const oldName = `${fileId}.${oldFormat}`;
    const newName = `${fileId}.${newFormat}`;
    const downloadedFilePath = `${process.env.DOWNLOADS_FOLDER}/${oldName}`;
    const convertedFilePath = `${process.env.CONVERTED_FOLDER}/${newName}`;
    await drive.downloadFileFromDrive(fileId, downloadedFilePath, driveAccessToken, accessToken);
    if (newFormat != config.fileTypes.PPTX) {
      await convert(downloadedFilePath, convertedFilePath, newFormat);
    } else {
      await pptConvert(fileId);
    }
    await drive.updateFile(fileId, convertedFilePath, driveAccessToken);
    fs.unlinkSync(convertedFilePath);
    fs.unlinkSync(downloadedFilePath)
    logger.log({
      level: "info",
      message: `File was coverted from ${oldFormat} to ${newFormat} and updated in Drive successfully`,
      label: `fileId: ${fileId}`
    });
  }
  catch (err) {
    logger.log({
      level: "error",
      message: `Error while trying to convert file from ${oldFormat} to ${newFormat}`,
      label: `fileId: ${fileId}`
    });
    throw err;
  }

};

const convert = async (downloadedFilePath, convertedFilePath, newFormat) => {
  return new Promise((resolve, reject) => {
    try {
      const req = request.post(`${process.env.CONVERT_SERVICE_URL}/convert`);
      const form = req.form();
      form.append('file', fs.createReadStream(downloadedFilePath));
      form.append('format', newFormat);
      const writer = fs.createWriteStream(convertedFilePath);
      req.pipe(writer);
      writer.on('finish', () => { resolve("success"); });
      writer.on('error', () => { reject("error"); });
    }
    catch (err) {
      logger.log({
        level: "error",
        message: `Error while converting ${downloadedFilePath} to ${newFormat} using versed Service`,
        label: `versed service`
      });
      reject("error");
    }
  });
}

const pptConvert = async (fileId) => {
  return new Promise((resolve, reject) => {
    try {
      request.get(`${process.env.PPT_CONVERTER_URL}/pptConvert/${fileId}`)
        .on('response', function (response) {
          resolve();
        }).on('error', function (err) {
          reject();
      });
    }
    catch (err) {
      logger.log({
        level: "error",
        message: `Error while converting the ppt file ${fileId} to pptx using the PPT converter`,
        label: `PPT converter`
      });
      throw err;
    }
  });
}
