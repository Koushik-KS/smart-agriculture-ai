const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = 5000;

const CROP_AI_URL =
  "http://127.0.0.1:8000";

const DISEASE_AI_URL =
  "http://127.0.0.1:8001";

const YIELD_AI_URL =
  "http://127.0.0.1:8002";

const RECOMMENDATION_AI_URL =
  "http://127.0.0.1:8003";

const upload = multer({
  storage:
    multer.memoryStorage(),
});

app.use(cors());
app.use(express.json());

/* =========================================================
   YIELD DATASET
========================================================= */

const YIELD_DATASET_PATH =
  path.join(
    __dirname,
    "..",
    "ai-service",
    "yield-prediction",
    "dataset",
    "Crop_Wise_Area_Production_Yield",
    "crop-wise-area-production-yield.csv"
  );

let yieldRecords = [];

/* =========================================================
   NORMALIZE TEXT
========================================================= */

function normalizeText(
  value
) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    );
}

/* =========================================================
   NUMBER VALIDATION
========================================================= */

function validateNumber(
  value,
  fieldName,
  min,
  max
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return `${fieldName} must be a valid number.`;
  }

  if (
    number < min ||
    number > max
  ) {
    return `${fieldName} must be between ${min} and ${max}.`;
  }

  return null;
}

/* =========================================================
   LOAD YIELD DATASET
========================================================= */

try {
  if (
    fs.existsSync(
      YIELD_DATASET_PATH
    )
  ) {
    const csvText =
      fs.readFileSync(
        YIELD_DATASET_PATH,
        "utf8"
      );

    const lines =
      csvText
        .split(/\r?\n/)
        .filter(
          (line) =>
            line.trim() !== ""
        );

    const headers =
      lines[0].split(",");

    yieldRecords =
      lines
        .slice(1)
        .map(
          (line) => {
            const values =
              line.split(",");

            const record = {};

            headers.forEach(
              (
                header,
                index
              ) => {
                record[
                  header.trim()
                ] =
                  values[
                    index
                  ]?.trim() ||
                  "";
              }
            );

            return record;
          }
        );

    console.log(
      `Yield dataset loaded: ${yieldRecords.length} records`
    );
  } else {
    console.warn(
      "Yield dataset not found:",
      YIELD_DATASET_PATH
    );
  }
} catch (error) {
  console.error(
    "Failed to load yield dataset:",
    error.message
  );
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/",
  (req, res) => {
    res.json({
      message:
        "Smart Agriculture Backend is running",
    });
  }
);

/* =========================================================
   LOCATION GEOCODING
========================================================= */

