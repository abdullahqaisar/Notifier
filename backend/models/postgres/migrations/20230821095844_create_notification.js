/* eslint-disable prettier/prettier */

exports.up = function (knex) {
    return knex.schema.createTable("notifications", (table) => {
      table.increments("id").primary();
      table.string("name").notNullable();
      table.string("description").notNullable();
      table.string("templateSubject").notNullable();
      table.string("templateBody").notNullable();
      table.json("notificationTags");
      table.boolean("isActive").defaultTo(true);
      table.boolean("isDeleted").defaultTo(false);
      table.timestamp("createdDate").defaultTo(knex.fn.now());
      table.timestamp("modifiedDate").defaultTo(knex.fn.now());
      table
      .integer('eventId')
      .unsigned()
      .references('id')
      .inTable('events') // Reference the 'applications' table
      .onDelete('CASCADE') // Delete events if the referenced application is deleted
      .onUpdate('CASCADE'); // Update events if the referenced application's ID changes
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTableIfExists("notifications");
  };
  