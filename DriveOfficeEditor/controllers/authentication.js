exports.isAuthenticated = (req, res, next) => {
  try {
    console.log("isAuthenticated");
    if (req.isAuthenticated()) {
      return next();
    } else {
      return res.redirect("/login?RelayState=" + req.originalUrl);
    }
  } catch (e) {
    return res.status(500).send(e);
  }
};
