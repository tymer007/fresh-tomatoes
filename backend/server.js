import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const MODEL_ID = process.env.ROBOFLOW_MODEL_ID;
const API_KEY = process.env.ROBOFLOW_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!MODEL_ID || !API_KEY || !GEMINI_API_KEY) {
  console.error("Missing ROBOFLOW_MODEL_ID, ROBOFLOW_API_KEY, or GEMINI_API_KEY in environment variables");
  process.exit(1);
}

const API_URL = `https://detect.roboflow.com/${MODEL_ID}?api_key=${API_KEY}`;
// Updated to use gemini-2.0-flash instead of gemini-pro
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

app.get("/", (req, res) => {
  res.send("Roboflow detection + Gemini AI backend is running");
});

app.post("/detect", async (req, res) => {
  const { imageBase64, context } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Missing imageBase64 in request" });
  }

  try {
    // Step 1: Run Roboflow detection
    const roboflowResponse = await axios.post(
      API_URL,
      imageBase64,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );

    const predictions = roboflowResponse.data.predictions;

    // Calculate health status based on predictions
    let healthStatus = 100;
    if (predictions && predictions.length > 0) {
      // Reduce health based on number and confidence of disease detections
      const diseaseConfidence = predictions.reduce((sum, pred) => sum + pred.confidence, 0) / predictions.length;
      healthStatus = Math.max(0, 100 - (predictions.length * 20 + diseaseConfidence * 30));
    }

    // Step 2: Prepare prompt for Gemini
    const prompt = `
You are an agricultural expert helping Nigerian tomato farmers detect diseases from AI predictions and provide practical treatment advice using locally available products.

Context from farmer: ${context || "No additional context provided."}

Prediction results:
${predictions.length > 0 
  ? predictions.map(p => `- ${p.class} (${(p.confidence * 100).toFixed(1)}% confidence)`).join("\n")
  : "No diseases detected in the image."}

Please provide:
1. Immediate actions the farmer should take
2. Treatment recommendations using products available in Nigerian markets
3. Prevention tips for future crops

Keep the advice practical and specific to Nigerian farming conditions.`;

    const geminiResponse = await axios.post(
      GEMINI_URL,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const chatgptAdvice = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || "No advice returned.";

    res.json({
      predictions,
      healthStatus,
      chatgptAdvice
    });

  } catch (error) {
    console.error("Detection or Gemini error:", error.response?.data || error.message);

    res.status(error.response?.status || 500).json({
      error: "Detection or Gemini API failed",
      message: error.response?.data?.message || error.message,
      status: error.response?.status || 500,
      details: error.response?.data || null
    });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using Roboflow model: ${MODEL_ID}`);
});