const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();

/* =========================================================
   SERVER CONFIGURATION
========================================================= */

const PORT = process.env.PORT || 5000;

/* =========================================================
   LIVE RENDER AI SERVICES
========================================================= */

const CROP_AI_URL =
  "https://smart-agriculture-crop-ai.onrender.com";

const DISEASE_AI_URL =
  "https://smart-agriculture-disease-ai.onrender.com";

const YIELD_AI_URL =
  "https://smart-agriculture-yield-ai.onrender.com";

const RECOMMENDATION_AI_URL =
  "https://smart-agriculture-recommendation-ai.onrender.com";

/* =========================================================
   CORS CONFIGURATION
========================================================= */

const corsOptions = {
  origin: true,
  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.options(/.*/, cors(corsOptions));

app.use(
  express.json({
    limit: "10mb",
  })
);

/* =========================================================
   FILE UPLOAD CONFIGURATION
========================================================= */

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, callback) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return callback(
        new Error("Only image files are allowed.")
      );
    }

    callback(null, true);
  },
});

/* =========================================================
   YIELD LOOKUP DATABASE
========================================================= */

const YIELD_LOOKUP_DB_PATH = path.join(
  __dirname,
  "..",
  "ai-service",
  "yield-prediction",
  "dataset",
  "previous_yield_lookup.db"
);

let yieldDatabase = null;

try {
  if (fs.existsSync(YIELD_LOOKUP_DB_PATH)) {
    yieldDatabase = new Database(
      YIELD_LOOKUP_DB_PATH,
      {
        readonly: true,
      }
    );

    console.log(
      "Yield lookup database loaded successfully."
    );
  } else {
    console.warn(
      "Yield lookup database not found:",
      YIELD_LOOKUP_DB_PATH
    );
  }
} catch (error) {
  console.error(
    "Failed to load yield lookup database:",
    error.message
  );
}

/* =========================================================
   GENERAL HELPERS
========================================================= */

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function validateNumber(
  value,
  fieldName,
  min,
  max
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return `${fieldName} must be a valid number.`;
  }

  if (number < min || number > max) {
    return `${fieldName} must be between ${min} and ${max}.`;
  }

  return null;
}

function getErrorMessage(error) {
  if (error.response?.data) {
    if (typeof error.response.data === "string") {
      return error.response.data;
    }

    return (
      error.response.data.message ||
      error.response.data.detail ||
      JSON.stringify(error.response.data)
    );
  }

  return error.message || "Unknown service error.";
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

/* =========================================================
   AI SERVICE REQUEST HELPER
========================================================= */

/*
  Render free services can sleep after inactivity.

  This helper:
  - Sends requests to AI services.
  - Allows long timeouts.
  - Retries normal JSON requests once.
  - Does not retry FormData requests because multipart
    streams cannot safely be reused after being consumed.
*/

async function postToAIService(
  url,
  endpoint,
  payload,
  options = {},
  retry = true
) {
  const isMultipartRequest =
    payload instanceof FormData;

  try {
    return await axios.post(
      `${url}${endpoint}`,
      payload,
      {
        timeout: options.timeout || 180000,

        headers: options.headers || {},

        maxBodyLength: Infinity,

        maxContentLength: Infinity,

        validateStatus: () => true,
      }
    );
  } catch (error) {
    if (retry && !isMultipartRequest) {
      console.warn(
        `AI service request failed. Retrying: ${url}${endpoint}`
      );

      await wait(5000);

      return postToAIService(
        url,
        endpoint,
        payload,
        options,
        false
      );
    }

    throw error;
  }
}

function sendAIServiceResponse(
  res,
  response,
  fallbackMessage
) {
  if (
    response.status >= 200 &&
    response.status < 300
  ) {
    return res
      .status(response.status)
      .json(response.data);
  }

  console.error(
    "AI service returned an error:",
    response.status,
    response.data
  );

  return res.status(502).json({
    message: fallbackMessage,
    upstream_status: response.status,
    upstream_error: response.data,
  });
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.json({
    message: "Smart Agriculture Backend is running",
    status: "healthy",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",

    backend: "running",

    crop_ai: CROP_AI_URL,

    disease_ai: DISEASE_AI_URL,

    yield_ai: YIELD_AI_URL,

    recommendation_ai: RECOMMENDATION_AI_URL,

    yield_database: yieldDatabase
      ? "loaded"
      : "unavailable",
  });
});

