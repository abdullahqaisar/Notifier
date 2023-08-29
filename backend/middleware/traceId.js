// traceIdMiddleware.js
const { generateTraceId } = require("../utils/generateTraceId");

const traceId = (req, res, next) => {
  generateTraceId(req);
  next();
};

module.exports = traceId;
