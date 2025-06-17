import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { glob } from "glob";
import pLimit from "p-limit";
import groq from "@/lib/groq";
import { CONCURRENCY_LIMIT, MODEL_NAME, TRANSCRIPT_DIR } from "@/config";
const dir = path.join(TRANSCRIPT_DIR, "sanitized");
const config = {
  inputDir: TRANSCRIPT_DIR, // Directory containing .txt transcripts
  outputDir: dir, // Directory to save processed JSON files
  rateLimit: CONCURRENCY_LIMIT, // Max concurrent requests
  delayBetweenRequests: 3000, // ms between requests to avoid rate limiting
  maxRetries: 3, // Max retries for failed requests
  model: MODEL_NAME,
};

const ResponseSchema = z.object({
  originalText: z.string(),
  normalizedMessage: z.string(),
  scriptures: z.array(z.string()),
  themes: z.array(z.string()),
  topic: z.string(),
});
// Type definitions
type SermonProcessingResult = z.infer<typeof ResponseSchema> & {
  originalFile: string; // Name of the original file processed
};

// Process a single sermon file
async function processSermonFile(
  filePath: string
): Promise<SermonProcessingResult> {
  try {
    console.log(`Processing file: ${filePath}`);

    // Read the sermon text
    const sermonText = await fs.readFile(filePath, "utf-8");

    // Prepare the prompt for Groq API
    const prompt = `
    You are a seasoned faith-based pastor with a mandate to teach the Word of Faith with a pragmatic, transformative approach—raising men who will transform nations.

    You have just finished delivering a sermon. Your assistant transcribed it. Now, your task is to process it for publishing, messaging, and future study reference.

    Perform the following tasks with clarity and precision:
    
    1. Normalize the transcript: Rewrite it into a 10-paragraph version that preserves the original tone, message, and spiritual depth.
    2. Extract all scripture references, both explicit and implied. Format each as 'Book Chapter:Verse', e.g., 'John 3:16', 'Romans 8:28-30'. Avoid generic mentions like “the Bible says” unless you can infer the actual verse.
    3. Identify key themes: List the main ideas the sermon addresses (e.g., "faith in crisis", "obedience", "covenant mindset").
    4. Generate a topic: Write a one-line topic that fully captures the essence of the sermon.
    
    Respond with valid JSON objects that match this structure and nothing else:

    {
      "normalizedMessage": "string",
      "scriptures": ["string"],
      "themes": ["string"],
      "topic": "string"
    }
  
    **Sermon Transcript:**
    \`\`\`
    ${sermonText}
    \`\`\`
    `;

    // Call Groq API with retries
    let retries = 0;
    while (retries < config.maxRetries) {
      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          model: config.model,
          response_format: { type: "json_object" },
          temperature: 0.9,
        });

        const responseContent = chatCompletion.choices[0]?.message?.content;

        if (!responseContent) {
          throw new Error("Invalid response format from API");
        }

        // Parse the JSON response
        const result = JSON.parse(responseContent) as Omit<
          SermonProcessingResult,
          "originalFile"
        >;

        return {
          originalText: sermonText,
          originalFile: path.basename(filePath),
          normalizedMessage: result.normalizedMessage,
          scriptures: result.scriptures,
          themes: result.themes,
          topic: result.topic,
        };
      } catch (error) {
        retries++;
        if (retries >= config.maxRetries) {
          throw error;
        }

        const delay = 2000 * retries; // Exponential backoff
        console.log(`Retry ${retries} after ${delay}ms for ${filePath}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error("Max retries reached");
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    throw error;
  }
}

// Main processing function
async function processAllSermons() {
  try {
    // Ensure output directory exists
    await fs.mkdir(config.outputDir, { recursive: true });

    // Find all .txt files in input directory
    const files = (await glob(
      path.join(config.inputDir, "*.txt"),
      {}
    )) as string[];

    if (files.length === 0) {
      console.log("No .txt files found in input directory");
      return;
    }

    console.log(`Found ${files.length} sermon files to process`);

    // Process files with rate limiting
    const limit = pLimit(config.rateLimit);
    const processingPromises = files.map((file) =>
      limit(async () => {
        try {
          const result = await processSermonFile(file);

          // Save the result as JSON
          const outputFile = path.join(
            config.outputDir,
            `${path.basename(file, ".txt")}.json`
          );

          await fs.writeFile(outputFile, JSON.stringify(result, null, 2));
          console.log(`Successfully processed and saved: ${outputFile}`);

          // Delay between requests to avoid rate limiting
          await new Promise((resolve) =>
            setTimeout(resolve, config.delayBetweenRequests)
          );
        } catch (error) {
          console.error(`Failed to process file ${file}:`, error);
          return null;
        }
      })
    );

    await Promise.all(processingPromises);
    console.log("All sermons processed");
  } catch (error) {
    console.error("Error in main processing:", error);
    process.exit(1);
  }
}

export default processAllSermons;
