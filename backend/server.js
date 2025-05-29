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

if (!MODEL_ID || !API_KEY) {
  console.error("Missing ROBOFLOW_MODEL_ID or ROBOFLOW_API_KEY in environment variables");
  process.exit(1);
}

const API_URL = `https://detect.roboflow.com/${MODEL_ID}?api_key=${API_KEY}`;

app.get("/", (req, res) => {
  res.send("Roboflow detection backend is running");
});

app.post("/detect", async (req, res) => {
  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Missing imageBase64 in request" });
  }

  try {
    // Roboflow expects the image as form data with the base64 string
    const response = await axios.post(
      API_URL, 
      imageBase64, // Send the base64 string directly as the body
      {
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded" 
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Roboflow error:", error.response?.data || error.message);
    
    // More detailed error response
    const errorDetails = {
      error: "Roboflow API failed",
      message: error.response?.data?.message || error.message,
      status: error.response?.status || 500,
      details: error.response?.data || null
    };
    
    res
      .status(error.response?.status || 500)
      .json(errorDetails);
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using Roboflow model: ${MODEL_ID}`);
});