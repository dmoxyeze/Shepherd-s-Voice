/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw("CREATE EXTENSION IF NOT EXISTS vector");

  await knex.schema.createTable("sermons", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.text("preacher").notNullable().defaultTo("Revd. O.T. Jacobs");
    table.text("content").notNullable();
    table.date("date_preached").notNullable();
    table.specificType("topics", "text[]").notNullable().defaultTo("{}");
    table.specificType("themes", "text[]").notNullable().defaultTo("{}");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("sermon_chunks", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("sermon_id")
      .references("id")
      .inTable("sermons")
      .onDelete("CASCADE");
    table.integer("chunk_id").notNullable();
    table.specificType("embedding", "vector(384)").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.unique(["sermon_id", "chunk_id"]);
  });

  await knex.raw(`
    CREATE INDEX idx_sermon_chunks_embedding 
    ON sermon_chunks USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100)
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable("sermon_chunks");
  await knex.schema.dropTable("sermons");
  await knex.raw("DROP EXTENSION IF EXISTS vector");
};
