const passport = require('../authentication/passport');

module.exports = (app) => {
  app.use(passport.initialize());
  app.use(passport.session());
  app.get('/login', passport.authenticate('shraga'), function (req, res, next) {
    return res.status(200).json(req.user);
  });

  app.post('/success', passport.authenticate('shraga'), function (req, res, next) {
    return res.redirect(req.user.relayState);
  });
};