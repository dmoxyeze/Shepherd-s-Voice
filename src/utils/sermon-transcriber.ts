import fs from "fs";
import { exec } from "child_process";
import path from "path";
import util from "util";
import withRetry from "@/utils/retry";
import logger from "@/lib/logger";
import { AUDIO_DIR, CONCURRENCY_LIMIT, TRANSCRIPT_DIR } from "@/config";
import { sanitizeName, saveCleanedTranscript, splitAudio } from "@/utils";
import pLimit from "p-limit";

const execPromise = util.promisify(exec);

if (!fs.existsSync(AUDIO_DIR)) {
  logger.error(`Audio directory does not exist: ${AUDIO_DIR}`);
  process.exit(1);
}
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

async function transcribeAudio(
  filePath: string,
  model = "turbo"
): Promise<string> {
  const cleanName = sanitizeName(filePath);
  const outputPath = path.join(TRANSCRIPT_DIR, `${cleanName}.txt`);
  const whisperCmd = process.env.WHISPER_CMD || "whisper";

  logger.info(`Transcribing: ${path.basename(filePath)}`);
  const command = `${whisperCmd} "${filePath}" --model ${model} --language en --fp16 False --output_format all --output_dir "${TRANSCRIPT_DIR}"`;

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

async function preprocessAudio(filePath: string): Promise<string> {
  const cleanName = sanitizeName(filePath);
  const preprocessedPath = path.join(
    TRANSCRIPT_DIR,
    `${cleanName}_preprocessed.wav`
  );
  const preprocessCmd = `ffmpeg -i "${filePath}" -ar 16000 -ac 1 -c:a pcm_s16le "${preprocessedPath}"`;
  await execPromise(preprocessCmd);
  logger.info(`Preprocessed audio: ${preprocessedPath}`);
  return preprocessedPath;
}

async function processFile(filePath: string): Promise<void> {
  try {
    // Preprocess audio
    const preprocessedPath = await preprocessAudio(filePath);
    // Split and transcribe
    const segments = await splitAudio(preprocessedPath);
    logger.info(`Split audio into ${segments.length} segments`);

    const limit = pLimit(CONCURRENCY_LIMIT);
    // Transcribe segments in parallel
    const transcriptPaths = await Promise.all(
      segments.map((segment) => limit(() => transcribeAudio(segment, "turbo")))
    );
    // Transcribe
    // const transcriptPath = await transcribeAudio(filePath);
    const cleanName = sanitizeName(filePath);
    const mergedTranscriptPath = path.join(TRANSCRIPT_DIR, `${cleanName}.txt`);
    let mergedTranscript = "";
    for (const transcriptPath of transcriptPaths) {
      const transcript = fs.readFileSync(transcriptPath, "utf-8");
      mergedTranscript += transcript + "\n";
      // Clean up segment transcript
      fs.unlinkSync(transcriptPath);
    }
    fs.writeFileSync(mergedTranscriptPath, mergedTranscript);
    // Clean up segment dir
    fs.rmSync(path.dirname(segments[0]), { recursive: true });

    // Proceed with cleaning and formatting
    const cleanedText = mergedTranscript; //TODO: Replace with cleanTranscript(mergedTranscript) if needed
    const cleanedPath = saveCleanedTranscript(
      cleanedText,
      cleanName,
      CLEANED_DIR
    );
    logger.info(`Cleaned transcript saved: ${cleanedPath}`);

    // Format and chunk for LLM
    // const metadata = formatForLLM(cleanedText, cleanName);
    // const chunks = chunkTranscript(cleanedText);
    // saveChunks(chunks, cleanName, LLM_READY_DIR);
    // logger.info(`Cleaned transcript saved: ${cleanedPath}`);
    // logger.info(`LLM-ready files saved for: ${cleanName}`, {
    //   metadata,
    //   chunkCount: chunks.length,
    // });
    fs.unlinkSync(preprocessedPath); // Clean up preprocessed file
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

export default transcribeAll;
