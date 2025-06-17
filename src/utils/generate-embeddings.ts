import path from "path";
import fs from "fs/promises";
import { pipeline, env } from "@xenova/transformers";
import { glob } from "glob";
import { TRANSCRIPT_DIR } from "@/config";
import logger from "@/lib/logger";
import { TChunkedSermon } from "@/types";

const CHUNK_DIR = path.join(TRANSCRIPT_DIR, "chunked");
const EMBEDDING_DIR = path.join(TRANSCRIPT_DIR, "embeddings");
env.allowLocalModels = false;

let extractor: any;

export async function initializeEmbeddings() {
  try {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("Embedding pipeline ready");
  } catch (error) {
    console.error("Initialization failed:", error);
    throw error;
  }
}
export async function readJsonFilesFromDirectory(
  dir: string
): Promise<string[]> {
  const files = (await glob(path.join(dir, "*.json"), {})) as string[];
  return files;
}
export async function processFile(filePath: string): Promise<void> {
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const {
      sermonId,
      chunkId,
      content,
      topic,
      themes,
      speaker,
      date_preached,
    }: TChunkedSermon = JSON.parse(fileContent);

    // Generate embeddings
    const output = await extractor(content, {
      pooling: "mean",
      normalize: true,
    });
    const embeddings = Array.from(output.data);

    // Save results
    const outputPath = path.join(EMBEDDING_DIR, `${sermonId}_${chunkId}.json`);
    await fs.writeFile(
      outputPath,
      JSON.stringify(
        {
          sermonId,
          chunkId,
          topic,
          themes,
          speaker,
          date_preached,
          content,
          embeddings,
        },
        null,
        2
      )
    );

    console.log(`Processed ${filePath} → ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

export async function generateEmbeddings(): Promise<void> {
  if (!extractor) throw new Error("Call initializeEmbeddings() first");

  try {
    console.log("Reading sermon chunks...");
    const files = await readJsonFilesFromDirectory(CHUNK_DIR);
    console.log(`Generating embeddings for ${files.length} chunks...`);
    for (const file of files) {
      logger.info(`Processing file: ${file}`);
      await processFile(file);
    }
  } catch (error) {
    console.error("Embedding generation failed:", error);
    throw error;
  }
}

(async () => {
  await initializeEmbeddings();
  const embeddings = await generateEmbeddings();
  console.log(embeddings);
  process.exit(0);
})();
