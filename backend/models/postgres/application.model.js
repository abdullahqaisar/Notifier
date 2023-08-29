const knex = require("../../startup/knexInstance");

const Application = {
  count(query) {
    const { name, ...filters } = query;
    const knexQuery = knex("applications").where(filters);

    if (name) {
      knexQuery.andWhere("name", "ilike", `%${name}%`);
    }

    return knexQuery.count("id", { as: "totalCount" }).first();
  },

  getAll(query) {
    const { page, pageSize, sort, name, ...filters } = query;

    const knexQuery = knex.select("*").from("applications").where(filters);

    if (name) {
      knexQuery.where("name", "ilike", `%${name}%`);
    }

    if (sort) {
      const [sortField, sortOrder] = sort.split(":");
      if (
        sortField &&
        sortOrder &&
        (sortOrder === "asc" || sortOrder === "desc")
      ) {
        knexQuery.orderBy(sortField, sortOrder);
      }
    }

    knexQuery.limit(pageSize).offset((page - 1) * pageSize);
    return knexQuery;
  },

  getById(id) {
    return knex
      .select("*")
      .from("applications")
      .where({ id, isDeleted: false })
      .first();
  },
  getByAppName(name) {
    return knex("applications").where({ name }).first();
  },
  create(applicationData) {
    return knex("applications").insert(applicationData).returning("*");
  },

  update(id, applicationData) {
    return knex("applications")
      .where({ id })
      .update(applicationData)
      .returning("*");
  },

  deactivate(id) {
    return knex("applications")
      .where({ id })
      .update({ isActive: false })
      .returning("*");
  },

  delete(id) {
    return knex("applications")
      .where({ id })
      .update({ isActive: false, isDeleted: true })
      .returning("*");
  },
};

module.exports = Application;
