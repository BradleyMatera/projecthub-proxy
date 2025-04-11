const express = require("express");
const { Configuration, OpenAIApi } = require("openai");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

// Enable trust proxy to handle X-Forwarded-For header
app.set("trust proxy", 1);

// CORS: Restrict to your CodePen domain
app.use(cors({ origin: "https://codepen.io", methods: ["POST", "OPTIONS"] }));

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many requests, please try again later."
});
app.use(limiter);

app.use(express.json());

// OpenAI setup with environment variable
const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  try {
    console.log("Received message:", message);
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
      max_tokens: 50
    });
    console.log("OpenAI response:", response.data);
    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI error:", error.message, error.response ? error.response.data : "");
    res.status(500).json({ error: "Something went wrong", details: error.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Server running"));