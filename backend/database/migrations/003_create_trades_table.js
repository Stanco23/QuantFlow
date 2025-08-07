/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('trades', function(table) {
    table.increments('id').primary();
    table.integer('backtest_id').unsigned().references('id').inTable('backtests').onDelete('CASCADE');
    table.integer('strategy_id').unsigned().references('id').inTable('strategies').onDelete('CASCADE');
    table.string('symbol', 50).notNullable();
    table.string('side', 10).notNullable(); // 'buy' or 'sell'
    table.string('type', 20).notNullable(); // 'market', 'limit', etc.
    table.decimal('quantity', 20, 8).notNullable();
    table.decimal('price', 20, 8).notNullable();
    table.decimal('fee', 15, 8);
    table.datetime('executed_at').notNullable();
    table.string('status', 20).defaultTo('filled');
    table.json('metadata'); // Additional trade data like order ID, etc.
    table.decimal('pnl', 15, 2); // Profit/Loss for this trade
    table.timestamps(true, true);
    
    // Add indexes for better query performance
    table.index(['backtest_id']);
    table.index(['strategy_id']);
    table.index(['symbol']);
    table.index(['executed_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('trades');
};
