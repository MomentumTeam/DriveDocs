const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const editor = require("./routes/editor");
const auth = require("./routes/authentication");
const app = express();
//process.env.WOPI_URL = process.env.WOPI_URL_LIHI;
//process.env.DRIVE_SERVICE_URL = process.env.DRIVE_SERVICE_URL_LIHI;
//process.env.REDIS_HOST = process.env.WOPI_URL_LIHI;
//process.env.REDIS_PORT = process.env.WOPI_URL_LIHI;
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(
  session({
    secret: "passport",
    cookie: { maxAge: 7 * 24 * 60 * 60000 },
    resave: false,
    saveUninitialized: true,
  })
);
auth(app);
editor(app);

app.listen(process.env.PORT, () => console.log(`Drive Office Editor is listening at http://localhost:${process.env.PORT}`));
