const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const fetch = require("node-fetch");

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

// xAI Grok API setup
const XAI_API_KEY = process.env.XAI_API_KEY;

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  try {
    console.log("Received message:", message);
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${XAI_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a helpful assistant for Bradley's projects." },
          { role: "user", content: message }
        ],
        model: "grok", // Use "grok" instead of "grok-3-latest"
        stream: false,
        temperature: 0,
        max_tokens: 50
      })
    });
    const data = await response.json();
    console.log("xAI response:", data);
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      res.json({ reply: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: "Invalid response from xAI API", details: data });
    }
  } catch (error) {
    console.error("xAI error:", error.message, error.response ? error.response.data : "");
    res.status(500).json({ error: "Something went wrong", details: error.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Server running"));