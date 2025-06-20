/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Create a separate schema for extensions
  await knex.raw(`CREATE SCHEMA IF NOT EXISTS extensions`);

  // Install the pgvector extension in the default schema if needed
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS vector`);

  // Move the extension to the 'extensions' schema
  await knex.raw(`ALTER EXTENSION vector SET SCHEMA extensions`);

  // Create the sermons table
  await knex.schema.createTable("sermons", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.text("topic").notNullable();
    table.specificType("scriptures", "text[]").notNullable().defaultTo("{}");
    table.text("preacher").notNullable().defaultTo("Revd. O.T. Jacobs");
    table.text("full_text").nullable();
    table.date("date_preached").notNullable();
    table.specificType("themes", "text[]").notNullable().defaultTo("{}");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  // Create the sermon_chunks table with schema-qualified vector type
  await knex.schema.createTable("sermon_chunks", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("sermon_id")
      .references("id")
      .inTable("sermons")
      .onDelete("CASCADE");
    table.integer("chunk_id").notNullable();
    table.text("content").notNullable();
    table.specificType("embedding", "extensions.vector(384)").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.unique(["sermon_id", "chunk_id"]);
  });

  // Index on the embedding using schema-qualified operator class
  await knex.raw(`
    CREATE INDEX idx_sermon_chunks_embedding 
    ON sermon_chunks USING ivfflat (embedding extensions.vector_cosine_ops)
    WITH (lists = 100)
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("sermon_chunks");
  await knex.schema.dropTableIfExists("sermons");
  await knex.raw("DROP EXTENSION IF EXISTS vector");
  await knex.raw("DROP SCHEMA IF EXISTS extensions CASCADE");
};
