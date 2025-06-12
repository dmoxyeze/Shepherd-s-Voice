import groq from "@/lib/groq";
/**
 * Generates a 3-part daily devotional based on a sermon transcript.
 *
 * @param {string} sermon - The sermon transcript to analyze.
 * @param {string} model - The model to use for generating the devotional.
 * @returns {Promise<string>} - A formatted 3-part devotional insight.
 */
const generateSermonInsight = async (
  sermon: string,
  model:
    | "meta-llama/llama-4-scout-17b-16e-instruct"
    | "llama-3.3-70b-versatile" = "meta-llama/llama-4-scout-17b-16e-instruct"
): Promise<string> => {
  const prompt = `
    You are a pastor known for your warmth, wisdom, and ability to make scripture come alive in everyday life. Read the sermon transcript below and create a **3-part daily devotional** that is **inspirational**, **scripture-based**, and **pastorally engaging**—as though speaking directly to your congregation in a personal, heart-to-heart moment.
    
    ### 📖 Instructions:
    - Each part should be about **1–2 short paragraphs**.
    - Include **relevant scripture references** (explicit or implied).
    - Focus on **encouragement**, **faith application**, and **spiritual insight**.
    - Keep the tone **relational, reflective, and full of grace**—as if from a trusted shepherd.
    
    ### ✨ Output Format (Markdown):
    
    ## Shepherd’s Voice _(The sermon didn’t end on Sunday)_
    
    ### 📌 Word for the Day
    
    **Topic:** _[Insert theme in a few words — e.g., “Obedience in Uncertainty”]_
    
    **Scripture:** _[e.g., James 1:5 or “See Romans 12”]_
    
    **Message:**  
    [Write a brief devotional insight drawn from the sermon—relatable, reflective, grounded in scripture.]
    
    ### 🔎 Reflect
    
    _A thought-provoking question or short challenge (1–2 sentences) to help the reader internalize today’s message._
    
    ### 🙏 Prayer
    
    _A one-sentence prayer in the first person._
    
    ---
    
    **Sermon Transcript:**
    \`\`\`
    ${sermon}
    \`\`\`
    `;

  try {
    const response = await groq.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
    });

    const output = response.choices?.[0]?.message?.content?.trim();

    if (!output) {
      console.warn("Empty response from model");
      return "⚠️ No devotional insight was generated.";
    }

    return output;
  } catch (error) {
    console.error("Error generating devotional insight:", error);
    return "🚨 An error occurred while generating the devotional insight.";
  }
};

export { generateSermonInsight };
