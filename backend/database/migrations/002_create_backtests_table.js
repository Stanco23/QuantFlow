/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('backtests', function(table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.integer('strategy_id').unsigned().references('id').inTable('strategies').onDelete('CASCADE');
    table.json('config').notNullable();
    table.string('status', 50).defaultTo('pending');
    table.datetime('start_date').notNullable();
    table.datetime('end_date').notNullable();
    table.decimal('initial_capital', 15, 2).notNullable();
    table.json('metrics');
    table.json('results');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('backtests');
};
