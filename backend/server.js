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
const RECOMMENDATION_AI_URL = "http://127.0.0.1:8003";

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

      formData.append(
        "file",
        req.file.buffer,
        {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
        }
      );

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
// Recommendation Engine
// ===============================

app.post("/api/recommendation", async (req, res) => {

  try {

    const response = await axios.post(
      `${RECOMMENDATION_AI_URL}/recommend`,
      req.body
    );

    res.json(response.data);

  } catch (error) {

    console.error(
      "Recommendation AI service error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      message: "Failed to generate agricultural recommendation",
    });
  }
});


// ===============================
// Integrated AI Workflow
// ===============================

app.post(
  "/api/ai-analysis",
  upload.single("file"),
  async (req, res) => {

    try {

      // --------------------------------
      // Validate leaf image
      // --------------------------------

      if (!req.file) {

        return res.status(400).json({
          message: "Please upload a plant leaf image.",
        });

      }


      // --------------------------------
      // Prepare crop input
      // --------------------------------

      const cropInput = {

        N: Number(req.body.N),

        P: Number(req.body.P),

        K: Number(req.body.K),

        temperature:
          Number(req.body.temperature),

        humidity:
          Number(req.body.humidity),

        ph:
          Number(req.body.ph),

        rainfall:
          Number(req.body.rainfall),
      };


      // --------------------------------
      // Prepare yield input
      // --------------------------------

      const yieldInput = {

        year_start:
          Number(req.body.year_start),

        state_name:
          req.body.state_name,

        district_name:
          req.body.district_name,

        crop_name:
          req.body.crop_name,

        crop_type:
          req.body.crop_type,

        season:
          req.body.season,

        area:
          Number(req.body.area),

        previous_yield:
          Number(req.body.previous_yield),
      };


      // --------------------------------
      // Prepare disease request
      // --------------------------------

      const diseaseFormData =
        new FormData();

      diseaseFormData.append(
        "file",
        req.file.buffer,
        {
          filename:
            req.file.originalname,

          contentType:
            req.file.mimetype,
        }
      );


      // --------------------------------
      // Run three AI models
      // --------------------------------

      const [
        cropResponse,
        diseaseResponse,
        yieldResponse,
      ] = await Promise.all([

        // Crop AI
        axios.post(
          `${CROP_AI_URL}/predict`,
          cropInput
        ),

        // Disease AI
        axios.post(
          `${DISEASE_AI_URL}/predict`,
          diseaseFormData,
          {
            headers: {
              ...diseaseFormData.getHeaders(),
            },

            maxBodyLength: Infinity,
          }
        ),

        // Yield AI
        axios.post(
          `${YIELD_AI_URL}/predict`,
          yieldInput
        ),

      ]);


      // --------------------------------
      // Extract AI results
      // --------------------------------

      const cropResult =
        cropResponse.data;

      const diseaseResult =
        diseaseResponse.data;

      const yieldResult =
        yieldResponse.data;


      // --------------------------------
      // Prepare Recommendation AI input
      // --------------------------------

      const recommendationInput = {

        // AI crop recommendation
        recommended_crop:
          cropResult.recommended_crop,

        // AI crop confidence
        crop_confidence:
          cropResult.confidence,

        // User selected crop
        // Used for crop-disease consistency check
        selected_crop:
          req.body.crop_name,

        // Disease prediction
        predicted_disease:
          diseaseResult.predicted_disease,

        // Disease confidence
        disease_confidence:
          diseaseResult.confidence,

        // Yield prediction
        predicted_yield:
          yieldResult.predicted_yield,
      };


      // --------------------------------
      // Run Recommendation Engine
      // --------------------------------

      const recommendationResponse =
        await axios.post(
          `${RECOMMENDATION_AI_URL}/recommend`,
          recommendationInput
        );


      // --------------------------------
      // Final integrated response
      // --------------------------------

      res.json({

        crop:
          cropResult,

        disease:
          diseaseResult,

        yield:
          yieldResult,

        recommendation:
          recommendationResponse.data,

      });

    } catch (error) {

      console.error(
        "Integrated AI workflow error:",
        error.response?.data ||
        error.message
      );

      res.status(500).json({

        message:
          "Failed to complete integrated AI analysis",

      });

    }

  }
);


// ===============================
// Start Server
// ===============================

app.listen(PORT, () => {

  console.log(
    `Backend server running on http://localhost:${PORT}`
  );

});