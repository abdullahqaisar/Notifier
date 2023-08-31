const status = require("http-status");
const logger = require("../startup/logging")();
const debug = require("../startup/debug");

module.exports = function (err, req, res, next) {
  const traceId = req.header("X-Trace-Id");

  // Log the error message and stack trace using error log level
  logger.error({ traceId, errorMessage: err.message, stack: err.stack });

  // Log the debug information
  debug(err);

  // Respond with an internal server error status
  res.status(status.INTERNAL_SERVER_ERROR).send("Something failed");
};
