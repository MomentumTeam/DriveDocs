const fs = require("fs");
const axios = require("axios");
var FormData = require("form-data");
// const mime = require('mime-types');
// const path = require('path');

exports.updateFile = async (fileId, filePath, accessToken) => {
    const size = getFileSize(filePath); //
    // mimeType = mime.contentType(path.extname(filePath))
    const data = new FormData();
    data.append('file', fs.createReadStream(filePath));
    const uploadId = await getUploadId(size, fileId, accessToken); 
    const config = {
        method: 'post',
        url: `${process.env.DRIVE_URL}/api/upload?uploadType=resumable&uploadId=${uploadId}`,
        headers: { 
            'Content-Range': `bytes 0-${size-1}/${size}`, 
            'Authorization': accessToken,
            "Auth-Type": "Docs",
            ...data.getHeaders(),
            // "X-Mime-Type" : mimeType
        },
    data : data
    };
    try { 
      const response = await axios(config);
      console.log(response.data)
   } catch(error) {
     console.log(error.message);
   }
  }
  
  async function getUploadId (size, fileId, accessToken) {
    const config = { 
      method: 'PUT',
      url: `${process.env.DRIVE_URL}/api/upload/${fileId}`,
      headers: { 
        'Authorization': accessToken, 
        "Auth-Type": "Docs",
        'X-Content-Length': size,
      },
    };
    try { 
       const response = await axios(config);
       return response.headers["x-uploadid"];
    } catch(error) {
      console.log(error.message);
    }
  }
  
  function getFileSize (filePath) {
    const stats = fs.statSync(filePath);
    return `${stats.size}`;
  }