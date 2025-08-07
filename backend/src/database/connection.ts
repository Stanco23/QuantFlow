import knex from 'knex';
import * as path from 'path';

const knexConfig = {
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../../database/dev.sqlite3')
  },
  migrations: {
    directory: path.join(__dirname, '../../database/migrations')
  },
  useNullAsDefault: true
};

const db = knex(knexConfig);

export default db;
