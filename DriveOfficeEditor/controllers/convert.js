const fs = require('fs');
const request = require('request');
const drive = require("../controllers/drive.js");

exports.convertAndUpdateInDrive = async (fileId, newFormat, oldFormat, driveAccessToken) => {
  console.log("convertAndUpdateInDrive")
  const file= await drive.downloadFileFromDrive(fileId, driveAccessToken);
  // let readableFile=fs.createReadStream(`${fileId}.${fileType}`);
  // console.log(readableFile);
  console.log("DOWNLreplaceOAD FINISHED");

  // let req = request.post('52.169.254.71:3005/convert');
  // let form = req.form();
  // form.append('file', fs.createReadStream(file));
  // form.append('format', newFormat);
  // req.pipe(fs.createWriteStream('image.gif'));
  
  //TODO Call the api of Versed in order to convert the file
  //TODO update in drive according to the new converted file with drive.updateFile()
};
