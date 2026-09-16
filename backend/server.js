const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");

const app = express();

const PORT = 5000;

const CROP_AI_URL = "http://127.0.0.1:8000";
const DISEASE_AI_URL = "http://127.0.0.1:8001";
const YIELD_AI_URL = "http://127.0.0.1:8002";

const upload = multer({
  storage: multer.memoryStorage(),
});

app.use(cors());
app.use(express.json());


// ===============================
// Health Check
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "Smart Agriculture Backend is running",
  });
});


// ===============================
// Crop Recommendation
// ===============================

app.post("/api/crop-recommendation", async (req, res) => {
  try {
    const response = await axios.post(
      `${CROP_AI_URL}/predict`,
      req.body
    );

    res.json(response.data);
  } catch (error) {
    console.error(
      "Crop AI service error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      message: "Failed to get crop recommendation",
    });
  }
});


// ===============================
// Plant Disease Detection
// ===============================

app.post(
  "/api/plant-disease",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Please upload a plant leaf image.",
        });
      }

      const formData = new FormData();

      formData.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const response = await axios.post(
        `${DISEASE_AI_URL}/predict`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          maxBodyLength: Infinity,
        }
      );

      res.json(response.data);
    } catch (error) {
      console.error(
        "Plant Disease AI service error:",
        error.response?.data || error.message
      );

      res.status(500).json({
        message: "Failed to detect plant disease",
      });
    }
  }
);


// ===============================
// Yield Prediction
// ===============================

app.post("/api/yield-prediction", async (req, res) => {
  try {
    const response = await axios.post(
      `${YIELD_AI_URL}/predict`,
      req.body
    );

    res.json(response.data);
  } catch (error) {
    console.error(
      "Yield AI service error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      message: "Failed to predict crop yield",
    });
  }
});


// ===============================
// Start Server
// ===============================

app.listen(PORT, () => {
  console.log(
    `Backend server running on http://localhost:${PORT}`
  );
});