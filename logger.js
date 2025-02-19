const winston = require("winston");
const { format } = winston;
const { combine, timestamp, printf, colorize } = format;

// configure timestamp to use Toronto's timezone
const torontoTimestamp = format((info) => {
  const torontoTime = new Date().toLocaleString("en-US", {
    timeZone: "America/Toronto",
  });
  info.timestamp = torontoTime;
  return info;
});

const logger = winston.createLogger({
  level: "info",
  format: combine(
    torontoTimestamp(),
    format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        printf(({ level, message, timestamp }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      ),
    }),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

module.exports = logger;