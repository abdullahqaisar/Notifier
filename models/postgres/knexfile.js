/* eslint-disable prettier/prettier */
const config = require("config")

module.exports = {
  development: {
    client: "postgresql",
    connection: {
      database: config.get("databases.postgres.dbname"),
      user: "postgres",
      password: process.env.POSTGRES_PASSWORD,
    },
    pool: {
      min: 2,
      max: 10,
    },

    migrations: {
      directory: "./migrations",
    },
    searchPath: ["MailSystem"],
    seeds: {
      directory: "./migrations",
    },
  },
}