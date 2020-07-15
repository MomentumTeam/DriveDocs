const passport = require("passport");
const shraga = require("passport-shraga");
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

const config = {
  //callbackURL: `http://localhost:${process.env.PORT}/success`,
  callbackURL: `${process.env.OFFICE_EDITOR_URL}/success`,
  shragaURL: process.env.SHRAGA_URL,
  useADFS: true,
  useEnrichId: true,
};
passport.use(
  new shraga.Strategy(config, (profile, done) => {
    console.log(`My Profile Is: ${profile}`);
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
    return done(null, user);
  })
);

module.exports = passport;
