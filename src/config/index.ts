import path from "path";
import dotenv from "dotenv";
dotenv.config();

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const TRANSCRIPT_DIR = path.resolve(ROOT_DIR, "src", "transcripts");
const AUDIO_DIR = path.resolve(ROOT_DIR, "sermon_audios");
const CONCURRENCY_LIMIT = parseInt(process.env.CONCURRENCY || "1");
const MODEL_NAME = process.env.MODEL_NAME || "llama-3.3-70b-versatile";
export { TRANSCRIPT_DIR, AUDIO_DIR, CONCURRENCY_LIMIT, MODEL_NAME };
