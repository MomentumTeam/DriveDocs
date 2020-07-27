const passport = require("passport");
const shraga = require("passport-shraga");
const logger = require("../services/logger.js");

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

const config = {
  callbackURL: `${process.env.OFFICE_EDITOR_URL}/success`,
  shragaURL: process.env.SHRAGA_URL,
  useADFS: true,
  useEnrichId: true,
};
passport.use(
  new shraga.Strategy(config, (profile, done) => {
    const array = profile.RelayState.split("/");
    const fileId = array[array.length - 1];
    const user = {
      id: profile.id,
      name: profile.name.firstName + " " + profile.name.lastName,
      displayName: profile.displayName,
      job: profile.job,
      relayState: profile.RelayState,
      fileId: fileId,
    };
    logger.log({
      level: "info",
      message: 'finish passport middleware',
      label: `user: ${user.id}`
    });
    return done(null, user);
  })
);

module.exports = passport;
