const fs = require('fs');
const axios = require("axios");
var FormData = require('form-data');
const metadataService = require("../services/metadataService");
const accessToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlNTY4ODMyNDIwM2ZjNDAwNDM1OTFhYSIsImFkZnNJZCI6InQyMzQ1ODc4OUBqZWxsby5jb20iLCJnZW5lc2lzSWQiOiI1ZTU2ODgzMjQyMDNmYzQwMDQzNTkxYWEiLCJuYW1lIjp7ImZpcnN0TmFtZSI6Iteg15nXmden15kiLCJsYXN0TmFtZSI6IteQ15PXmdeT16EifSwiZGlzcGxheU5hbWUiOiJ0MjM0NTg3ODlAamVsbG8uY29tIiwicHJvdmlkZXIiOiJHZW5lc2lzIiwiZW50aXR5VHlwZSI6ImRpZ2ltb24iLCJjdXJyZW50VW5pdCI6Im5pdHJvIHVuaXQiLCJkaXNjaGFyZ2VEYXkiOiIyMDIyLTExLTMwVDIyOjAwOjAwLjAwMFoiLCJyYW5rIjoibWVnYSIsImpvYiI6Iteo15XXpteXIiwicGhvbmVOdW1iZXJzIjpbIjA1Mi0xMjM0NTY3Il0sImFkZHJlc3MiOiLXqNeX15XXkSDXlNee157Xqten15nXnSAzNCIsInBob3RvIjpudWxsLCJqdGkiOiIzNWVjYTQwYy0zYjlkLTQzM2UtODc4Ni1hN2Y2N2IxMzIyNWUiLCJpYXQiOjE1OTY3MjIzMzYsImV4cCI6MTU5OTMxNDMzNiwiZmlyc3ROYW1lIjoi16DXmdeZ16fXmSIsImxhc3ROYW1lIjoi15DXk9eZ15PXoSJ9.seu5-55wk5fAMxTiK63v37Unbuigadexm3W_K1ycNgA';

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