app.get(
  "/api/geocode",
  async (
    req,
    res
  ) => {
    try {
      const {
        state,
        district,
      } = req.query;

      if (
        !state ||
        !district
      ) {
        return res
          .status(400)
          .json({
            message:
              "State and district are required.",
          });
      }

      const cleanState =
        String(
          state
        ).trim();

      const cleanDistrict =
        String(
          district
        ).trim();

      /* -----------------------------------------------------
         Open-Meteo search helper
      ----------------------------------------------------- */

      async function searchLocation(
        query
      ) {
        const geocodeUrl =
          "https://geocoding-api.open-meteo.com/v1/search" +
          `?name=${encodeURIComponent(
            query
          )}` +
          "&count=10" +
          "&language=en" +
          "&format=json";

        const response =
          await fetch(
            geocodeUrl
          );

        if (
          !response.ok
        ) {
          throw new Error(
            `Geocoding API returned ${response.status}`
          );
        }

        const data =
          await response.json();

        return (
          data.results ||
          []
        );
      }

      /* -----------------------------------------------------
         Score location
      ----------------------------------------------------- */

      function scoreLocation(
        location
      ) {
        let score = 0;

        const locationName =
          normalizeText(
            location.name
          );

        const admin1 =
          normalizeText(
            location.admin1
          );

        const admin2 =
          normalizeText(
            location.admin2
          );

        const expectedState =
          normalizeText(
            cleanState
          );

        const expectedDistrict =
          normalizeText(
            cleanDistrict
          );

        const country =
          normalizeText(
            location.country
          );

        /* ---------------------------------------------------
           Only accept India
        --------------------------------------------------- */

        if (
          country !==
          "india"
        ) {
          return -1;
        }

        /* ---------------------------------------------------
           District matching
        --------------------------------------------------- */

        if (
          locationName ===
          expectedDistrict
        ) {
          score += 100;
        }

        if (
          admin2 ===
          expectedDistrict
        ) {
          score += 80;
        }

        if (
          locationName.includes(
            expectedDistrict
          )
        ) {
          score += 40;
        }

        /* ---------------------------------------------------
           State matching
        --------------------------------------------------- */

        if (
          admin1 ===
          expectedState
        ) {
          score += 60;
        }

        if (
          admin1.includes(
            expectedState
          )
        ) {
          score += 20;
        }

        /* ---------------------------------------------------
           Prefer administrative locations
        --------------------------------------------------- */

        const featureCode =
          String(
            location.feature_code ||
              ""
          ).toUpperCase();

        if (
          featureCode.includes(
            "ADM"
          )
        ) {
          score += 10;
        }

        return score;
      }

      /* -----------------------------------------------------
         Multiple search strategies
      ----------------------------------------------------- */

      const searchQueries = [
        `${cleanDistrict}, ${cleanState}, India`,
        `${cleanDistrict}, India`,
        `${cleanState}, India`,
      ];

      let bestLocation =
        null;

      let bestScore =
        -1;

      /* -----------------------------------------------------
         Search
      ----------------------------------------------------- */

      for (
        const query of
          searchQueries
      ) {
        try {
          console.log(
            `Geocoding search: ${query}`
          );

          const results =
            await searchLocation(
              query
            );

          for (
            const location of
              results
          ) {
            const score =
              scoreLocation(
                location
              );

            if (
              score >
              bestScore
            ) {
              bestScore =
                score;

              bestLocation =
                location;
            }
          }

          /*
           * Strong district + state
           * match found.
           */

          if (
            bestLocation &&
            bestScore >= 120
          ) {
            break;
          }
        } catch (
          searchError
        ) {
          console.error(
            `Geocoding search failed for "${query}":`,
            searchError.message
          );
        }
      }

      /* -----------------------------------------------------
         No location found
      ----------------------------------------------------- */

      if (
        !bestLocation
      ) {
        return res
          .status(404)
          .json({
            message:
              `Location not found for ${cleanDistrict}, ${cleanState}.`,
          });
      }

      /* -----------------------------------------------------
         Return location
      ----------------------------------------------------- */

      console.log(
        `Location found: ${bestLocation.name}, ${bestLocation.admin1 || cleanState}`
      );

      console.log(
        `Coordinates: ${bestLocation.latitude}, ${bestLocation.longitude}`
      );

      res.json({
        latitude:
          bestLocation.latitude,

        longitude:
          bestLocation.longitude,

        name:
          bestLocation.name,

        country:
          bestLocation.country,

        admin1:
          bestLocation.admin1 ||
          null,

        admin2:
          bestLocation.admin2 ||
          null,

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
        error.message
      );

      res
        .status(500)
        .json({
          message:
            "Failed to find location.",
        });
    }
  }
);

/* =========================================================
   WEATHER
========================================================= */

app.get(
  "/api/weather",
  async (
    req,
    res
  ) => {
    try {
      const {
        latitude,
        longitude,
      } = req.query;

      if (
        !latitude ||
        !longitude
      ) {
        return res
          .status(400)
          .json({
            message:
              "Latitude and longitude are required.",
          });
      }

      const weatherUrl =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${encodeURIComponent(
          latitude
        )}` +
        `&longitude=${encodeURIComponent(
          longitude
        )}` +
        "&current=temperature_2m,relative_humidity_2m,precipitation" +
        "&hourly=precipitation" +
        "&past_days=7" +
        "&forecast_days=1" +
        "&timezone=auto";

      const response =
        await fetch(
          weatherUrl
        );

      if (
        !response.ok
      ) {
        throw new Error(
          `Weather API returned ${response.status}`
        );
      }

      const weather =
        await response.json();

      const currentTemperature =
        weather.current
          ?.temperature_2m ??
        null;

      const currentHumidity =
        weather.current
          ?.relative_humidity_2m ??
        null;

      const currentPrecipitation =
        weather.current
          ?.precipitation ??
        null;

      const hourlyPrecipitation =
        weather.hourly
          ?.precipitation ||
        [];

      const recentPrecipitation =
        hourlyPrecipitation
          .filter(
            (value) =>
              typeof value ===
                "number" &&
              Number.isFinite(
                value
              )
          )
          .reduce(
            (
              total,
              value
            ) =>
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
            recentPrecipitation.toFixed(
              2
            )
          ),

        temperature_unit:
          weather
            .current_units
            ?.temperature_2m ||
          "°C",

        humidity_unit:
          weather
            .current_units
            ?.relative_humidity_2m ||
          "%",

        precipitation_unit:
          weather
            .current_units
            ?.precipitation ||
          "mm",

        rainfall:
          null,
      });
    } catch (error) {
      console.error(
        "Weather API error:",
        error.message
      );

      res
        .status(500)
        .json({
          message:
            "Failed to fetch weather information.",
        });
    }
  }
);

/* =========================================================
   PREVIOUS YEAR YIELD
========================================================= */

app.get(
  "/api/previous-yield",
  (
    req,
    res
  ) => {
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
        return res
          .status(400)
          .json({
            message:
              "year_start, state_name, district_name, crop_name and season are required.",
          });
      }

      const currentYear =
        Number(
          year_start
        );

      if (
        !Number.isInteger(
          currentYear
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "year_start must be a valid year.",
          });
      }

      const previousYear =
        currentYear - 1;

      const previousYearLabel =
        `${previousYear}-${currentYear}`;

      const matchingRecords =
        yieldRecords.filter(
          (record) => {
            return (
              normalizeText(
                record.year
              ) ===
                normalizeText(
                  previousYearLabel
                ) &&
              normalizeText(
                record.state_name
              ) ===
                normalizeText(
                  state_name
                ) &&
              normalizeText(
                record.district_name
              ) ===
                normalizeText(
                  district_name
                ) &&
              normalizeText(
                record.crop_name
              ) ===
                normalizeText(
                  crop_name
                ) &&
              normalizeText(
                record.season
              ) ===
                normalizeText(
                  season
                )
            );
          }
        );

      const validRecords =
        matchingRecords.filter(
          (record) => {
            const value =
              Number(
                record.yield
              );

            return (
              Number.isFinite(
                value
              ) &&
              value >= 0
            );
          }
        );

      if (
        validRecords.length ===
        0
      ) {
        return res
          .status(404)
          .json({
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
          validRecords[0]
            .yield
        );

      res.json({
        previous_year:
          previousYear,

        previous_year_label:
          previousYearLabel,

        previous_yield:
          previousYield,

        yield_unit:
          validRecords[0]
            .yield_unit ||
          "Tonnes/Hectare",

        source:
          "Historical agricultural yield dataset",
      });
    } catch (error) {
      console.error(
        "Previous yield lookup error:",
        error.message
      );

      res
        .status(500)
        .json({
          message:
            "Failed to retrieve previous year yield.",
        });
    }
  }
);

/* =========================================================
   CROP RECOMMENDATION
========================================================= */

app.post(
  "/api/crop-recommendation",
  async (
    req,
    res
  ) => {
    try {
      const response =
        await axios.post(
          `${CROP_AI_URL}/predict`,
          req.body
        );

      res.json(
        response.data
      );
    } catch (error) {
      console.error(
        "Crop AI service error:",
        error.response
          ?.data ||
          error.message
      );

      res
        .status(500)
        .json({
          message:
            "Failed to get crop recommendation",
        });
    }
  }
);

/* =========================================================
   PLANT DISEASE
========================================================= */

app.post(
  "/api/plant-disease",
  upload.single("file"),
  async (
    req,
    res
  ) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({
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
            req.file
              .originalname,

          contentType:
            req.file
              .mimetype,
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

            maxBodyLength:
              Infinity,
          }
        );

      res.json(
        response.data
      );
    } catch (error) {
      console.error(
        "Plant Disease AI service error:",
        error.response
          ?.data ||
          error.message
      );

      res
        .status(500)
        .json({
          message:
            "Failed to detect plant disease",
        });
    }
  }
);

/* =========================================================
   YIELD PREDICTION
========================================================= */

app.post(
  "/api/yield-prediction",
  async (
    req,
    res
  ) => {
    try {
      const response =
        await axios.post(
          `${YIELD_AI_URL}/predict`,
          req.body
        );

      res.json(
        response.data
      );
    } catch (error) {
      console.error(
        "Yield AI service error:",
        error.response
          ?.data ||
          error.message
      );

      res
        .status(500)
        .json({
          message:
            "Failed to predict crop yield",
        });
    }
  }
);

/* =========================================================
   RECOMMENDATION ENGINE
========================================================= */

app.post(
  "/api/recommendation",
  async (
    req,
    res
  ) => {
    try {
      const response =
        await axios.post(
          `${RECOMMENDATION_AI_URL}/recommend`,
          req.body
        );

      res.json(
        response.data
      );
    } catch (error) {
      console.error(
        "Recommendation AI service error:",
        error.response
          ?.data ||
          error.message
      );

      res
        .status(500)
        .json({
          message:
            "Failed to generate agricultural recommendation",
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
  async (
    req,
    res
  ) => {
    try {
      /* ===================================================
         FILE VALIDATION
      =================================================== */

      if (!req.file) {
        return res
          .status(400)
          .json({
            message:
              "Please upload a plant leaf image.",
          });
      }

      if (
        !req.file.mimetype ||
        !req.file.mimetype.startsWith(
          "image/"
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Uploaded file must be an image.",
          });
      }

      /* ===================================================
         REQUIRED FIELDS
      =================================================== */

      const requiredFields = [
        "year_start",
        "state_name",
        "district_name",
        "crop_name",
        "crop_type",
        "season",
        "area",
      ];

      for (
        const field of
          requiredFields
      ) {
        if (
          req.body[field] ===
            undefined ||
          String(
            req.body[field]
          ).trim() === ""
        ) {
          return res
            .status(400)
            .json({
              message:
                `${field} is required.`,
            });
        }
      }

      /* ===================================================
         NUMERIC VALIDATION
      =================================================== */

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
          (
            message
          ) =>
            message !==
            null
        );

      if (
        validationError
      ) {
        return res
          .status(400)
          .json({
            message:
              validationError,
          });
      }

      /* ===================================================
         CROP INPUT
      =================================================== */

      const cropInput = {
        N: Number(
          req.body.N
        ),

        P: Number(
          req.body.P
        ),

        K: Number(
          req.body.K
        ),

        temperature:
          Number(
            req.body
              .temperature
          ),

        humidity:
          Number(
            req.body
              .humidity
          ),

        ph: Number(
          req.body.ph
        ),

        rainfall:
          Number(
            req.body.rainfall
          ),
      };

      /* ===================================================
         PREVIOUS YEAR
      =================================================== */

      const currentYear =
        Number(
          req.body.year_start
        );

      const previousYear =
        currentYear - 1;

      const previousYearLabel =
        `${previousYear}-${currentYear}`;

      let previousYield =
        Number(
          req.body
            .previous_yield
        );

      let previousYieldSource =
        "user_input";

      /* ===================================================
         HISTORICAL LOOKUP
      =================================================== */

      const matchingRecords =
        yieldRecords.filter(
          (record) => {
            const recordYield =
              Number(
                record.yield
              );

            return (
              normalizeText(
                record.year
              ) ===
                normalizeText(
                  previousYearLabel
                ) &&
              normalizeText(
                record.state_name
              ) ===
                normalizeText(
                  req.body
                    .state_name
                ) &&
              normalizeText(
                record.district_name
              ) ===
                normalizeText(
                  req.body
                    .district_name
                ) &&
              normalizeText(
                record.crop_name
              ) ===
                normalizeText(
                  req.body
                    .crop_name
                ) &&
              normalizeText(
                record.season
              ) ===
                normalizeText(
                  req.body
                    .season
                ) &&
              Number.isFinite(
                recordYield
              ) &&
              recordYield >= 0
            );
          }
        );

      if (
        matchingRecords.length >
        0
      ) {
        previousYield =
          Number(
            matchingRecords[0]
              .yield
          );

        previousYieldSource =
          "historical_dataset";
      }

      /* ===================================================
         PREVIOUS YIELD VALIDATION
      =================================================== */

      if (
        !Number.isFinite(
          previousYield
        ) ||
        previousYield < 0
      ) {
        return res
          .status(400)
          .json({
            message:
              "Previous year yield could not be determined.",
          });
      }

      /* ===================================================
         YIELD INPUT
      =================================================== */

      const yieldInput = {
        year_start:
          currentYear,

        state_name:
          req.body.state_name,

        district_name:
          req.body
            .district_name,

        crop_name:
          req.body.crop_name,

        crop_type:
          req.body.crop_type,

        season:
          req.body.season,

        area:
          Number(
            req.body.area
          ),

        previous_yield:
          previousYield,
      };

      /* ===================================================
         DISEASE FORM DATA
      =================================================== */

      const diseaseFormData =
        new FormData();

      diseaseFormData.append(
        "file",
        req.file.buffer,
        {
          filename:
            req.file
              .originalname,

          contentType:
            req.file
              .mimetype,
        }
      );

      /* ===================================================
         RUN THREE AI MODELS
      =================================================== */

      const [
        cropResponse,
        diseaseResponse,
        yieldResponse,
      ] =
        await Promise.all([
          axios.post(
            `${CROP_AI_URL}/predict`,
            cropInput
          ),

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

          axios.post(
            `${YIELD_AI_URL}/predict`,
            yieldInput
          ),
        ]);

      /* ===================================================
         RESULTS
      =================================================== */

      const cropResult =
        cropResponse.data;

      const diseaseResult =
        diseaseResponse.data;

      const yieldResult =
        yieldResponse.data;

      /* ===================================================
         RECOMMENDATION INPUT
      =================================================== */

      const recommendationInput =
        {
          recommended_crop:
            cropResult
              .recommended_crop,

          crop_confidence:
            cropResult.confidence,

          selected_crop:
            req.body.crop_name,

          predicted_disease:
            diseaseResult
              .predicted_disease,

          disease_confidence:
            diseaseResult.confidence,

          predicted_yield:
            yieldResult
              .predicted_yield,
        };

      /* ===================================================
         RECOMMENDATION ENGINE
      =================================================== */

      const recommendationResponse =
        await axios.post(
          `${RECOMMENDATION_AI_URL}/recommend`,
          recommendationInput
        );

      /* ===================================================
         FINAL RESPONSE
      =================================================== */

      res.json({
        crop:
          cropResult,

        disease:
          diseaseResult,

        yield:
          yieldResult,

        recommendation:
          recommendationResponse
            .data,

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
        error.response
          ?.data ||
          error.message
      );

      res
        .status(500)
        .json({
          message:
            "Failed to complete integrated AI analysis",
        });
    }
  }
);

/* =========================================================
   START SERVER
========================================================= */

app.listen(
  PORT,
  () => {
    console.log(
      `Backend server running on http://localhost:${PORT}`
    );
  }
);