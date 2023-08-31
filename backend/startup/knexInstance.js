const knex = require("knex");
const knexFile = require("../models/postgres/knexfile");

const env = process.env.NODE_ENV;
const knexInstance = knex(knexFile[env]);

module.exports = knexInstance;
