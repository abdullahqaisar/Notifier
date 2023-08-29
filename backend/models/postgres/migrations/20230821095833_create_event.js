/* eslint-disable prettier/prettier */

exports.up = function (knex) {
    return knex.schema.createTable("events", (table) => {
      table.increments("id").primary();
      table.string("name").notNullable();
      table.string("description").notNullable();
      table
      .integer('applicationId')
      .unsigned()
      .references('id')
      .inTable('applications')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
      table.boolean("isActive").defaultTo(true);
      table.boolean("isDeleted").defaultTo(false);
      table.timestamp("createdDate").defaultTo(knex.fn.now());
      table.timestamp("modifiedDate").defaultTo(knex.fn.now());
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTableIfExists("events");
  };
  