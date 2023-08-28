const knex = require("../../startup/knexInstance");

const Notification = {
  count(query) {
    const { name, ...filters } = query;
    const knexQuery = knex("notifications").where(filters);

    if (name) knexQuery.andWhere("name", "ilike", `%${name}%`);

    return knexQuery.count("id", { as: "totalCount" }).first();
  },

  getAll(query) {
    const { page, pageSize, sort, name, ...filters } = query;

    const knexQuery = knex.select("*").from("notifications").where(filters);
    if (name) knexQuery.where("name", "ilike", `%${name}%`);
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

  getByNotificationName(name) {
    return knex("notifications").where({ name }).first();
  },

  getById(id) {
    return knex
      .select("*")
      .from("notifications")
      .where({ id, isDeleted: false })
      .first();
  },
  create(notificationData) {
    const { notificationTags, ...dataWithoutTags } = notificationData;

    return knex("notifications")
      .insert({
        ...dataWithoutTags,
        notificationTags: JSON.stringify(notificationTags),
      })
      .returning("*");
  },

  update(id, notificationData) {
    const { notificationTags, ...dataWithoutTags } = notificationData;

    const updatedRows = knex("notifications")
      .where({ id })
      .update({
        ...dataWithoutTags,
        notificationTags: JSON.stringify(notificationTags),
      })
      .returning("*");

    return updatedRows;
  },

  deactivate(id) {
    return knex("notifications")
      .where({ id })
      .update({ isActive: false })
      .returning("*");
  },

  delete(id) {
    return knex("notifications")
      .where({ id })
      .update({ isActive: false, isDeleted: true })
      .returning("*");
  },
};

module.exports = Notification;
