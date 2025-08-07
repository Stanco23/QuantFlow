# QuantFlow Database

This directory contains the database configuration and migrations for the QuantFlow project.

## Setup

The database is already configured to use SQLite for development with the file `./dev.sqlite3`.

### Running Migrations

From the project root, run:
```bash
npm run migrate
```

This will run all pending migrations and create/update the database schema.

## Database Schema

### Tables

1. **strategies**
   - `id`: Primary key
   - `name`: Unique strategy name
   - `config`: JSON configuration for the strategy
   - `description`: Optional text description
   - `status`: Strategy status (default: 'inactive')
   - `metrics`: JSON object for storing strategy metrics
   - `created_at`, `updated_at`: Timestamps

2. **backtests**
   - `id`: Primary key
   - `name`: Backtest name
   - `strategy_id`: Foreign key to strategies table
   - `config`: JSON configuration for the backtest
   - `status`: Backtest status (default: 'pending')
   - `start_date`, `end_date`: Date range for the backtest
   - `initial_capital`: Starting capital for the backtest
   - `metrics`: JSON object for storing backtest performance metrics
   - `results`: JSON object for storing detailed backtest results
   - `created_at`, `updated_at`: Timestamps

3. **trades**
   - `id`: Primary key
   - `backtest_id`: Foreign key to backtests table
   - `strategy_id`: Foreign key to strategies table
   - `symbol`: Trading symbol (e.g., 'BTCUSDT')
   - `side`: Trade side ('buy' or 'sell')
   - `type`: Order type ('market', 'limit', etc.)
   - `quantity`: Trade quantity
   - `price`: Execution price
   - `fee`: Trading fee (optional)
   - `executed_at`: Trade execution timestamp
   - `status`: Trade status (default: 'filled')
   - `metadata`: JSON object for additional trade data
   - `pnl`: Profit/Loss for the trade
   - `created_at`, `updated_at`: Timestamps

## Files

- `knexfile.js`: Knex configuration file
- `migrations/`: Directory containing database migration files
  - `001_create_strategies_table.js`
  - `002_create_backtests_table.js`  
  - `003_create_trades_table.js`
- `dev.sqlite3`: SQLite database file (created after first migration)
