const redis = require("./redis");
const axios = require("axios");


const cleanUpId = (id) => {
  return new Promise( async (resolve, reject) =>{
    try {
      const url = `${process.env.WOPI_URL}/cleanUp/${id}`;
      await axios.get(url);
      resolve("ok");
    }
    catch (err) {
      reject(err);
    }
  });

}

exports.resolver = async (req, res, next) => {
  let onlineSession = await redis.get(req.params.id);
  let localSession = await redis.get(`local.${req.params.id}`);
  // let mode = req.url.split("/")[2] == "files" ? "online" : "local";
  let mode = req.url.includes("/files/") ? "online" : "local";
  if ((!onlineSession && !localSession) || req.query.operation == "read") {
    next();
  } else if (req.query.operation == "edit") {
    if (mode == "online" && localSession) {
      if(req.query.force){
        try{
          await closeLocalSession(req.params.id);
        }catch(err){
          return res.status(500).send(err.message);
        }
        next();
      }
      else{
        localSession = JSON.parse(localSession);
        const userName = (localSession.user && localSession.user.name)?localSession.user.name : "";
        const userId = req.user.id;
        let userIdInSession = localSession.user.id;
        let message = "ערוך את הקובץ בכל זאת";
        if(userId == userIdInSession){
          message = "סגרתי את המסמך, רוצה לערוך באונליין";
        } 
        return res.render("localOffice", {
          id: req.params.id,
          name: res.locals.metadata.name,
          type: res.locals.metadata.type,
          user: userName,
          onlineUrl: `../files/view/${req.params.id}`,
          onlineUrlForce: `../files/${req.params.id}?force=1`,
          local: true,
          message: message,
        });
      }
    } else if (mode == "local") {
      if (onlineSession)  {
        onlineSession = JSON.parse(onlineSession);
        let usersInEdit = onlineSession.Users.filter(user => user.Permission == "write");
        if (usersInEdit && usersInEdit.length > 0) {
          // A page where the user decides whether to open a local view or join an online edit 
          return res.render("localOffice", {
            id: req.params.id,
            name: res.locals.metadata.name,
            type: res.locals.metadata.type,
            users: onlineSession.Users,
            lastUpdated: onlineSession.lastUpdated,
            onlineUrl: `../files/${req.params.id}`,
            onlineUrlForce: `../files/${req.params.id}?force=1`,
            local: false,
            message: "הצטרף לעריכה המשותפת",
          });
        }
        else{
          try{
            await cleanUpId(req.params.id);
          }
          catch(error){
          }
          
          return res.render("pleaseWait");
        }
      } else if (localSession) {
        localSession = JSON.parse(localSession);
        const userId = req.user.id;
        let userIdInSession = localSession.user.id;
        if(userId == userIdInSession){
          res.locals.webDavFolder = localSession.webDavFolder;
          res.locals.webDavFileName = localSession.webDavFileName;
          next();
        }
        else{
          const userName = (localSession.user && localSession.user.name)?localSession.user.name : "";
          return res.render("localOffice", {
            id: req.params.id,
            name: res.locals.metadata.name,
            type: res.locals.metadata.type,
            onlineUrl: `../files/view/${req.params.id}`,
            onlineUrlForce: `../files/${req.params.id}?force=1`,
            user: userName,
            local: true,
            message:"ערוך את הקובץ בכל זאת",
          });
        }
      } 
    } else {
      next();
    }
  }
}

const closeLocalSession = async (fileId) => {
  try{
    return await axios.post(`${process.env.WEBDAV_MANAGER_URL}/closeSession`, {fileId: fileId});
  }catch(err){
    return Promise.reject(err);
  }
  }