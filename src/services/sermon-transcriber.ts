import fs from "fs";
import { exec } from "child_process";
import path from "path";
import util from "util";
import { createLogger, transports, format } from "winston";
import { cleanTranscript, saveCleanedTranscript } from "@/utils/cleaning";
import { formatForLLM, chunkTranscript, saveChunks } from "@/utils/formatting";
import { exit } from "process";
import withRetry from "@/utils/retry";

const execPromise = util.promisify(exec);

// Logger setup
const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.File({ filename: "logs/pipeline.log" })],
});

const ROOT_DIR = path.resolve(__dirname, "../..");
const AUDIO_DIR = path.resolve(ROOT_DIR, "sermon_audios");
if (!fs.existsSync(AUDIO_DIR)) {
  logger.error(`Audio directory does not exist: ${AUDIO_DIR}`);
  process.exit(1);
}
const TRANSCRIPT_DIR = path.resolve(ROOT_DIR, "src", "transcripts");
const CLEANED_DIR = path.join(TRANSCRIPT_DIR, "cleaned");
const LLM_READY_DIR = path.join(TRANSCRIPT_DIR, "llm-ready");
const SUPPORTED_FORMATS = [".mp3", ".wav", ".m4a", ".aac"];

if (!fs.existsSync(TRANSCRIPT_DIR)) {
  fs.mkdirSync(TRANSCRIPT_DIR, { recursive: true });
}
if (!fs.existsSync(CLEANED_DIR)) {
  fs.mkdirSync(CLEANED_DIR, { recursive: true });
}
if (!fs.existsSync(LLM_READY_DIR)) {
  fs.mkdirSync(LLM_READY_DIR, { recursive: true });
}

async function getAudioFiles(dir: string): Promise<string[]> {
  const files = fs.readdirSync(dir);
  return files
    .filter((f) => SUPPORTED_FORMATS.includes(path.extname(f).toLowerCase()))
    .map((f) => path.join(dir, f));
}

function sanitizeName(filename: string): string {
  return path
    .basename(filename, path.extname(filename))
    .replace(/[^\w\d-_]/g, "_");
}

async function transcribeAudio(
  filePath: string,
  model = "turbo"
): Promise<string> {
  const cleanName = sanitizeName(filePath);
  const outputPath = path.join(TRANSCRIPT_DIR, `${cleanName}.txt`);
  const whisperCmd = process.env.WHISPER_CMD || "whisper";

  logger.info(`Transcribing: ${path.basename(filePath)}`);
  const command = `${whisperCmd} "${filePath}" --model ${model} --language en --fp16 False --output_format txt --output_dir "${TRANSCRIPT_DIR}"`;

  try {
    const { stdout } = await withRetry(() => execPromise(command));
    logger.info(`Transcription complete for: ${path.basename(filePath)}`, {
      stdout,
    });
    return outputPath;
  } catch (error) {
    logger.error(`Failed to transcribe ${filePath}`, {
      error: (error as Error).message,
    });
    throw error;
  }
}

async function processFile(filePath: string): Promise<void> {
  try {
    // Transcribe
    const transcriptPath = await transcribeAudio(filePath);
    const cleanName = sanitizeName(filePath);

    // Read raw transcript
    const rawTranscript = fs.readFileSync(transcriptPath, "utf-8");

    // Clean transcript
    // const cleanedText = cleanTranscript(rawTranscript);
    const cleanedText = rawTranscript;
    const cleanedPath = saveCleanedTranscript(
      cleanedText,
      cleanName,
      CLEANED_DIR
    );
    logger.info(`Cleaned transcript saved: ${cleanedPath}`);

    // Format and chunk for LLM
    const metadata = formatForLLM(cleanedText, cleanName);
    const chunks = chunkTranscript(cleanedText);
    saveChunks(chunks, cleanName, LLM_READY_DIR);
    logger.info(`LLM-ready files saved for: ${cleanName}`, {
      metadata,
      chunkCount: chunks.length,
    });
  } catch (error) {
    logger.error(`Error processing ${filePath}`, {
      error: (error as Error).message,
    });
  }
}

async function transcribeAll(): Promise<void> {
  const audioFiles = await getAudioFiles(AUDIO_DIR);

  if (audioFiles.length === 0) {
    logger.warn("No audio files found to transcribe.");
    return;
  }

  //   await Promise.all(audioFiles.map((file) => processFile(file)));
  for (const file of audioFiles) {
    await processFile(file);
  }

  logger.info("All audio files processed.");
}

transcribeAll().catch((error) => {
  logger.error("Pipeline failed", { error: error.message });
  console.error(error);
});
