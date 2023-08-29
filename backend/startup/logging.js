const winston = require("winston");
const config = require("config");

const { combine, timestamp, printf } = winston.format;

const createLogger = () => {
  winston.exceptions.handle(
    new winston.transports.File({
      filename: "./logs/uncaughtExceptions.log",
      level: "error",
    }),
  );

  process.on("unhandledRejection", (ex) => {
    throw ex;
  });

  const myFormat = printf(
    ({ level, message, timestamp }) =>
      `[${timestamp}] [${level}] [%X{traceid}] ${message}\n`,
  );

  const logger = winston.createLogger({
    level: config.get("logger.level"),
    format: combine(timestamp(), myFormat),
    defaultMeta: { service: "user-service" },
    transports: [
      new winston.transports.File({
        filename: "./logs/error.log",
        level: "error",
      }),
      new winston.transports.File({ filename: "./logs/combined.log" }),
      new winston.transports.File({
        filename: "./logs/requests.log",
        level: "info",
      }),
    ],
  });

  return logger;
};

module.exports = createLogger;
