const redis = require("./redis");

exports.resolver = async (req, res, next) =>{
    let onlineSession = await redis.get(req.params.id);
    let localSession = await redis.get(`local.${req.params.id}`);
    let mode = req.url.split("/")[2] == "files" ? "online" : "local";
    if((!onlineSession && !localSession) || req.query.operation == "read"){
      next();
    }else if(req.query.operation == "edit"){
      if(mode == "online" && localSession){
        localSession = JSON.parse(localSession);
        if(localSession.user.permission == "write"){
          console.log("online")
          console.log(localSession)
          // TODO open online in view mode
          req.query.operation == "view"
          next()
        }else{
          next();
        }
      }
      if(mode == "local"){
        if(onlineSession){
          console.log("onlineSession");
          onlineSession = JSON.parse(JSON.parse(onlineSession));
          console.log(onlineSession);
          let usersInEdit = onlineSession.Users.filter(user => user.Permission == "write");
          if(usersInEdit){
            const webDavPath = `${process.env.WEBDAV_URL}/files/${res.locals.webDavFolder}/${res.locals.webDavFileName}`;
            // A page where the user decides whether to open a local view or join an online edit 
            res.render("localOffice", {
              id:req.params.id,
              name:res.locals.metadata.name,
              type:res.locals.metadata.type,
              users:onlineSession.Users,
              lastUpdated:onlineSession.lastUpdated,
              onlineUrl:`../files/${req.params.id}`,
              localUrl:`../localOffice/view/${req.params.id}`
            });
          }
        }else if(localSession){
          localSession = JSON.parse(localSession);
          console.log("localSession");
          console.log(localSession)
          if(localSession.user.permission == "write"){
            res.render("localOffice", {
              id:req.params.id,
              name:res.locals.metadata.name,
              type:res.locals.metadata.type,
              onlineUrl:null,
              localUrl:`../localOffice/view/${req.params.id}`
            });
          }else{
            next();
          }
        }
      }
    }
}