const knex = require("../../startup/knexInstance");

const Message = {
  getAllByNotificationId(notificationId) {
    return knex.select("*").from("messages").where({ notificationId });
  },

  insertManyByNotificationId(notificationId, messages) {
    const formattedMessages = messages.map((message) => ({
      notificationId,
      email: message.email,
      subject: message.subject,
      body: message.body,
    }));

    return knex("messages").insert(formattedMessages).returning("*");
  },
};

module.exports = Message;
