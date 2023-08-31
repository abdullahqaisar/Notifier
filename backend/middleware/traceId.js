const { v4: uuidv4 } = require("uuid");

const traceId = (req, res, next) => {
  if (!req.headers["x-trace-id"]) {
    req.headers["x-trace-id"] = uuidv4();
  }
  next();
};

module.exports = traceId;
