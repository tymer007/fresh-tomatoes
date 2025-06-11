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
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

app.get("/", (req, res) => {
  res.send("Roboflow detection + Gemini Model backend is running");
});

app.post("/detect", async (req, res) => {
  const { imageBase64, context } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Missing imageBase64 in request" });
  }

  try {
    // Step 1: Roboflow Prediction
    const roboflowResponse = await axios.post(
      API_URL,
      imageBase64,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );

    const predictions = roboflowResponse.data.predictions || [];
    let adviceHtml = "";
    let healthStatus = 100;

    const isSingleHealthy = (
      predictions.length === 1 &&
      predictions[0].class === "Healthy" &&
      predictions[0].confidence >= 0.85
    );

    if (isSingleHealthy) {
      // Step 2: Adjust based on context
      const confidence = predictions[0].confidence;
      const negativeIndicators = [
        "yellow", "wilting", "spotted", "holes", "dry", "pale", "rot", "mold", "fungus", "insects"
      ];

      const contextLower = (context || "").toLowerCase();
      const isNegativeContext = negativeIndicators.some(word => contextLower.includes(word));

      if (isNegativeContext) {
        healthStatus = Math.max(0, confidence * 100 - 5); // Slight deduction
        adviceHtml = `
          <h3>Diagnosis</h3>
          <p><strong>Your plant appears healthy, but your notes suggest early stress signs.</strong></p>

          <h3><strong>What You Should Do</strong></h3>
          <p>Closely monitor the symptoms you noticed. Ensure proper watering, check for pests under the leaves, and avoid over-fertilizing.</p>

          <h3><strong>How to Prevent This Next Time</strong></h3>
          <p>Maintain a regular care schedule. Use mulch, water early in the day, and rotate your crops if needed. Early signs can be fixed quickly.</p>
        `;
      } else {
        healthStatus = confidence * 100;
        adviceHtml = `
          <h3>Diagnosis</h3>
          <p><strong>Your tomato plant looks healthy and strong!</strong></p>

          <h3><strong>What You Should Do</strong></h3>
          <p>No action is needed right now. Keep monitoring your garden regularly. Continue watering and fertilizing as usual.</p>

          <h3><strong>What's next?</strong></h3>
          <p>Maintain your current healthy practices, avoid overcrowding your plants, and ensure proper sunlight and airflow.</p>
        `;
      }

    } else if (predictions.length > 0) {
      // Step 3: Disease present — use confidence and severity to reduce health
      const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
      const severityFactor = predictions.length * 20 + avgConfidence * 30;
      healthStatus = Math.max(0, 100 - severityFactor);

      // Step 4: Build Gemini prompt
      const diseaseListHTML = predictions.map(p =>
        `<li><strong>${p.class}</strong> – ${(p.confidence * 100).toFixed(1)}% confidence</li>`
      ).join("");

      const prompt = `
You are a tomato farming expert assisting Nigerian farmers based on model detections. Talk directly to the farmer using "your farm", "your plant", etc. Do not mention AI or model uncertainty.

Use clear, practical advice and format it in clean HTML using <h3>, <p>, <ul>, <strong>, etc.

Always include these sections:
<h3><strong>Diagnosis</strong></h3>
<h3><strong>What You Should Do</strong></h3>
<h3><strong>How to Prevent This Next Time</strong></h3>

Farmer's Notes: ${context || "No additional context provided."}

Model Detection:
<ul>${diseaseListHTML}</ul>
      `;

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

      let rawText = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || "<p>No advice returned.</p>";
      adviceHtml = rawText.replace(/```html|```/g, "").trim();
    } else {
      // Step 5: No predictions
      healthStatus = 100;
      adviceHtml = `
        <h3><strong>Diagnosis</strong></h3>
        <p><strong>Your plant looks fine! No signs of disease were detected.</strong></p>

        <h3><strong>What You Should Do</strong></h3>
        <p>Keep doing what you're doing. Maintain a clean and balanced farming routine.</p>

        <h3><strong>How to Prevent This Next Time</strong></h3>
        <p>Continue rotating crops, providing good sunlight and airflow, and watching closely for any changes in leaves.</p>
      `;
    }

    res.json({
      predictions,
      healthStatus,
      adviceHtml
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
