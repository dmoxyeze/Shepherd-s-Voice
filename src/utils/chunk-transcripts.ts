import path from "path";
import fs from "fs";
import { glob } from "glob";
import { TRANSCRIPT_DIR } from "@/config";
import { chunkTranscript, saveChunks } from "@/utils/formatting";
import { TTranscript } from "@/types";
import { sanitizeName } from "./cleaning";

const inputDir = path.join(TRANSCRIPT_DIR, "sanitized");
const outputDir = path.join(TRANSCRIPT_DIR, "chunked");

const chunkTranscripts = async () => {
  const files = (await glob(path.join(inputDir, "*.json"), {})) as string[];
  if (files.length === 0) {
    console.log("No .json files found in input directory");
    return;
  }

  console.log(`Found ${files.length} sermon files to process`);
  try {
    const processingFilesPromises = files.map(async (file) => {
      const transcript: TTranscript = JSON.parse(
        fs.readFileSync(file, "utf-8")
      );
      const chunks = chunkTranscript(transcript.normalizedMessage);
      saveChunks(chunks, sanitizeName(transcript.topic), outputDir);
    });
    await Promise.all(processingFilesPromises);
    console.log("All sermons processed");
  } catch (error: any) {
    console.error("Error in main processing:", error);
  }
};
chunkTranscripts();
// export default chunkTranscripts;
