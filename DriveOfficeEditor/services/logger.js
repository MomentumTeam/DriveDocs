const winston = require("winston");
require('winston-daily-rotate-file');
const { combine, timestamp, printf } = winston.format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const date = () => {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); 
  var yyyy = today.getFullYear();
  return dd + '.' + mm + '.' + yyyy;
}

const logger = winston.createLogger({
  handleExceptions: true,
  json: true,
  maxFiles: '7d',
  colorize: false,
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: [
    new winston.transports.File({ filename: `../logs/DriveOfficeEditor/error/errorFrom:${date()}.log`, level: 'error' }),
    new winston.transports.File({ filename: `../logs/DriveOfficeEditor/info/infoFrom:${date()}.log`, level: 'info' }),
  ],
  exitOnError: false, // do not exit on handled exceptions
});

module.exports = logger;
