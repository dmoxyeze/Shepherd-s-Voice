import * as fs from "fs";
import * as path from "path";

interface CleaningConfig {
  irrelevantPatterns: RegExp[];
  corrections: Record<string, string>;
}

const config: CleaningConfig = {
  irrelevantPatterns: [
    /Are you here with me\??/gi,
    /Glory to God\.?/gi,
    /Hallelujah\.?/gi,
    /Let['’]s (pray|stand|sing)/gi,
    /(announcements?|welcome|greeting)/gi,
  ],
  corrections: {
    Succese: "Success",
    Inusiae: "Inusa",
  },
};

export const cleanTranscript = (text: string): string => {
  let cleaned = text;

  // Remove irrelevant sections
  for (const pattern of config.irrelevantPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Normalize punctuation
  cleaned = cleaned
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .replace(/([.!?])\s*/g, "$1 ") // Ensure single space after punctuation
    .replace(/([A-Z][a-z]+)\s+\1/gi, "$1") // Remove repeated words
    .trim();

  // Correct known errors
  for (const [wrong, right] of Object.entries(config.corrections)) {
    cleaned = cleaned.replace(new RegExp(wrong, "gi"), right);
  }

  return cleaned;
};

export const saveCleanedTranscript = (
  text: string,
  fileName: string,
  outputDir: string
): string => {
  const outputPath = path.join(outputDir, `${fileName}.txt`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, text);
  return outputPath;
};

export const sanitizeName = (filename: string): string => {
  return path
    .basename(filename, path.extname(filename))
    .replace(/[^\w-]/g, "_");
};
