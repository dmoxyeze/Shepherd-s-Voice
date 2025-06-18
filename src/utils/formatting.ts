import { TChunkedSermon, TSermonMetadata } from "@/types";
import * as fs from "fs";
import * as path from "path";

export const formatForLLM = (
  text: string,
  fileName: string
): TSermonMetadata => {
  const metadata: TSermonMetadata = {
    sermonId: fileName,
    title: "Untitled Sermon",
    date: new Date().toISOString().split("T")[0],
    content: text,
  };

  const outputDir = path.join("transcripts", "llm-ready");
  const outputPath = path.join(outputDir, `${fileName}.json`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  return metadata;
};

export const chunkTranscript = (
  text: string,
  maxLength: number = 500,
  hardMax: boolean = false
): string[] => {
  if (!text.trim()) return [];

  const sentences = text.split(/(?<=[.!?])\s+|(?<=\n\n)/).filter(Boolean);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
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
const countWords = (str: string): number => {
  return str.trim() ? str.split(/\s+/).length : 0;
};

export const saveChunks = (
  chunks: string[],
  fileName: string,
  outputDir: string,
  metadata: {
    topic?: string;
    themes?: string[];
    speaker?: string;
    date_preached?: string;
  } = {}
): void => {
  const { topic, themes, speaker, date_preached } = metadata;
  chunks.forEach((chunk, i) => {
    const outputPath = path.join(outputDir, `${fileName}_chunk_${i}.json`);
    const chunkData: TChunkedSermon = {
      sermonId: fileName,
      chunkId: i,
      topic,
      themes,
      speaker,
      date_preached,
      content: chunk,
    };
    fs.writeFileSync(outputPath, JSON.stringify(chunkData, null, 2));
  });
};
