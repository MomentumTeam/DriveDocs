const fs = require('fs');
const axios = require("axios");
const FormData = require("form-data");
const drive = require("../controllers/drive.js");
const request = require('request');

exports.convertAndUpdateInDrive = async (fileId, newFormat, oldFormat, driveAccessToken, accessToken) => {
  try{
    const oldName = `${fileId}.${oldFormat}`;
    const newName = `${fileId}.${newFormat}`;
    const downloadedFilePath = `${process.env.DOWNLOADS_FOLDER}/${oldName}`;
    const convertedFilePath = `${process.env.CONVERTED_FOLDER}/${newName}`;
    await drive.downloadFileFromDrive(fileId, downloadedFilePath, driveAccessToken, accessToken);
    if(newFormat != "pptx"){
      await convert(downloadedFilePath, convertedFilePath, newFormat);
    } else{
      await pptConvert(fileId);
    }
    await drive.updateFile(fileId, convertedFilePath, driveAccessToken);
    fs.unlinkSync(convertedFilePath);
    fs.unlinkSync(downloadedFilePath)
  }
  catch(err){
    throw err;
  }

};

const convert = async (downloadedFilePath, convertedFilePath, newFormat) => {
  return new Promise((resolve,reject) => {
    try{
      const req = request.post(`${process.env.CONVERT_SERVICE_URL}/convert`);
      const form = req.form();
      form.append('file', fs.createReadStream(downloadedFilePath));
      form.append('format', newFormat);
      const writer=fs.createWriteStream(convertedFilePath);
      req.pipe(writer);
      writer.on('finish', () => {resolve("success");});
      writer.on('error', () => {reject("error");});
    }
    catch(err){
      reject("error");
    }
  });
}

const pptConvert = async (fileId) => {
  return new Promise((resolve,reject) => {
    try{
    const req = request.get(`${process.env.PPT_CONVERTER_URL}/pptConvert/${fileId}`)
    .on('response', function(response) {
      resolve();
    }).on('error', function(err) {
      console.log("got error:");
      console.log(err);
      reject();
    });
    }
    catch(err){
      throw err;
    }  
  });
}
