import { knex as setupKnex, Knex } from 'knex';
import { env } from './env';

export const config: Knex.Config = {
  client: 'sqlite3',
  connection: env.DATABASE_URL,
  migrations: {
    directory: './db/migrations',
    extension: 'ts',

  },
  useNullAsDefault: true,
}

export const knex = setupKnex(config);