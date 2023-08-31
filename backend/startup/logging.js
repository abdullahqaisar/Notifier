const winston = require("winston");
const config = require("config");

const { combine, timestamp, printf } = winston.format;

const createLogger = () => {
  const logLevel = config.get("logLevel");
  const isProduction = process.env.NODE_ENV === "production";

  winston.exceptions.handle(
    new winston.transports.File({
      filename: "./logs/uncaughtExceptions.log",
      level: "error",
    }),
  );

  process.on("unhandledRejection", (ex) => {
    throw ex;
  });

  const logFormat = printf(({ timestamp, level, message }) => {
    const traceId = message.traceId || "N/A";
    const formattedMessage = JSON.stringify(message, null, 2);
    return `[${timestamp}] [${level}] [${traceId}] ${formattedMessage}`;
  });

  const transports = [
    new winston.transports.File({
      filename: "./logs/error.log",
      level: "error",
      verbose: !isProduction,
    }),
    new winston.transports.File({ filename: "./logs/combined.log" }),
  ];

  if (!isProduction) {
    transports.push(
      new winston.transports.File({
        filename: "./logs/debug.log",
        level: "debug",
      }),
    );
  }
  transports.push(
    new winston.transports.File({
      filename: "./logs/requests.log",
      level: "info",
    }),
  );

  const requestsLogger = winston.createLogger({
    level: logLevel,
    format: combine(timestamp(), logFormat),
    defaultMeta: { service: "user-service" },
    transports,
  });

  return requestsLogger;
};

module.exports = createLogger;
