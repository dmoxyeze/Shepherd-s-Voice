const { pipeline, env } = require("@xenova/transformers");
const fs = require("fs").promises;
const path = require("path");
const { glob } = require("glob");

env.allowLocalModels = false;
const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

const chunkTranscript = (text, maxLength = 500, hardMax = false) => {
  if (!text.trim()) return [];

  const sentences = text.split(/(?<=[.!?])\s+|(?<=\n\n)/).filter(Boolean);
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (const sentence of sentences) {
    const wordCount = countWords(sentence);
    const wouldExceed = currentLength + wordCount > maxLength;

    if (!wouldExceed) {
      currentChunk.push(sentence);
      currentLength += wordCount;
    } else {
      // Handle cases where a single sentence exceeds maxLength
      if (currentChunk.length === 0 && !hardMax) {
        // If it's the first sentence in chunk and we're not enforcing hard max,
        // allow it but start new chunk afterwards
        currentChunk.push(sentence);
        chunks.push(currentChunk.join(" "));
        currentChunk = [];
        currentLength = 0;
      } else {
        // Normal case - finalize current chunk and start new one
        if (currentChunk.length) {
          chunks.push(currentChunk.join(" "));
        }
        currentChunk = [sentence];
        currentLength = wordCount;
      }
    }
  }

  // Add the last chunk if it exists
  if (currentChunk.length) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
};

// Helper function for accurate word counting
const countWords = (str) => {
  return str.trim() ? str.split(/\s+/).length : 0;
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  const extractor = await pipeline("feature-extraction", MODEL_NAME);
  const sermonsDir = path.join("../../src/transcripts", "sanitized");
  const files = await glob(path.join(sermonsDir, "*.json"), {});
  // Clear existing data
  await knex("sermon_chunks").del();
  await knex("sermons").del();

  for (const file of files) {
    try {
      const filePath = path.join(sermonsDir, file);
      const {
        normalizedMessage: content,
        scriptures,
        themes,
        topic,
      } = JSON.parse(await fs.readFile(filePath, "utf8"));
      console.log(`Processing file: ${file}`);
      // Insert sermon metadata
      const [sermon] = await knex("sermons")
        .insert({
          topic,
          scriptures,
          full_text: content,
          date_preached: new Date().toISOString(),
          themes,
        })
        .returning("id");

      console.log(`Inserted sermon: ${topic} (${sermon.id})`);

      // Chunk the content
      const chunks = chunkTranscript(content);
      console.log(`Chunked ${file} into ${chunks.length} parts`);
      // Process chunks in parallel
      await Promise.all(
        chunks.map(async (chunk, index) => {
          const embedding = await generateEmbedding(extractor, chunk);

          await knex("sermon_chunks").insert({
            sermon_id: sermon.id,
            chunk_id: index + 1,
            content: chunk,
            // embedding: knex.raw(`'[${embedding.join(",")}]'::vector`),
          });
        })
      );

      console.log(`Processed ${file} (${chunks.length} chunks)`);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
};

async function generateEmbedding(extractor, text) {
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}