/* =========================================================
   LOCATION GEOCODING
========================================================= */

app.get("/api/geocode", async (req, res) => {
  try {
    const {
      state,
      district,
    } = req.query;

    if (!state || !district) {
      return res.status(400).json({
        message:
          "State and district are required.",
      });
    }

    const cleanState = String(state).trim();

    const cleanDistrict = String(
      district
    ).trim();

    async function searchLocation(query) {
      const geocodeUrl =
        "https://geocoding-api.open-meteo.com/v1/search" +
        `?name=${encodeURIComponent(query)}` +
        "&count=10" +
        "&language=en" +
        "&format=json";

      const response = await axios.get(
        geocodeUrl,
        {
          timeout: 30000,
        }
      );

      return response.data.results || [];
    }

    function scoreLocation(location) {
      let score = 0;

      const locationName = normalizeText(
        location.name
      );

      const admin1 = normalizeText(
        location.admin1
      );

      const admin2 = normalizeText(
        location.admin2
      );

      const expectedState = normalizeText(
        cleanState
      );

      const expectedDistrict = normalizeText(
        cleanDistrict
      );

      const country = normalizeText(
        location.country
      );

      if (country !== "india") {
        return -1;
      }

      if (locationName === expectedDistrict) {
        score += 100;
      }

      if (admin2 === expectedDistrict) {
        score += 80;
      }

      if (
        locationName.includes(expectedDistrict)
      ) {
        score += 40;
      }

      if (admin1 === expectedState) {
        score += 60;
      }

      if (admin1.includes(expectedState)) {
        score += 20;
      }

      const featureCode = String(
        location.feature_code || ""
      ).toUpperCase();

      if (featureCode.includes("ADM")) {
        score += 10;
      }

      return score;
    }

    const searchQueries = [
      `${cleanDistrict}, ${cleanState}, India`,
      `${cleanDistrict}, India`,
      `${cleanState}, India`,
    ];

    let bestLocation = null;

    let bestScore = -1;

    for (const query of searchQueries) {
      try {
        console.log(
          `Geocoding search: ${query}`
        );

        const results = await searchLocation(
          query
        );

        for (const location of results) {
          const score = scoreLocation(
            location
          );

          if (score > bestScore) {
            bestScore = score;

            bestLocation = location;
          }
        }

        if (
          bestLocation &&
          bestScore >= 120
        ) {
          break;
        }
      } catch (searchError) {
        console.error(
          `Geocoding search failed for "${query}":`,
          searchError.message
        );
      }
    }

    if (!bestLocation) {
      return res.status(404).json({
        message:
          `Location not found for ${cleanDistrict}, ${cleanState}.`,
      });
    }

    res.json({
      latitude: bestLocation.latitude,

      longitude: bestLocation.longitude,

      name: bestLocation.name,

      country: bestLocation.country,

      admin1: bestLocation.admin1 || null,

      admin2: bestLocation.admin2 || null,

      matched_query:
        `${cleanDistrict}, ${cleanState}, India`,

      location_confidence:
        bestScore >= 120
          ? "high"
          : bestScore >= 70
          ? "moderate"
          : "fallback",
    });
  } catch (error) {
    console.error(
      "Geocoding API error:",
      getErrorMessage(error)
    );

    res.status(500).json({
      message: "Failed to find location.",

      error: getErrorMessage(error),
    });
  }
});

