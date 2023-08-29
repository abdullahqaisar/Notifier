/* eslint-disable prettier/prettier */

exports.up = function (knex) {
    return knex.schema.createTable("messages", (table) => {
      table.increments("id").primary();
      table.string("email").notNullable();
      table.string("subject").notNullable();
      table.string("body").notNullable();
      table.boolean("sent").defaultTo(false);
      table
      .integer('notificationId')
      .unsigned()
      .references('id')
      .inTable('notifications')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
      table.timestamp("sentDate");
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTableIfExists("messages");
  };
  