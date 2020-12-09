const redis = require("./redis");
const axios = require("axios");

exports.resolver = async (req, res, next) => {
  let onlineSession = await redis.get(req.params.id);
  let localSession = await redis.get(`local.${req.params.id}`);
  let mode = req.url.split("/")[2] == "files" ? "online" : "local";
  if ((!onlineSession && !localSession) || req.query.operation == "read") {
    next();
  } else if (req.query.operation == "edit") {
    if (mode == "online" && localSession) {
      if(req.query.force){
        console.log('remove user...')
        try{
          await closeLocalSession(req.params.id);
        }catch(err){
          return res.status(500).send(err.message);
        }
        console.log('done')
        next()
      }else{
        return res.render("localOffice", {
          id: req.params.id,
          name: res.locals.metadata.name,
          type: res.locals.metadata.type,
          onlineUrl: `../files/view/${req.params.id}`,
          onlineUrlForce: `../files/${req.params.id}?force=true`,
          local: true
        });
      }

    } else if (mode == "local") {
      if (onlineSession)  {
        // console.log("onlineSession");
        onlineSession = JSON.parse(onlineSession);
        // console.log(onlineSession);
        let usersInEdit = onlineSession.Users.filter(user => user.Permission == "write");
        
        if (usersInEdit) {
          // const webDavPath = `${process.env.WEBDAV_URL}/files/${res.locals.webDavFolder}/${res.locals.webDavFileName}`;
          // A page where the user decides whether to open a local view or join an online edit 
          return res.render("localOffice", {
            id: req.params.id,
            name: res.locals.metadata.name,
            type: res.locals.metadata.type,
            users: onlineSession.Users,
            lastUpdated: onlineSession.lastUpdated,
            onlineUrl: `../files/${req.params.id}`,
            onlineUrlForce: `../files/${req.params.id}?force=true`,
            local: false
          });
        }
      } else if (localSession) {
        // console.log(localSession)
        localSession = JSON.parse(localSession);
        // console.log(localSession)
        return res.render("localOffice", {
          id: req.params.id,
          name: res.locals.metadata.name,
          type: res.locals.metadata.type,
          onlineUrl: `../files/view/${req.params.id}`,
          onlineUrlForce: `../files/${req.params.id}?force=true`,
          local: true
        });
      } 
    } else {
      next()
    }
  }
}

const closeLocalSession = async (fileId) => {
  try{
    return await axios.post(`${process.env.WEBDAV_MANAGER_URL}/closeSession`, {fileId: fileId});
  }catch(err){
    console.log(err.message)
    return Promise.reject(err);
  }
  }