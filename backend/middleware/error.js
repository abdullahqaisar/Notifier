const status = require("http-status");
const debug = require("../startup/debug");
const logger = require("../startup/logging")();

// eslint-disable-next-line no-unused-vars
module.exports = function (err, req, res, next) {
  debug(err);
  const traceId = req.header("X-Trace-Id");
  logger.error(`[${traceId}] ${err.message}`);
  res.status(status.INTERNAL_SERVER_ERROR).send("Something failed");
};
