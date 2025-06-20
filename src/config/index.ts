import path from "path";
import dotenv from "dotenv";
dotenv.config();

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const TRANSCRIPT_DIR = path.resolve(ROOT_DIR, "src", "transcripts");
const AUDIO_DIR = path.resolve(ROOT_DIR, "sermon_audios");
const CONCURRENCY_LIMIT = parseInt(process.env.CONCURRENCY || "1");
const MODEL_NAME = process.env.MODEL_NAME || "llama-3.3-70b-versatile";
const PORT = process.env.PORT || 5000;
const ENV = process.env.NODE_ENV || "development";
const API_VERSION_URL = process.env.API_VERSION_URL || "/api/v1";
const FRONT_END_URL =
  process.env.NODE_ENV === "production"
    ? "https://shepherds-voice.vercel.app"
    : "http://localhost:3000";

export {
  TRANSCRIPT_DIR,
  AUDIO_DIR,
  CONCURRENCY_LIMIT,
  MODEL_NAME,
  PORT,
  ENV,
  API_VERSION_URL,
  FRONT_END_URL,
};
