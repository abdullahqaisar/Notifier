const morgan = require("morgan");
const createCombinedLogger = require("../startup/logging");

const requestLogger = () => {
  const logger = createCombinedLogger(); // Create the logger instance here

  const morganStream = {
    write: (message) => {
      logger.info(message);
    },
  };

  return morgan(
    (tokens, req, res) => {
      const traceId = req.header("X-Trace-Id");
      const body = JSON.stringify(req.body);
      return JSON.stringify({
        traceid: traceId,
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: tokens.status(req, res),
        responseTime: `${tokens["response-time"](req, res)} ms`,
        body,
      });
    },
    { stream: morganStream },
  );
};

module.exports = requestLogger;
