const knex = require("knex");
const knexFile = require("../models/postgres/knexfile");

const knexInstance = knex(knexFile.development);

module.exports = knexInstance;
