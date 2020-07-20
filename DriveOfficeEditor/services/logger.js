const winston = require("winston");
const { combine, timestamp, label, printf } = winston.format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

var options = {
  file: {
    level: "info",
    filename: "../logs/app.log",
  },
  // console: {
  //   level: "debug",
  //   handleExceptions: true,
  //   json: false,
  //   colorize: true,
  // },
};

const logger = winston.createLogger({
  // level: 'info',
  handleExceptions: true,
  json: true,
  maxsize: 5242880, // 5MB
  maxFiles: 5,
  colorize: false,
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: [
    new winston.transports.File({ filename: '../logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: '../logs/info.log', level: 'info' }),
    // new winston.transports.Console(options.console)
  ],
  exitOnError: false, // do not exit on handled exceptions
});

module.exports = logger;
