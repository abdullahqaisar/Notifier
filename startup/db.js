const mongoose = require("mongoose");
const config = require("config");
const debug = require("./debug");

module.exports = function connectDatabase() {
  const dbType = config.get("dbType");
  if (dbType === "mongo") {
    const db = config.get("databases.mongo");
    return mongoose
      .connect(db)
      .then(() => debug(`Connected to ${db} (MongoDB)...`));
  }

  const dbConfig = config.get("databases.postgres");
  return debug(`Connected to ${dbConfig.dbname} (PostgreSQL)...`);
};
