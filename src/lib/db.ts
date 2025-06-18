import dotenv from "dotenv";
import knex from "knex";
dotenv.config();

const db = knex({
  client: "pg",
  connection: process.env.DB_CONNECTION_STRING,
  searchPath: ["knex", "public", "extensions"],
  debug: process.env.NODE_ENV !== "production",
});

export default db;
