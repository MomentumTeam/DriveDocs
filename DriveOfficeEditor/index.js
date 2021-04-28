const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const editor = require("./routes/editor");
const auth = require("./routes/authentication");
const localOffice = require("./routes/localOffice");
const newPage = require("./routes/newPage");
const logger = require("./services/logger.js");
const path = require('path');
const redis = require('./controllers/redis');

const app = express();
app.use('/scripts', express.static(path.join(__dirname, 'views', 'scripts')))
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "passport",
    cookie: { maxAge: 7 * 24 * 60 * 60000 },
    resave: false,
    saveUninitialized: true,
  })
);

// adding routes for authentication
auth(app);

// adding routes for creating blank pages
newPage(app);

// adding the main route of editing/viewing files
editor(app);

const enableLocalOffice = process.env.ENABLE_LOCAL_OFFICE == "true";

if (enableLocalOffice) {
  // adding the route of editing/viewing files in local office
  localOffice(app);
}

const server = app.listen(process.env.PORT, () =>
  logger.log({
    level: "info",
    message: `Drive Office Editor is listening on http://localhost:${process.env.PORT}`,
    label: "DriveOfficeEditor up",
  })
);

const io = require("socket.io")(server);

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  const fileId = socket.handshake.query.fileId;
  try {
    socket.on('disconnect', async () => {
      logger.log({
        level: "info",
        message: `press X - exit`,
        label: `user: ${userId}`,
      });
      await redis.removeUserFromSession(fileId, userId);
    });
  } catch (e) {
    logger.log({
      level: "error",
      message: `Fail in detected exit and Remove user`,
      label: `user: ${userId}`,
    });
  }
});
