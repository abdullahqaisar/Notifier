const knex = require("../../startup/knexInstance");

const Event = {
  count(query) {
    const { name, applicationId, ...filters } = query;
    const knexQuery = knex("events").where(filters);

    if (name) {
      knexQuery.andWhere("name", "ilike", `%${name}%`);
    }
    if (applicationId) {
      knexQuery.andWhere("applicationId", applicationId);
    }

    return knexQuery.count("id", { as: "totalCount" }).first();
  },
  getByEventName(name) {
    return knex("events").where({ name }).first();
  },
  getAll(query) {
    const { page, pageSize, sort, name, applicationId, ...filters } = query;

    const knexQuery = knex.select("*").from("events").where(filters);

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
    if (applicationId) {
      knexQuery.where("applicationId", applicationId);
    }
    knexQuery.limit(pageSize).offset((page - 1) * pageSize);
    return knexQuery;
  },

  getById(id) {
    return knex
      .select("*")
      .from("events")
      .where({ id, isDeleted: false })
      .first();
  },
  create(eventData) {
    return knex("events").insert(eventData).returning("*");
  },

  update(id, eventData) {
    return knex("events").where({ id }).update(eventData).returning("*");
  },

  deactivate(id) {
    return knex("events")
      .where({ id })
      .update({ isActive: false })
      .returning("*");
  },

  delete(id) {
    return knex("events")
      .where({ id })
      .update({ isActive: false, isDeleted: true })
      .returning("*");
  },
};

module.exports = Event;
