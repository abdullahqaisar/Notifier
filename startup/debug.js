const config = require("config");

const debugNamespace = config.get("debugNamespace");
const debug = require("debug")(debugNamespace);

module.exports = debug;
