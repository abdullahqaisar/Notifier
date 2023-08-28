const { v4: uuidv4 } = require("uuid");

const generateTraceId = (req) => {
  if (!req.headers["x-trace-id"]) {
    req.headers["x-trace-id"] = uuidv4();
  }
};

module.exports = {
  generateTraceId,
};
