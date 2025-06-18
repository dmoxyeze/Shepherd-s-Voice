require("dotenv").config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: "pg",
    connection: process.env.DB_CONNECTION_STRING,
    searchPath: ["knex", "public", "extensions"],
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds/dev",
    },
  },

  production: {
    client: "pg",
    connection: process.env.DB_CONNECTION_STRING,
    searchPath: ["knex", "public", "extensions"],
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds/prod",
    },
  },
};
