require("dotenv").config();

module.exports = {
  development: {
    client: "pg",
    connection: process.env.SUPABASE_DB_URL,
    migrations: {
      directory: "./migrations",
      tableName: "knex_migrations",
    },
  },
};

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: "postgresql",
    connection: process.env.DB_CONNECTION_STRING,
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./migrations",
    },
  },

  production: {
    client: "postgresql",
    connection: process.env.DB_CONNECTION_STRING,
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./migrations",
    },
  },
};
