const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

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
// Yield Dataset
// ===============================

const YIELD_DATASET_PATH = path.join(
  __dirname,
  "..",
  "ai-service",
  "yield-prediction",
  "dataset",
  "Crop_Wise_Area_Production_Yield",
  "crop-wise-area-production-yield.csv"
);

let yieldRecords = [];

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}


// ===============================
// Load Yield Dataset
// ===============================

try {
  if (fs.existsSync(YIELD_DATASET_PATH)) {
    const csvText = fs.readFileSync(
      YIELD_DATASET_PATH,
      "utf8"
    );

    const lines = csvText
      .split(/\r?\n/)
      .filter((line) => line.trim() !== "");

    const headers = lines[0].split(",");

    yieldRecords = lines
      .slice(1)
      .map((line) => {
        const values = line.split(",");

        const record = {};

        headers.forEach((header, index) => {
          record[header.trim()] =
            values[index]?.trim() || "";
        });

        return record;
      });

    console.log(
      `✅ Yield dataset loaded: ${yieldRecords.length} records`
    );
  } else {
    console.warn(
      "⚠️ Yield dataset not found:",
      YIELD_DATASET_PATH
    );
  }
} catch (error) {
  console.error(
    "❌ Failed to load yield dataset:",
    error.message
  );
}


// ===============================
// Health Check
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "Smart Agriculture Backend is running",
  });
});


// ===============================
// Location Geocoding
// ===============================

app.get("/api/geocode", async (req, res) => {
  try {
    const { state, district } = req.query;

    if (!state || !district) {
      return res.status(400).json({
        message: "State and district are required.",
      });
    }

    const locationQuery =
      `${district}, ${state}, India`;

    const geocodeUrl =
      `https://geocoding-api.open-meteo.com/v1/search` +
      `?name=${encodeURIComponent(locationQuery)}` +
      `&count=5` +
      `&language=en` +
      `&format=json`;

    const response =
      await fetch(geocodeUrl);

    if (!response.ok) {
      throw new Error(
        `Geocoding API returned ${response.status}`
      );
    }

    const data =
      await response.json();

    if (
      !data.results ||
      data.results.length === 0
    ) {
      return res.status(404).json({
        message: "Location not found.",
      });
    }

    const location =
      data.results[0];

    res.json({
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name,
      country: location.country,
      admin1: location.admin1 || null,
    });

  } catch (error) {
    console.error(
      "Geocoding API error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to find location.",
    });
  }
});


// ===============================
// Weather Information
// ===============================

