import "dotenv/config";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROK_API_KEY,
});

export default groq;
