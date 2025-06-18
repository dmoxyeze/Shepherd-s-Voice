import path from "path";
import fs from "fs/promises"; // Changed to promises API
import { glob } from "glob";
import { TRANSCRIPT_DIR } from "@/config";
import { chunkTranscript } from "@/utils/formatting"; // Assuming saveChunks isn't used
import { TTranscript } from "@/types";
import db from "@/lib/db";
import { pipeline, env } from "@xenova/transformers";

// Initialize transformers environment
env.allowLocalModels = false;

const inputDir = path.join(TRANSCRIPT_DIR, "sanitized");

// Initialize extractor once at startup
let extractor: any;

const initializeEmbeddingPipeline = async () => {
  try {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("Embedding pipeline initialized");
  } catch (error) {
    console.error("Failed to initialize embedding pipeline:", error);
    throw error;
  }
};

const generateEmbedding = async (text: string) => {
  if (!extractor) {
    throw new Error("Embedding pipeline not initialized");
  }
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
};

const chunkEmbedAndInsert = async () => {
  try {
    await initializeEmbeddingPipeline();

    const files = await glob(path.join(inputDir, "*.json"));
    if (files.length === 0) {
      console.log("No .json files found in input directory");
      return;
    }

    console.log(`Found ${files.length} sermon files to process`);

    // Clear existing data in transaction
    await db.transaction(async (trx) => {
      await trx("sermon_chunks").del();
      await trx("sermons").del();

      // Process files in batches to avoid memory issues
      const BATCH_SIZE = 5;
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (file) => {
            try {
              const fileContent = await fs.readFile(file, "utf-8");
              const transcript: TTranscript = JSON.parse(fileContent);
              const chunks = chunkTranscript(transcript.normalizedMessage);

              const [sermon] = await trx("sermons")
                .insert({
                  topic: transcript.topic,
                  scriptures: transcript.scriptures,
                  full_text: transcript.normalizedMessage,
                  date_preached: new Date().toISOString(),
                  themes: transcript.themes,
                })
                .returning("id");

              console.log(
                `Inserted sermon: ${transcript.topic} (${sermon.id})`
              );

              // Process chunks sequentially to avoid API rate limits
              for (let index = 0; index < chunks.length; index++) {
                const chunk = chunks[index];
                const embedding = await generateEmbedding(chunk);

                await trx("sermon_chunks").insert({
                  sermon_id: sermon.id,
                  chunk_id: index + 1,
                  content: chunk,
                  embedding: db.raw(`'[${embedding.join(",")}]'::vector`),
                });
              }

              console.log(
                `Processed ${path.basename(file)} (${chunks.length} chunks)`
              );
            } catch (error) {
              console.error(`Error processing file ${file}:`, error);
              // Continue with next file even if one fails
            }
          })
        );
      }
    });

    console.log("All sermons processed successfully");
  } catch (error) {
    console.error("Error in chunkTranscripts:", error);
    throw error;
  } finally {
    // Clean up resources if needed
    if (extractor) {
      await extractor.dispose?.();
    }
  }
};
chunkEmbedAndInsert();
// export default chunkEmbedAndInsert;
