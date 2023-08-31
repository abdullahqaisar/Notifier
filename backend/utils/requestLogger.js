const morgan = require("morgan");
const createCombinedLogger = require("../startup/logging");

const requestLogger = () => {
  const logger = createCombinedLogger();

  const morganStream = {
    write: (message) => {
      const { traceId, logMessage } = JSON.parse(message);
      logger.info({ traceId, logMessage });
    },
  };

  return morgan(
    (tokens, req, res) => {
      const traceId = req.header("X-Trace-Id");
      const body = JSON.stringify(req.body);
      const logMessage = {
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: tokens.status(req, res),
        responseTime: `${tokens["response-time"](req, res)} ms`,
        body,
      };
      return JSON.stringify({ traceId, logMessage });
    },
    { stream: morganStream },
  );
};

module.exports = requestLogger;
