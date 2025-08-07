/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('strategies', function(table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable().unique();
    table.json('config').notNullable();
    table.text('description');
    table.string('status', 50).defaultTo('inactive');
    table.json('metrics');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('strategies');
};
