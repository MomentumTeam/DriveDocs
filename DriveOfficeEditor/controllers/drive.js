const fs = require('fs');
const axios = require("axios");
var FormData = require('form-data');
const metadataService = require("../services/metadataService");
const logger = require("../services/logger.js");

exports.uploadNewFileToDrive = async (req, res, next) => {
    if(!req.query.name || !req.query.type){
        logger.log({
            level: "error",
            message: `status 500: the name and type must be inserted`,
            label: `user: ${user.id}`
        });
        res.send("status 500: the name and type must be inserted")
    }
    const path = `${req.query.name}.${req.query.type}`;
    res.locals.path = path;
    fs.openSync(path, 'w');
    const data = new FormData();
    data.append('file', fs.createReadStream(path));
    const accessToken = metadataService.getAuthorizationHeader(req.user);
    console.log("acesstoken" +accessToken);
    let fileId;
    try {
        fileId = await upload(data, req.query.parentId, accessToken);
    } catch (error){
        console.log(error);
        if(error.response.status == 400){
            logger.log({
                level: "error",
                message: 'status 400: name of newFile is already taken',
                label: `user: ${user.id}`
            });
            return res.status(400).send("status 400: name of newFile is already taken");
            
        } 
        logger.log({
            level: "error",
            message: `status 500: ${error.message}`,
            label: `user: ${user.id}`
        });
        return res.status(400).send(`status 500: ${error.message}`);
    }
    res.locals.fileId = fileId;
    next();
}

async function upload(filedata, parentId, accessToken) {
    try{
        const config = {
            method: 'post',
            url: `${process.env.DRIVE_URL}/api/upload?uploadType=multipart${parentId ? `&parent=${parentId}` : ""}`,
            headers: { 
                'Authorization': accessToken,
                "Auth-Type": "Docs",
                ...filedata.getHeaders()
            },
            data : filedata
        };
        const response = await axios(config);
        return response.data;
    }
    catch(error){
        throw error;
    };
}
