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
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!MODEL_ID || !API_KEY) {
  console.error("Missing ROBOFLOW_MODEL_ID or ROBOFLOW_API_KEY in environment variables");
  process.exit(1);
}

const API_URL = `https://detect.roboflow.com/${MODEL_ID}?api_key=${API_KEY}`;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

app.get("/", (req, res) => {
  res.send("Roboflow detection backend is running");
});

app.post("/detect", async (req, res) => {
  const { imageBase64, context } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Missing imageBase64 in request" });
  }

  try {
    const roboflowResponse = await axios.post(
      API_URL,
      imageBase64,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const predictions = roboflowResponse.data.predictions;

    const messages = [
      {
        role: "system",
        content: "You are an agricultural expert helping Nigerian tomato farmers detect diseases from AI predictions and advise them on treatment using locally available products."
      },
      {
        role: "user",
        content: `Given this context: ${context || "No additional context provided."}

Prediction results:
${predictions.map(p => `- ${p.class} (${(p.confidence * 100).toFixed(1)}%)`).join("\n")}

1. What is the health status in percentage?
2. What should the farmer do immediately?
3. Suggest Nigerian products for treatment.`
      }
    ];

    const openaiResponse = await axios.post(
      OPENAI_URL,
      {
        model: "gpt-4o",
        messages,
        temperature: 0.7
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      predictions,
      advice: openaiResponse.data.choices[0].message.content
    });
  } catch (error) {
    console.error("Detection or advice error:", error.response?.data || error.message);

    const errorDetails = {
      error: "Detection or OpenAI API failed",
      message: error.response?.data?.message || error.message,
      status: error.response?.status || 500,
      details: error.response?.data || null
    };

    res.status(errorDetails.status).json(errorDetails);
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using Roboflow model: ${MODEL_ID}`);
});