/* =========================================================
   WEATHER
========================================================= */

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
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${encodeURIComponent(latitude)}` +
      `&longitude=${encodeURIComponent(longitude)}` +
      "&current=temperature_2m,relative_humidity_2m,precipitation" +
      "&hourly=precipitation" +
      "&past_days=7" +
      "&forecast_days=1" +
      "&timezone=auto";

    const response = await axios.get(
      weatherUrl,
      {
        timeout: 30000,
      }
    );

    const weather = response.data;

    const currentTemperature =
      weather.current?.temperature_2m ?? null;

    const currentHumidity =
      weather.current
        ?.relative_humidity_2m ?? null;

    const currentPrecipitation =
      weather.current?.precipitation ?? null;

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
          (total, value) => total + value,
          0
        );

    res.json({
      temperature: currentTemperature,

      humidity: currentHumidity,

      current_precipitation:
        currentPrecipitation,

      recent_precipitation: Number(
        recentPrecipitation.toFixed(2)
      ),

      temperature_unit:
        weather.current_units
          ?.temperature_2m || "°C",

      humidity_unit:
        weather.current_units
          ?.relative_humidity_2m || "%",

      precipitation_unit:
        weather.current_units
          ?.precipitation || "mm",

      rainfall: null,
    });
  } catch (error) {
    console.error(
      "Weather API error:",
      getErrorMessage(error)
    );

    res.status(500).json({
      message:
        "Failed to fetch weather information.",

      error: getErrorMessage(error),
    });
  }
});

/* =========================================================
   PREVIOUS YEAR YIELD HELPER
========================================================= */

function findPreviousYield({
  yearStart,
  stateName,
  districtName,
  cropName,
  season,
}) {
  if (!yieldDatabase) {
    throw new Error(
      "Yield lookup database is not available."
    );
  }

  const previousYear =
    Number(yearStart) - 1;

  const previousYearLabel =
    `${previousYear}-${yearStart}`;

  const lookupYield = yieldDatabase
    .prepare(
      `
      SELECT year, yield
      FROM yield_records
      WHERE lower(trim(year)) =
            lower(trim(?))

        AND lower(trim(state_name)) =
            lower(trim(?))

        AND lower(trim(district_name)) =
            lower(trim(?))

        AND lower(trim(crop_name)) =
            lower(trim(?))

        AND lower(trim(season)) =
            lower(trim(?))

        AND CAST(yield AS REAL) >= 0

      LIMIT 1
      `
    )
    .get(
      previousYearLabel,
      stateName,
      districtName,
      cropName,
      season
    );

  if (!lookupYield) {
    return {
      found: false,

      previousYear,

      previousYearLabel,

      previousYield: null,
    };
  }

  const previousYield = Number(
    lookupYield.yield
  );

  if (
    !Number.isFinite(previousYield) ||
    previousYield < 0
  ) {
    return {
      found: false,

      previousYear,

      previousYearLabel,

      previousYield: null,
    };
  }

  return {
    found: true,

    previousYear,

    previousYearLabel,

    previousYield,
  };
}

/* =========================================================
   PREVIOUS YEAR YIELD API
========================================================= */

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

      const currentYear = Number(
        year_start
      );

      if (!Number.isInteger(currentYear)) {
        return res.status(400).json({
          message:
            "year_start must be a valid year.",
        });
      }

      const result = findPreviousYield({
        yearStart: currentYear,

        stateName: state_name,

        districtName: district_name,

        cropName: crop_name,

        season,
      });

      if (!result.found) {
        return res.status(404).json({
          message:
            "Previous year yield was not found for the selected location, crop and season.",

          previous_year: result.previousYear,

          previous_year_label:
            result.previousYearLabel,

          previous_yield: null,
        });
      }

      res.json({
        previous_year: result.previousYear,

        previous_year_label:
          result.previousYearLabel,

        previous_yield:
          result.previousYield,

        yield_unit: "Tonnes/Hectare",

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

        error: error.message,
      });
    }
  }
);

/* =========================================================
   CROP RECOMMENDATION
========================================================= */

app.post(
  "/api/crop-recommendation",
  async (req, res) => {
    try {
      console.log(
        "Crop recommendation request:",
        req.body
      );

      const response = await postToAIService(
        CROP_AI_URL,
        "/predict",
        req.body,
        {
          timeout: 180000,
        }
      );

      console.log(
        "Crop AI response status:",
        response.status
      );

      return sendAIServiceResponse(
        res,
        response,
        "Failed to get crop recommendation."
      );
    } catch (error) {
      console.error(
        "Crop AI service connection error:",
        getErrorMessage(error)
      );

      return res.status(502).json({
        message:
          "Could not connect to the Crop AI service.",

        error: getErrorMessage(error),

        service: CROP_AI_URL,
      });
    }
  }
);

/* =========================================================
   PLANT DISEASE DETECTION
========================================================= */

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

      const formData = new FormData();

      formData.append(
        "file",
        req.file.buffer,
        {
          filename:
            req.file.originalname ||
            "plant-image.jpg",

          contentType: req.file.mimetype,
        }
      );

      const response = await postToAIService(
        DISEASE_AI_URL,
        "/predict",
        formData,
        {
          timeout: 180000,

          headers: formData.getHeaders(),
        },

        false
      );

      return sendAIServiceResponse(
        res,
        response,
        "Failed to detect plant disease."
      );
    } catch (error) {
      console.error(
        "Plant Disease AI connection error:",
        getErrorMessage(error)
      );

      return res.status(502).json({
        message:
          "Could not connect to the Plant Disease AI service.",

        error: getErrorMessage(error),
      });
    }
  }
);

/* =========================================================
   YIELD PREDICTION
========================================================= */

app.post(
  "/api/yield-prediction",
  async (req, res) => {
    try {
      const response = await postToAIService(
        YIELD_AI_URL,
        "/predict",
        req.body,
        {
          timeout: 180000,
        }
      );

      return sendAIServiceResponse(
        res,
        response,
        "Failed to predict crop yield."
      );
    } catch (error) {
      console.error(
        "Yield AI connection error:",
        getErrorMessage(error)
      );

      return res.status(502).json({
        message:
          "Could not connect to the Yield AI service.",

        error: getErrorMessage(error),
      });
    }
  }
);

/* =========================================================
   RECOMMENDATION ENGINE
========================================================= */

app.post(
  "/api/recommendation",
  async (req, res) => {
    try {
      console.log(
        "Recommendation request:",
        req.body
      );

      const response = await postToAIService(
        RECOMMENDATION_AI_URL,
        "/recommend",
        req.body,
        {
          timeout: 180000,
        }
      );

      return sendAIServiceResponse(
        res,
        response,
        "Failed to generate agricultural recommendation."
      );
    } catch (error) {
      console.error(
        "Recommendation AI connection error:",
        getErrorMessage(error)
      );

      return res.status(502).json({
        message:
          "Could not connect to the Recommendation AI service.",

        error: getErrorMessage(error),
      });
    }
  }
);

/* =========================================================
   INTEGRATED AI WORKFLOW
========================================================= */

app.post(
  "/api/ai-analysis",
  upload.single("file"),
  async (req, res) => {
    try {
      /* -----------------------------------------------------
         FILE VALIDATION
      ----------------------------------------------------- */

      if (!req.file) {
        return res.status(400).json({
          message:
            "Please upload a plant leaf image.",
        });
      }

      if (
        !req.file.mimetype ||
        !req.file.mimetype.startsWith("image/")
      ) {
        return res.status(400).json({
          message:
            "Uploaded file must be an image.",
        });
      }

      /* -----------------------------------------------------
         REQUIRED FIELD VALIDATION
      ----------------------------------------------------- */

      const requiredFields = [
        "year_start",
        "state_name",
        "district_name",
        "crop_name",
        "crop_type",
        "season",
        "area",
      ];

      for (const field of requiredFields) {
        if (
          req.body[field] === undefined ||
          String(req.body[field]).trim() === ""
        ) {
          return res.status(400).json({
            message: `${field} is required.`,
          });
        }
      }

      /* -----------------------------------------------------
         NUMERIC VALIDATION
      ----------------------------------------------------- */

      const validations = [
        validateNumber(
          req.body.N,
          "Nitrogen (N)",
          0,
          140
        ),

        validateNumber(
          req.body.P,
          "Phosphorus (P)",
          5,
          145
        ),

        validateNumber(
          req.body.K,
          "Potassium (K)",
          5,
          205
        ),

        validateNumber(
          req.body.temperature,
          "Temperature",
          8.8,
          43.7
        ),

        validateNumber(
          req.body.humidity,
          "Humidity",
          14.3,
          100
        ),

        validateNumber(
          req.body.ph,
          "Soil pH",
          3.5,
          10
        ),

        validateNumber(
          req.body.rainfall,
          "Rainfall",
          20.2,
          298.6
        ),

        validateNumber(
          req.body.year_start,
          "Year",
          1998,
          2030
        ),

        validateNumber(
          req.body.area,
          "Area",
          0.0001,
          1000000
        ),
      ];

      const validationError =
        validations.find(
          (message) => message !== null
        );

      if (validationError) {
        return res.status(400).json({
          message: validationError,
        });
      }

      /* -----------------------------------------------------
         YEAR INFORMATION
      ----------------------------------------------------- */

      const currentYear = Number(
        req.body.year_start
      );

      const previousYear =
        currentYear - 1;

      const previousYearLabel =
        `${previousYear}-${currentYear}`;

      /* -----------------------------------------------------
         CROP INPUT
      ----------------------------------------------------- */

      const cropInput = {
        N: Number(req.body.N),

        P: Number(req.body.P),

        K: Number(req.body.K),

        temperature: Number(
          req.body.temperature
        ),

        humidity: Number(
          req.body.humidity
        ),

        ph: Number(req.body.ph),

        rainfall: Number(
          req.body.rainfall
        ),
      };

      /* -----------------------------------------------------
         PREVIOUS YEAR YIELD
      ----------------------------------------------------- */

      let previousYield = Number(
        req.body.previous_yield
      );

      let previousYieldSource =
        "user_input";

      if (!Number.isFinite(previousYield)) {
        previousYield = null;
      }

      if (yieldDatabase) {
        const historicalYield =
          findPreviousYield({
            yearStart: currentYear,

            stateName: req.body.state_name,

            districtName:
              req.body.district_name,

            cropName: req.body.crop_name,

            season: req.body.season,
          });

        if (
          historicalYield.found &&
          Number.isFinite(
            historicalYield.previousYield
          )
        ) {
          previousYield =
            historicalYield.previousYield;

          previousYieldSource =
            "historical_dataset";
        }
      }

      if (
        !Number.isFinite(previousYield) ||
        previousYield < 0
      ) {
        return res.status(400).json({
          message:
            "Previous year yield could not be determined.",
        });
      }

      /* -----------------------------------------------------
         YIELD INPUT
      ----------------------------------------------------- */

      const yieldInput = {
        year_start: currentYear,

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

        area: Number(req.body.area),

        previous_yield: previousYield,
      };

      /* -----------------------------------------------------
         DISEASE FORM DATA
      ----------------------------------------------------- */

      const diseaseFormData =
        new FormData();

      diseaseFormData.append(
        "file",
        req.file.buffer,
        {
          filename:
            req.file.originalname ||
            "plant-image.jpg",

          contentType: req.file.mimetype,
        }
      );

      /* -----------------------------------------------------
         RUN CROP, DISEASE AND YIELD MODELS
      ----------------------------------------------------- */

      const [
        cropResponse,
        diseaseResponse,
        yieldResponse,
      ] = await Promise.all([
        postToAIService(
          CROP_AI_URL,
          "/predict",
          cropInput,
          {
            timeout: 180000,
          }
        ),

        postToAIService(
          DISEASE_AI_URL,
          "/predict",
          diseaseFormData,
          {
            timeout: 180000,

            headers:
              diseaseFormData.getHeaders(),
          },

          false
        ),

        postToAIService(
          YIELD_AI_URL,
          "/predict",
          yieldInput,
          {
            timeout: 180000,
          }
        ),
      ]);

      /* -----------------------------------------------------
         UPSTREAM RESPONSE VALIDATION
      ----------------------------------------------------- */

      if (
        cropResponse.status < 200 ||
        cropResponse.status >= 300
      ) {
        return res.status(502).json({
          message:
            "Crop AI service failed during integrated analysis.",

          upstream_status:
            cropResponse.status,

          upstream_error:
            cropResponse.data,
        });
      }

      if (
        diseaseResponse.status < 200 ||
        diseaseResponse.status >= 300
      ) {
        return res.status(502).json({
          message:
            "Plant Disease AI service failed during integrated analysis.",

          upstream_status:
            diseaseResponse.status,

          upstream_error:
            diseaseResponse.data,
        });
      }

      if (
        yieldResponse.status < 200 ||
        yieldResponse.status >= 300
      ) {
        return res.status(502).json({
          message:
            "Yield AI service failed during integrated analysis.",

          upstream_status:
            yieldResponse.status,

          upstream_error:
            yieldResponse.data,
        });
      }

      /* -----------------------------------------------------
         MODEL RESULTS
      ----------------------------------------------------- */

      const cropResult =
        cropResponse.data;

      const diseaseResult =
        diseaseResponse.data;

      const yieldResult =
        yieldResponse.data;

      /* -----------------------------------------------------
         RECOMMENDATION INPUT
      ----------------------------------------------------- */

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

      /* -----------------------------------------------------
         RECOMMENDATION ENGINE
      ----------------------------------------------------- */

      const recommendationResponse =
        await postToAIService(
          RECOMMENDATION_AI_URL,
          "/recommend",
          recommendationInput,
          {
            timeout: 180000,
          }
        );

      if (
        recommendationResponse.status < 200 ||
        recommendationResponse.status >= 300
      ) {
        return res.status(502).json({
          message:
            "Recommendation AI service failed during integrated analysis.",

          upstream_status:
            recommendationResponse.status,

          upstream_error:
            recommendationResponse.data,
        });
      }

      /* -----------------------------------------------------
         FINAL RESPONSE
      ----------------------------------------------------- */

      return res.json({
        crop: cropResult,

        disease: diseaseResult,

        yield: yieldResult,

        recommendation:
          recommendationResponse.data,

        yield_metadata: {
          current_year: currentYear,

          previous_year: previousYear,

          previous_year_label:
            previousYearLabel,

          previous_yield: previousYield,

          source: previousYieldSource,
        },
      });
    } catch (error) {
      console.error(
        "Integrated AI workflow error:",
        getErrorMessage(error)
      );

      return res.status(502).json({
        message:
          "Failed to complete integrated AI analysis.",

        error: getErrorMessage(error),
      });
    }
  }
);

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((error, req, res, next) => {
  console.error(
    "Global server error:",
    error.message
  );

  if (
    error instanceof multer.MulterError
  ) {
    return res.status(400).json({
      message:
        "File upload error.",

      error: error.message,
    });
  }

  if (
    error.message ===
    "Only image files are allowed."
  ) {
    return res.status(400).json({
      message: error.message,
    });
  }

  return res.status(500).json({
    message:
      "Internal server error.",

    error: error.message,
  });
});

/* =========================================================
   START SERVER
========================================================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Backend server running on port ${PORT}`
    );

    console.log(
      `Crop AI: ${CROP_AI_URL}`
    );

    console.log(
      `Disease AI: ${DISEASE_AI_URL}`
    );

    console.log(
      `Yield AI: ${YIELD_AI_URL}`
    );

    console.log(
      `Recommendation AI: ${RECOMMENDATION_AI_URL}`
    );

    console.log(
      `Yield database: ${
        yieldDatabase
          ? "loaded"
          : "unavailable"
      }`
    );
  }
);