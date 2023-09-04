/* eslint-disable prettier/prettier */
const config = require("config")

module.exports = {
  development: {
    client: "postgresql",
    connection: {
      database: config.get("databases.postgres.dbname"),
      user: "postgres",
      password: "abdullah",
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

  test: {
    client: "postgresql",
    connection: {
      database: config.get("databases.postgres.dbname"),
      user: "postgres",
      password: "abdullah",
    },
    pool: {
      min: 2,
      max: 10,
    },

    migrations: {
      directory: "./models/postgres/migrations",
    },
    searchPath: ["MailSystem"],
    seeds: {
      directory: "./models/postgres/migrations",
    },
  },
}