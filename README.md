# 🐑 Shepherd’s Voice

_The sermon didn’t end on Sunday._

**Shepherd’s Voice** is an AI-powered devotional content generator that transforms sermon transcripts into daily, bite-sized, inspirational messages—crafted in a relatable, pastoral tone. It brings the heart of your pastor’s message into your everyday moments.

## ✨ Features

- 📖 Generates 3-part daily devotionals from sermon transcripts
- 📌 Automatically identifies key topics and scriptures
- 🙏 Includes reflective questions, personal prayers, and quotes
- 🧠 Built on custom LLM prompts tuned for pastoral insight
- 📝 Outputs beautifully formatted Markdown-ready content
- 💡 Inspired by real sermons and tailored for real life

## 📚 Devotional Structure

Each devotional includes:

1. **Topic** – The spiritual theme of the message
2. **Scripture** – Implied or explicitly referenced verses
3. **Message** – A warm, 1–2 paragraph reflection
4. **Reflect** – A simple question to internalize the message
5. **Prayer** – A one-sentence personal response to God

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set your Groq API key in a `.env` file
GROQ_API_KEY=your-api-key-here

# Run the generator
npm run dev

```

## Note

Included in this project is a tool to help you transcribe your sermons. It uses open ai's whisper to transcribe your audio files. You can use it by running the following command:

```bash
npm run transcribe
```

This will transcribe all the audio files in the `sermon_audios` directory and save them in the `transcripts` directory.

## Contributing

Contributions are welcome! If you find a bug or have a suggestion, please open an issue or submit a pull request. However, please note that this project is still in its early stages and may not be as polished as you'd like it to be.

## License

This project is licensed under the MIT License.


## Acknowledgements

- Thanks to [Open AI](https://openai.com/) for providing the Whisper API.
- Thanks to [Groq](https://groq.dev/) for providing the API for the groq library. 