app.get("/api/weather", async (req, res) => {
  try {
    const {
      latitude,
      longitude,
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message:
          "Latitude and longitude are required.",
      });
    }

    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${encodeURIComponent(latitude)}` +
      `&longitude=${encodeURIComponent(longitude)}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation` +
      `&hourly=precipitation` +
      `&past_days=7` +
      `&forecast_days=1` +
      `&timezone=auto`;

    const response =
      await fetch(weatherUrl);

    if (!response.ok) {
      throw new Error(
        `Weather API returned ${response.status}`
      );
    }

    const weather =
      await response.json();

    const currentTemperature =
      weather.current?.temperature_2m ??
      null;

    const currentHumidity =
      weather.current
        ?.relative_humidity_2m ??
      null;

    const currentPrecipitation =
      weather.current?.precipitation ??
      null;

    const hourlyPrecipitation =
      weather.hourly?.precipitation || [];

    const recentPrecipitation =
      hourlyPrecipitation
        .filter(
          (value) =>
            typeof value === "number" &&
            Number.isFinite(value)
        )
        .reduce(
          (total, value) =>
            total + value,
          0
        );

    res.json({
      temperature:
        currentTemperature,

      humidity:
        currentHumidity,

      current_precipitation:
        currentPrecipitation,

      recent_precipitation:
        Number(
          recentPrecipitation.toFixed(2)
        ),

      temperature_unit:
        weather.current_units
          ?.temperature_2m ||
        "°C",

      humidity_unit:
        weather.current_units
          ?.relative_humidity_2m ||
        "%",

      precipitation_unit:
        weather.current_units
          ?.precipitation ||
        "mm",

      rainfall: null,
    });

  } catch (error) {
    console.error(
      "Weather API error:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to fetch weather information.",
    });
  }
});


// ===============================
// Previous Year Yield Lookup
// ===============================

app.get(
  "/api/previous-yield",
  (req, res) => {
    try {
      const {
        year_start,
        state_name,
        district_name,
        crop_name,
        season,
      } = req.query;

      if (
        !year_start ||
        !state_name ||
        !district_name ||
        !crop_name ||
        !season
      ) {
        return res.status(400).json({
          message:
            "year_start, state_name, district_name, crop_name and season are required.",
        });
      }

      const currentYear =
        Number(year_start);

      if (!Number.isInteger(currentYear)) {
        return res.status(400).json({
          message:
            "year_start must be a valid year.",
        });
      }

      const previousYear =
        currentYear - 1;

      const previousYearLabel =
        `${previousYear}-${currentYear}`;

      const matchingRecords =
        yieldRecords.filter((record) => {

          const recordYear =
            normalizeText(record.year);

          const recordState =
            normalizeText(
              record.state_name
            );

          const recordDistrict =
            normalizeText(
              record.district_name
            );

          const recordCrop =
            normalizeText(
              record.crop_name
            );

          const recordSeason =
            normalizeText(
              record.season
            );

          return (
            recordYear ===
              normalizeText(
                previousYearLabel
              ) &&
            recordState ===
              normalizeText(
                state_name
              ) &&
            recordDistrict ===
              normalizeText(
                district_name
              ) &&
            recordCrop ===
              normalizeText(
                crop_name
              ) &&
            recordSeason ===
              normalizeText(
                season
              )
          );
        });

      const validRecords =
        matchingRecords.filter(
          (record) => {

            const value =
              Number(record.yield);

            return (
              Number.isFinite(value) &&
              value >= 0
            );
          }
        );

      if (validRecords.length === 0) {
        return res.status(404).json({
          message:
            "Previous year yield was not found for the selected location, crop and season.",

          previous_year:
            previousYear,

          previous_year_label:
            previousYearLabel,

          previous_yield:
            null,
        });
      }

      const previousYield =
        Number(
          validRecords[0].yield
        );

      res.json({
        previous_year:
          previousYear,

        previous_year_label:
          previousYearLabel,

        previous_yield:
          previousYield,

        yield_unit:
          validRecords[0].yield_unit ||
          "Tonnes/Hectare",

        source:
          "Historical agricultural yield dataset",
      });

    } catch (error) {
      console.error(
        "Previous yield lookup error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to retrieve previous year yield.",
      });
    }
  }
);


// ===============================
// Crop Recommendation
// ===============================

app.post(
  "/api/crop-recommendation",
  async (req, res) => {
    try {
      const response =
        await axios.post(
          `${CROP_AI_URL}/predict`,
          req.body
        );

      res.json(response.data);

    } catch (error) {
      console.error(
        "Crop AI service error:",
        error.response?.data ||
        error.message
      );

      res.status(500).json({
        message:
          "Failed to get crop recommendation",
      });
    }
  }
);


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
          message:
            "Please upload a plant leaf image.",
        });
      }

      const formData =
        new FormData();

      formData.append(
        "file",
        req.file.buffer,
        {
          filename:
            req.file.originalname,

          contentType:
            req.file.mimetype,
        }
      );

      const response =
        await axios.post(
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
        error.response?.data ||
        error.message
      );

      res.status(500).json({
        message:
          "Failed to detect plant disease",
      });
    }
  }
);


// ===============================
// Yield Prediction
// ===============================

app.post(
  "/api/yield-prediction",
  async (req, res) => {
    try {
      const response =
        await axios.post(
          `${YIELD_AI_URL}/predict`,
          req.body
        );

      res.json(response.data);

    } catch (error) {
      console.error(
        "Yield AI service error:",
        error.response?.data ||
        error.message
      );

      res.status(500).json({
        message:
          "Failed to predict crop yield",
      });
    }
  }
);


// ===============================
// Recommendation Engine
// ===============================

app.post(
  "/api/recommendation",
  async (req, res) => {
    try {
      const response =
        await axios.post(
          `${RECOMMENDATION_AI_URL}/recommend`,
          req.body
        );

      res.json(response.data);

    } catch (error) {
      console.error(
        "Recommendation AI service error:",
        error.response?.data ||
        error.message
      );

      res.status(500).json({
        message:
          "Failed to generate agricultural recommendation",
      });
    }
  }
);


// ===============================
// Integrated AI Workflow
// ===============================

app.post(
  "/api/ai-analysis",
  upload.single("file"),
  async (req, res) => {

    try {

      if (!req.file) {
        return res.status(400).json({
          message:
            "Please upload a plant leaf image.",
        });
      }


      // --------------------------------
      // Prepare crop input
      // --------------------------------

      const cropInput = {

        N:
          Number(req.body.N),

        P:
          Number(req.body.P),

        K:
          Number(req.body.K),

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
      // Previous year yield
      // --------------------------------

      const currentYear =
        Number(req.body.year_start);

      const previousYear =
        currentYear - 1;

      const previousYearLabel =
        `${previousYear}-${currentYear}`;

      let previousYield =
        Number(
          req.body.previous_yield
        );

      let previousYieldSource =
        "user_input";


      // --------------------------------
      // Automatic historical lookup
      // --------------------------------

      const matchingRecords =
        yieldRecords.filter((record) => {

          const recordYear =
            normalizeText(record.year);

          const recordState =
            normalizeText(
              record.state_name
            );

          const recordDistrict =
            normalizeText(
              record.district_name
            );

          const recordCrop =
            normalizeText(
              record.crop_name
            );

          const recordSeason =
            normalizeText(
              record.season
            );

          const recordYield =
            Number(record.yield);

          return (
            recordYear ===
              normalizeText(
                previousYearLabel
              ) &&
            recordState ===
              normalizeText(
                req.body.state_name
              ) &&
            recordDistrict ===
              normalizeText(
                req.body.district_name
              ) &&
            recordCrop ===
              normalizeText(
                req.body.crop_name
              ) &&
            recordSeason ===
              normalizeText(
                req.body.season
              ) &&
            Number.isFinite(recordYield) &&
            recordYield >= 0
          );
        });


      if (
        matchingRecords.length > 0
      ) {

        previousYield =
          Number(
            matchingRecords[0].yield
          );

        previousYieldSource =
          "historical_dataset";
      }


      // --------------------------------
      // Validate previous yield
      // --------------------------------

      if (
        !Number.isFinite(previousYield) ||
        previousYield < 0
      ) {
        return res.status(400).json({
          message:
            "Previous year yield could not be determined.",
        });
      }


      // --------------------------------
      // Prepare yield input
      // --------------------------------

      const yieldInput = {

        year_start:
          currentYear,

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
          previousYield,
      };


      // --------------------------------
      // Disease request
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

            maxBodyLength:
              Infinity,
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
      // Recommendation AI input
      // --------------------------------

      const recommendationInput = {

        recommended_crop:
          cropResult.recommended_crop,

        crop_confidence:
          cropResult.confidence,

        selected_crop:
          req.body.crop_name,

        predicted_disease:
          diseaseResult.predicted_disease,

        disease_confidence:
          diseaseResult.confidence,

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

        yield_metadata: {

          current_year:
            currentYear,

          previous_year:
            previousYear,

          previous_year_label:
            previousYearLabel,

          previous_yield:
            previousYield,

          source:
            previousYieldSource,

        },

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

app.listen(
  PORT,
  () => {

    console.log(
      `Backend server running on http://localhost:${PORT}`
    );

  }
);