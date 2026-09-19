"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { indiaLocations } from "../../data/indiaLocations";
import { cropInformation } from "../../data/cropInformation";

/* =========================================================
   TYPES
========================================================= */

type FormData = {
  N: string;
  P: string;
  K: string;
  temperature: string;
  humidity: string;
  ph: string;
  rainfall: string;
  year_start: string;
  state_name: string;
  district_name: string;
  crop_name: string;
  crop_type: string;
  season: string;
  area: string;
};

type TopCropRecommendation = {
  crop: string;
  confidence: number;
};

type TopDiseasePrediction = {
  disease: string;
  confidence: number;
};

type FeatureImportance = {
  feature: string;
  importance: number;
};

type WeatherData = {
  temperature: number | null;
  humidity: number | null;
  current_precipitation: number | null;
  recent_precipitation: number | null;
  temperature_unit: string;
  humidity_unit: string;
  precipitation_unit: string;
};

type PreviousYieldData = {
  previous_year: number;
  previous_year_label: string;
  previous_yield: number | null;
  yield_unit: string;
  source: string;
};

type AnalysisResult = {
  crop: {
    recommended_crop: string;
    confidence: number;
    confidence_level: string;
    message: string;
    top_recommendations?: TopCropRecommendation[];
    feature_importance?: FeatureImportance[];
  };

  disease: {
    predicted_disease: string;
    confidence: number;
    confidence_level: string;
    top_predictions?: TopDiseasePrediction[];
  };

  yield: {
    predicted_yield: number;
    yield_unit: string;
  };

  recommendation: {
    overall_status: string;
    alerts: string[];
    recommendations: string[];
  };

  yield_metadata?: {
    current_year: number;
    previous_year: number;
    previous_year_label: string;
    previous_yield: number | null;
    source: string;
  };
};

/* =========================================================
   CONFIG
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

/* =========================================================
   INITIAL FORM
========================================================= */

const initialForm: FormData = {
  N: "90",
  P: "40",
  K: "40",

  temperature: "25",
  humidity: "80",

  ph: "6.5",
  rainfall: "200",

  year_start: "2020",

  state_name: "Karnataka",
  district_name: "Haveri",

  crop_name: "Rice",
  crop_type: "Cereals",
  season: "Kharif",

  area: "100",
};

/* =========================================================
   ANALYSIS STEPS
========================================================= */

const analysisSteps = [
  "Preparing agricultural data",
  "Analyzing soil conditions",
  "Processing weather information",
  "Scanning plant image",
  "Predicting crop yield",
  "Generating recommendations",
  "Finalizing AI analysis",
];

/* =========================================================
   PAGE
========================================================= */

export default function AIAnalysisPage() {
  const [form, setForm] =
    useState<FormData>(initialForm);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [dragActive, setDragActive] =
    useState(false);

  /* WEATHER */

  const [weather, setWeather] =
    useState<WeatherData | null>(null);

  const [weatherLoading, setWeatherLoading] =
    useState(false);

  const [weatherError, setWeatherError] =
    useState("");

  /* PREVIOUS YIELD */

  const [previousYield, setPreviousYield] =
    useState<PreviousYieldData | null>(null);

  const [previousYieldLoading, setPreviousYieldLoading] =
    useState(false);

  const [previousYieldError, setPreviousYieldError] =
    useState("");

  /* RESULT */

  const [result, setResult] =
    useState<AnalysisResult | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [analysisStep, setAnalysisStep] =
    useState(0);

  const [error, setError] =
    useState("");

  /* =======================================================
     STATES
  ======================================================= */

  const states = useMemo(() => {
    return indiaLocations
      .map((location) => location.state)
      .sort((a, b) =>
        a.localeCompare(b)
      );
  }, []);

  const selectedState = useMemo(() => {
    return indiaLocations.find(
      (location) =>
        location.state ===
        form.state_name
    );
  }, [form.state_name]);

  const districts = useMemo(() => {
    return selectedState?.districts || [];
  }, [selectedState]);

  /* =======================================================
     CROP TYPES
  ======================================================= */

  const cropTypes = useMemo(() => {
    const types = cropInformation
      .map((crop) => {
        const item =
          crop as typeof crop & {
            type?: string;
          };

        return item.type;
      })
      .filter(
        (type): type is string =>
          Boolean(type)
      );

    return Array.from(
      new Set(types)
    ).sort();
  }, []);

  /* =======================================================
     CROPS
  ======================================================= */

  const crops = useMemo(() => {
    return cropInformation
      .filter((crop) => {
        const item =
          crop as typeof crop & {
            type?: string;
          };

        return (
          !form.crop_type ||
          item.type === form.crop_type
        );
      })
      .map((crop) => crop.crop)
      .sort();
  }, [form.crop_type]);

  const availableCrops =
    crops.length > 0
      ? crops
      : cropInformation
          .map((crop) => crop.crop)
          .sort();

  /* =======================================================
     WEATHER
  ======================================================= */

  const fetchWeather = useCallback(
    async () => {
      const state =
        form.state_name.trim();

      const district =
        form.district_name.trim();

      if (!state || !district) {
        setWeather(null);
        setWeatherError(
          "Please select both state and district."
        );
        return;
      }

      setWeatherLoading(true);
      setWeatherError("");

      try {
        const geocodeResponse =
          await fetch(
            `${API_URL}/api/geocode?state=${encodeURIComponent(
              state
            )}&district=${encodeURIComponent(
              district
            )}`,
            {
              cache: "no-store",
            }
          );

        const location =
          await geocodeResponse.json();

        if (!geocodeResponse.ok) {
          throw new Error(
            location.message ||
              "Unable to locate selected district."
          );
        }

        const weatherResponse =
          await fetch(
            `${API_URL}/api/weather?latitude=${encodeURIComponent(
              location.latitude
            )}&longitude=${encodeURIComponent(
              location.longitude
            )}`,
            {
              cache: "no-store",
            }
          );

        const data =
          await weatherResponse.json();

        if (!weatherResponse.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch weather information."
          );
        }

        setWeather(data);

        setForm((previous) => ({
          ...previous,

          temperature:
            data.temperature !== null
              ? String(
                  data.temperature
                )
              : previous.temperature,

          humidity:
            data.humidity !== null
              ? String(
                  data.humidity
                )
              : previous.humidity,
        }));
      } catch (err) {
        console.error(
          "Weather error:",
          err
        );

        setWeather(null);

        setWeatherError(
          err instanceof Error
            ? err.message
            : "Unable to load weather information."
        );
      } finally {
        setWeatherLoading(false);
      }
    },
    [
      form.state_name,
      form.district_name,
    ]
  );

  /* =======================================================
     PREVIOUS YEAR YIELD
  ======================================================= */

  const fetchPreviousYield =
    useCallback(async () => {
      const {
        year_start,
        state_name,
        district_name,
        crop_name,
        season,
      } = form;

      if (
        !year_start ||
        !state_name ||
        !district_name ||
        !crop_name ||
        !season
      ) {
        setPreviousYield(null);
        return;
      }

      setPreviousYieldLoading(true);
      setPreviousYieldError("");

      try {
        const params =
          new URLSearchParams({
            year: year_start,
            state_name,
            district_name,
            crop_name,
            season,
          });

        const response =
          await fetch(
            `${API_URL}/api/previous-yield?${params.toString()}`,
            {
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Previous year yield not found."
          );
        }

        setPreviousYield(data);
      } catch (err) {
        console.error(
          "Previous yield error:",
          err
        );

        setPreviousYield(null);

        setPreviousYieldError(
          err instanceof Error
            ? err.message
            : "Previous year yield not found."
        );
      } finally {
        setPreviousYieldLoading(false);
      }
    }, [
      form.year_start,
      form.state_name,
      form.district_name,
      form.crop_name,
      form.season,
    ]);

  /* =======================================================
     EFFECTS
  ======================================================= */

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  useEffect(() => {
    fetchPreviousYield();
  }, [fetchPreviousYield]);

  /* =======================================================
     CLEAN PREVIEW URL
  ======================================================= */

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl
        );
      }
    };
  }, [previewUrl]);

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const {
      name,
      value,
    } = event.target;

    if (name === "state_name") {
      const newState =
        indiaLocations.find(
          (location) =>
            location.state ===
            value
        );

      setWeather(null);
      setWeatherError("");

      setPreviousYield(null);
      setPreviousYieldError("");

      setForm((previous) => ({
        ...previous,
        state_name: value,
        district_name:
          newState?.districts[0] ||
          "",
      }));

      setResult(null);

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (
      name === "crop_type"
    ) {
      const firstCrop =
        cropInformation.find(
          (crop) => {
            const item =
              crop as typeof crop & {
                type?: string;
              };

            return (
              item.type === value
            );
          }
        );

      setForm((previous) => ({
        ...previous,
        crop_type: value,
        crop_name:
          firstCrop?.crop ||
          "",
      }));

      setResult(null);

      return;
    }

    if (
      [
        "N",
        "P",
        "K",
        "ph",
        "rainfall",
        "temperature",
        "humidity",
        "year_start",
        "district_name",
        "crop_name",
        "season",
        "area",
      ].includes(name)
    ) {
      setResult(null);
    }
  };

  /* =======================================================
     FILE CHANGE
  ======================================================= */

  const processFile = (
    selectedFile: File
  ) => {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];

    if (
      !allowedTypes.includes(
        selectedFile.type
      )
    ) {
      setSelectedFile(null);
      setPreviewUrl("");

      setError(
        "Please select a PNG, JPG or JPEG image."
      );

      return;
    }

    if (
      selectedFile.size >
      10 * 1024 * 1024
    ) {
      setSelectedFile(null);
      setPreviewUrl("");

      setError(
        "Image size must be less than 10 MB."
      );

      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    const url =
      URL.createObjectURL(
        selectedFile
      );

    setSelectedFile(
      selectedFile
    );

    setPreviewUrl(url);

    setError("");
    setResult(null);
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setDragActive(false);

    const file =
      event.dataTransfer.files?.[0];

    if (file) {
      processFile(file);
    }
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateForm =
    () => {
      const numericFields = [
        [
          "Nitrogen",
          form.N,
          0,
          140,
        ],
        [
          "Phosphorus",
          form.P,
          5,
          145,
        ],
        [
          "Potassium",
          form.K,
          5,
          205,
        ],
        [
          "Temperature",
          form.temperature,
          8.8,
          43.7,
        ],
        [
          "Humidity",
          form.humidity,
          14.3,
          100,
        ],
        [
          "Soil pH",
          form.ph,
          3.5,
          10,
        ],
        [
          "Rainfall",
          form.rainfall,
          20.2,
          298.6,
        ],
        [
          "Year",
          form.year_start,
          1998,
          2030,
        ],
        [
          "Area",
          form.area,
          0.0001,
          1000000,
        ],
      ] as const;

      for (
        const [
          field,
          rawValue,
          min,
          max,
        ] of numericFields
      ) {
        const value =
          Number(rawValue);

        if (
          !Number.isFinite(
            value
          )
        ) {
          return `${field} must be a valid number.`;
        }

        if (
          value < min ||
          value > max
        ) {
          return `${field} must be between ${min} and ${max}.`;
        }
      }

      if (!form.state_name) {
        return "Please select a state.";
      }

      if (
        !form.district_name
      ) {
        return "Please select a district.";
      }

      if (!form.crop_name) {
        return "Please select a crop.";
      }

      if (!form.crop_type) {
        return "Please select a crop type.";
      }

      if (!form.season) {
        return "Please select a season.";
      }

      if (!selectedFile) {
        return "Please upload a plant leaf image.";
      }

      if (!previousYield) {
        return "Previous year yield could not be retrieved for the selected year, location, crop and season.";
      }

      return "";
    };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setError("");
    setResult(null);

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    if (!selectedFile) {
      setError(
        "Please upload a plant leaf image."
      );
      return;
    }

    if (!previousYield) {
      setError(
        "Previous year yield could not be retrieved."
      );
      return;
    }

    setLoading(true);
    setAnalysisStep(0);

    try {
      const formData =
        new FormData();

      Object.entries(form).forEach(
        ([key, value]) => {
          formData.append(
            key,
            value
          );
        }
      );

      formData.set(
        "previous_yield",
        String(
          previousYield.previous_yield
        )
      );

      formData.append(
        "file",
        selectedFile
      );

      setAnalysisStep(1);

      const response =
        await fetch(
          `${API_URL}/api/ai-analysis`,
          {
            method: "POST",
            body: formData,
          }
        );

      setAnalysisStep(2);

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "AI analysis failed."
        );
      }

      setAnalysisStep(3);

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            300
          )
      );

      setAnalysisStep(4);

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            300
          )
      );

      setAnalysisStep(5);

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            300
          )
      );

      setResult(data);

      setAnalysisStep(
        analysisSteps.length - 1
      );
    } catch (err) {
      console.error(
        "AI analysis error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete AI analysis."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     HELPERS
  ======================================================= */

  const formatDiseaseName = (
    value: string
  ) => {
    return value
      .replaceAll(
        "___",
        " — "
      )
      .replaceAll(
        "_",
        " "
      );
  };

  const formatFeatureName = (
    value: string
  ) => {
    const names: Record<
      string,
      string
    > = {
      N: "Nitrogen",
      P: "Phosphorus",
      K: "Potassium",
      temperature:
        "Temperature",
      humidity: "Humidity",
      ph: "Soil pH",
      rainfall: "Rainfall",
    };

    return (
      names[value] ||
      value
    );
  };

  const formatStatus = (
    status: string
  ) => {
    return status
      .replaceAll(
        "_",
        " "
      )
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  const confidenceColor = (
    confidence: number
  ) => {
    if (confidence >= 80) {
      return "text-green-700";
    }

    if (confidence >= 60) {
      return "text-amber-600";
    }

    return "text-red-600";
  };

  const confidenceBarColor = (
    confidence: number
  ) => {
    if (confidence >= 80) {
      return "from-green-500 to-emerald-600";
    }

    if (confidence >= 60) {
      return "from-amber-400 to-orange-500";
    }

    return "from-red-400 to-rose-600";
  };

  const cropInfo =
    cropInformation.find(
      (crop) =>
        crop.crop
          .trim()
          .toLowerCase() ===
        form.crop_name
          .trim()
          .toLowerCase()
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-5 sm:px-6 lg:px-8">

      {/* BACKGROUND */}

      <div className="agri-glow agri-glow-one" />
      <div className="agri-glow agri-glow-two" />
      <div className="agri-glow agri-glow-three" />

      <div className="floating-particle particle-one" />
      <div className="floating-particle particle-two" />
      <div className="floating-particle particle-three" />
      <div className="floating-particle particle-four" />

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* =================================================
            TOP NAVIGATION
        ================================================= */}

        <nav className="glass-nav animate-fade-up mb-8 flex flex-col gap-4 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">

          {/* BRAND */}

          <Link
            href="/"
            className="group flex items-center gap-3"
          >

            <div className="brand-mark">
              <span className="brand-mark-line" />
              <span className="brand-mark-leaf" />
            </div>

            <div className="hidden sm:block">

              <p className="text-sm font-black tracking-tight text-green-900">
                Smart Agriculture AI
              </p>

              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                Intelligent Farming Platform
              </p>

            </div>

          </Link>

          {/* ALL SIX MODULES */}

          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end">

            <Link
              href="/"
              className="nav-link rounded-xl px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm"
            >
              Dashboard
            </Link>

            <Link
              href="/plant-disease"
              className="nav-link rounded-xl px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm"
            >
              Plant Disease
            </Link>

            <Link
              href="/yield-prediction"
              className="nav-link rounded-xl px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm"
            >
              Yield Prediction
            </Link>

            <Link
              href="/recommendation"
              className="nav-link rounded-xl px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm"
            >
              Recommendation
            </Link>

            <Link
              href="/weather"
              className="nav-link rounded-xl px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm"
            >
              Weather
            </Link>

            <Link
              href="/ai-analysis"
              className="nav-active rounded-xl px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm"
            >
              AI Analysis
            </Link>

          </div>

        </nav>

        {/* =================================================
            HERO
        ================================================= */}

        <section className="mb-8 text-center">

          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-green-700 shadow-sm backdrop-blur">

            <span className="status-dot" />

            Multi-Model Agricultural Intelligence

          </div>

          <h1 className="animate-fade-up-delay mt-5 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">

            Complete

            <span className="block bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 bg-clip-text text-transparent">
              AI Farm Analysis
            </span>

          </h1>

          <p className="animate-fade-up-delay-2 mx-auto mt-4 max-w-3xl text-base leading-7 text-gray-600 sm:text-lg">
            Combine soil intelligence, weather
            conditions, plant disease detection,
            historical yield data, and machine
            learning into one analysis workflow.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">

            <Capability label="Soil AI" />

            <Capability label="Disease Vision" />

            <Capability label="Yield ML" />

            <Capability label="Recommendation Engine" />

          </div>

        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="animate-shake mb-7 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">

            <div className="error-icon">
              !
            </div>

            <div>

              <p className="font-extrabold text-red-800">
                Analysis Error
              </p>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* =================================================
            INPUT WORKSPACE
        ================================================= */}

        <section className="grid gap-7 lg:grid-cols-5">

          {/* =================================================
              AGRICULTURAL CONTEXT
          ================================================= */}

          <div className="animate-card-in rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-green-900/10 backdrop-blur-xl lg:col-span-3 md:p-8">

            <SectionHeading
              eyebrow="01 • Agricultural Context"
              title="Field Conditions"
              description="Provide the soil, environment, location, crop and historical context used by the AI models."
            />

            {/* SOIL */}

            <div className="mt-7">

              <SubHeading title="Soil Conditions" />

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

                <InputField
                  label="Nitrogen"
                  name="N"
                  value={form.N}
                  onChange={handleChange}
                  unit="N"
                  type="number"
                  min="0"
                  max="140"
                />

                <InputField
                  label="Phosphorus"
                  name="P"
                  value={form.P}
                  onChange={handleChange}
                  unit="P"
                  type="number"
                  min="5"
                  max="145"
                />

                <InputField
                  label="Potassium"
                  name="K"
                  value={form.K}
                  onChange={handleChange}
                  unit="K"
                  type="number"
                  min="5"
                  max="205"
                />

                <WeatherInput
                  label="Temperature"
                  name="temperature"
                  value={form.temperature}
                  onChange={handleChange}
                  unit="°C"
                  loading={weatherLoading}
                  min="8.8"
                  max="43.7"
                />

                <WeatherInput
                  label="Humidity"
                  name="humidity"
                  value={form.humidity}
                  onChange={handleChange}
                  unit="%"
                  loading={weatherLoading}
                  min="14.3"
                  max="100"
                />

                <InputField
                  label="Soil pH"
                  name="ph"
                  value={form.ph}
                  onChange={handleChange}
                  unit="pH"
                  type="number"
                  step="0.1"
                  min="3.5"
                  max="10"
                />

                <InputField
                  label="Rainfall"
                  name="rainfall"
                  value={form.rainfall}
                  onChange={handleChange}
                  unit="mm"
                  type="number"
                  step="0.1"
                  min="20.2"
                  max="298.6"
                />

              </div>

            </div>

            {/* WEATHER */}

            <div className="mt-7">

              <SubHeading title="Weather Intelligence" />

              <div className="mt-4 rounded-2xl border border-green-100 bg-green-50/60 p-4">

                {weatherLoading ? (
                  <div className="flex items-center gap-3">

                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-200 border-t-green-700" />

                    <p className="text-sm font-semibold text-green-700">
                      Loading weather data...
                    </p>

                  </div>
                ) : weather ? (
                  <div className="grid gap-4 sm:grid-cols-3">

                    <Metric
                      label="Temperature"
                      value={`${weather.temperature ?? "—"} ${weather.temperature_unit}`}
                    />

                    <Metric
                      label="Humidity"
                      value={`${weather.humidity ?? "—"} ${weather.humidity_unit}`}
                    />

                    <Metric
                      label="Recent Rainfall"
                      value={`${weather.recent_precipitation ?? "—"} ${weather.precipitation_unit}`}
                    />

                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Weather data is not available.
                  </p>
                )}

                {weatherError && (
                  <p className="mt-3 text-xs font-semibold text-red-600">
                    {weatherError}
                  </p>
                )}

              </div>

            </div>

            {/* LOCATION */}

            <div className="mt-7">

              <SubHeading title="Location & Crop" />

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <SelectField
                  label="State"
                  name="state_name"
                  value={form.state_name}
                  onChange={handleChange}
                  options={states}
                />

                <SelectField
                  label="District"
                  name="district_name"
                  value={form.district_name}
                  onChange={handleChange}
                  options={districts}
                />

                <SelectField
                  label="Crop Type"
                  name="crop_type"
                  value={form.crop_type}
                  onChange={handleChange}
                  options={cropTypes}
                />

                <SelectField
                  label="Crop"
                  name="crop_name"
                  value={form.crop_name}
                  onChange={handleChange}
                  options={availableCrops}
                />

                <SelectField
                  label="Season"
                  name="season"
                  value={form.season}
                  onChange={handleChange}
                  options={[
                    "Kharif",
                    "Rabi",
                    "Whole Year",
                    "Summer",
                    "Autumn",
                    "Winter",
                    "Spring",
                  ]}
                />

                <InputField
                  label="Year"
                  name="year_start"
                  value={form.year_start}
                  onChange={handleChange}
                  unit="Year"
                  type="number"
                  min="1998"
                  max="2030"
                />

                <InputField
                  label="Area"
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  unit="ha"
                  type="number"
                  step="0.01"
                  min="0.0001"
                  max="1000000"
                />

              </div>

            </div>

            {/* PREVIOUS YIELD */}

            <div className="mt-7">

              <SubHeading title="Historical Yield" />

              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">

                {previousYieldLoading ? (
                  <div className="flex items-center gap-3">

                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />

                    <p className="text-sm font-semibold text-blue-700">
                      Loading previous-year yield...
                    </p>

                  </div>
                ) : previousYield ? (
                  <div className="grid gap-4 sm:grid-cols-3">

                    <Metric
                      label="Previous Year"
                      value={
                        previousYield.previous_year_label
                      }
                    />

                    <Metric
                      label="Previous Yield"
                      value={`${previousYield.previous_yield ?? "—"} ${previousYield.yield_unit}`}
                    />

                    <Metric
                      label="Source"
                      value={
                        previousYield.source
                      }
                    />

                  </div>
                ) : (
                  <p className="text-sm font-semibold text-gray-500">
                    Previous-year yield is not available
                    for the selected combination.
                  </p>
                )}

                {previousYieldError && (
                  <p className="mt-3 text-xs font-semibold text-red-600">
                    {previousYieldError}
                  </p>
                )}

              </div>

            </div>

          </div>

          {/* =================================================
              PLANT IMAGE
          ================================================= */}

          <div className="animate-card-in rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-green-900/10 backdrop-blur-xl lg:col-span-2 md:p-8">

            <SectionHeading
              eyebrow="02 • Computer Vision"
              title="Plant Image"
              description="Upload a clear plant leaf image for the disease detection model."
            />

            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragActive(false);
              }}
              onDrop={handleDrop}
              className={`mt-7 rounded-3xl border-2 border-dashed p-5 text-center transition ${
                dragActive
                  ? "border-green-500 bg-green-50"
                  : "border-green-200 bg-green-50/30"
              }`}
            >

              {previewUrl ? (
                <div>

                  <div className="overflow-hidden rounded-2xl border border-green-100 bg-white">

                    <img
                      src={previewUrl}
                      alt="Selected plant leaf"
                      className="mx-auto max-h-[360px] w-full object-contain"
                    />

                  </div>

                  <div className="mt-4 flex flex-col gap-2">

                    <p className="truncate text-sm font-bold text-gray-800">
                      {selectedFile?.name}
                    </p>

                    <label
                      htmlFor="plant-image"
                      className="cursor-pointer rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-800"
                    >
                      Choose Another Image
                    </label>

                  </div>

                </div>
              ) : (
                <label
                  htmlFor="plant-image"
                  className="flex cursor-pointer flex-col items-center justify-center py-16"
                >

                  <div className="upload-icon-box">
                    <UploadIcon />
                  </div>

                  <h3 className="mt-5 text-lg font-black text-gray-900">
                    Upload Plant Image
                  </h3>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                    Drag and drop a leaf image here,
                    or choose an image from your device.
                  </p>

                  <span className="mt-5 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-800">
                    Choose Image
                  </span>

                </label>
              )}

              <input
                id="plant-image"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />

            </div>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">

              <div className="flex items-start gap-3">

                <InfoIcon />

                <div>

                  <p className="text-xs font-black text-blue-800">
                    Model information
                  </p>

                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    The disease model was trained using
                    PlantVillage images. Real-world field
                    conditions can differ from controlled
                    dataset images.
                  </p>

                </div>

              </div>

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              form="ai-analysis-form"
              disabled={
                loading ||
                previousYieldLoading ||
                !previousYield
              }
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 text-sm font-black text-white shadow-lg transition hover:from-green-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                  Running AI Analysis
                </>
              ) : (
                <>
                  <BrainIcon />

                  Run Complete AI Analysis
                </>
              )}

            </button>

          </div>

        </section>

        {/* =================================================
            HIDDEN FORM
        ================================================= */}

        <form
          id="ai-analysis-form"
          onSubmit={handleSubmit}
          className="hidden"
        />

        {/* =================================================
            PROCESSING
        ================================================= */}

        {loading && (
          <section className="processing-panel relative mt-8 overflow-hidden rounded-3xl border border-white/70 p-8 shadow-2xl backdrop-blur-xl">

            <div className="processing-glow" />

            <div className="relative z-10 flex flex-col items-center">

              <div className="ai-orbit">

                <div className="orbit-ring orbit-ring-one" />

                <div className="orbit-ring orbit-ring-two" />

                <div className="orbit-dot orbit-dot-one" />

                <div className="orbit-dot orbit-dot-two" />

                <div className="ai-core">

                  <div className="ai-core-inner">

                    <BrainIcon />

                    <span className="ai-core-pulse" />

                  </div>

                </div>

              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-green-600">
                Integrated AI Processing
              </p>

              <h2 className="mt-2 text-2xl font-black text-gray-900">
                {analysisSteps[analysisStep]}
              </h2>

              <div className="mt-5 h-2 w-full max-w-xl overflow-hidden rounded-full bg-gray-100">

                <div
                  className="confidence-bar h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-700"
                  style={{
                    width: `${
                      ((analysisStep + 1) /
                        analysisSteps.length) *
                      100
                    }%`,
                  }}
                />

              </div>

              <p className="mt-3 text-xs font-semibold text-gray-400">
                {analysisStep + 1} /{" "}
                {analysisSteps.length}
              </p>

            </div>

          </section>
        )}

        {/* =================================================
            RESULTS
        ================================================= */}

        {result && (
          <section className="animate-result-reveal mt-10">

            <div className="mb-6">

              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                Analysis Complete
              </p>

              <h2 className="mt-2 text-3xl font-black text-gray-950 sm:text-4xl">
                AI Analysis Results
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Results generated from the integrated
                agricultural AI pipeline.
              </p>

            </div>

            {/* RESULT GRID */}

            <div className="grid gap-6 lg:grid-cols-2">

              {/* CROP */}

              <ResultCard>

                <ResultHeader
                  icon={<LeafIcon />}
                  eyebrow="01 • Soil Intelligence"
                  title="Crop Recommendation"
                />

                <div className="mt-6 rounded-2xl bg-green-50 p-5">

                  <p className="text-xs font-black uppercase tracking-wider text-green-600">
                    Recommended Crop
                  </p>

                  <h3 className="mt-2 text-3xl font-black text-green-900">
                    {result.crop.recommended_crop}
                  </h3>

                  <div className="mt-4">

                    <div className="flex items-center justify-between">

                      <span className="text-xs font-bold text-gray-500">
                        Confidence
                      </span>

                      <span
                        className={`text-sm font-black ${confidenceColor(
                          result.crop.confidence
                        )}`}
                      >
                        {result.crop.confidence}%
                      </span>

                    </div>

                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white">

                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${confidenceBarColor(
                          result.crop.confidence
                        )}`}
                        style={{
                          width: `${Math.min(
                            result.crop.confidence,
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                </div>

                <p className="mt-4 text-sm leading-6 text-gray-500">
                  {result.crop.message}
                </p>

                {result.crop.top_recommendations &&
                  result.crop.top_recommendations.length >
                    0 && (
                    <div className="mt-6">

                      <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                        Top Recommendations
                      </p>

                      <div className="mt-3 space-y-3">

                        {result.crop.top_recommendations.map(
                          (
                            item,
                            index
                          ) => (
                            <PredictionRow
                              key={`${item.crop}-${index}`}
                              rank={index + 1}
                              name={item.crop}
                              confidence={
                                item.confidence
                              }
                            />
                          )
                        )}

                      </div>

                    </div>
                  )}

                {result.crop.feature_importance &&
                  result.crop.feature_importance.length >
                    0 && (
                    <div className="mt-6">

                      <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                        AI Factors
                      </p>

                      <div className="mt-3 space-y-3">

                        {result.crop.feature_importance
                          .slice(0, 5)
                          .map(
                            (
                              item
                            ) => (
                              <div
                                key={
                                  item.feature
                                }
                              >

                                <div className="flex items-center justify-between">

                                  <span className="text-xs font-semibold text-gray-600">
                                    {formatFeatureName(
                                      item.feature
                                    )}
                                  </span>

                                  <span className="text-xs font-black text-green-700">
                                    {(
                                      item.importance *
                                      100
                                    ).toFixed(
                                      1
                                    )}
                                    %
                                  </span>

                                </div>

                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">

                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600"
                                    style={{
                                      width: `${Math.min(
                                        item.importance *
                                          100,
                                        100
                                      )}%`,
                                    }}
                                  />

                                </div>

                              </div>
                            )
                          )}

                      </div>

                    </div>
                  )}

              </ResultCard>

              {/* DISEASE */}

              <ResultCard>

                <ResultHeader
                  icon={<VisionIcon />}
                  eyebrow="02 • Computer Vision"
                  title="Plant Disease Detection"
                />

                <div className="mt-6 rounded-2xl bg-blue-50 p-5">

                  <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                    Detected Condition
                  </p>

                  <h3 className="mt-2 text-xl font-black text-blue-900">
                    {formatDiseaseName(
                      result.disease.predicted_disease
                    )}
                  </h3>

                  <div className="mt-4">

                    <div className="flex items-center justify-between">

                      <span className="text-xs font-bold text-gray-500">
                        Confidence
                      </span>

                      <span
                        className={`text-sm font-black ${confidenceColor(
                          result.disease.confidence
                        )}`}
                      >
                        {result.disease.confidence}%
                      </span>

                    </div>

                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white">

                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${confidenceBarColor(
                          result.disease.confidence
                        )}`}
                        style={{
                          width: `${Math.min(
                            result.disease.confidence,
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                </div>

                {result.disease.top_predictions &&
                  result.disease.top_predictions.length >
                    0 && (
                    <div className="mt-6">

                      <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                        Top Predictions
                      </p>

                      <div className="mt-3 space-y-3">

                        {result.disease.top_predictions.map(
                          (
                            item,
                            index
                          ) => (
                            <PredictionRow
                              key={`${item.disease}-${index}`}
                              rank={index + 1}
                              name={formatDiseaseName(
                                item.disease
                              )}
                              confidence={
                                item.confidence
                              }
                            />
                          )
                        )}

                      </div>

                    </div>
                  )}

                <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">

                  <p className="text-xs leading-5 text-blue-700">
                    The current model was trained
                    using PlantVillage images.
                    Real-world field conditions can
                    differ from controlled dataset
                    images.
                  </p>

                </div>

              </ResultCard>

              {/* YIELD */}

              <ResultCard>

                <ResultHeader
                  icon={<ChartIcon />}
                  eyebrow="03 • Machine Learning"
                  title="Yield Prediction"
                />

                <div className="mt-6 rounded-2xl bg-purple-50 p-5">

                  <p className="text-xs font-black uppercase tracking-wider text-purple-600">
                    Estimated Yield
                  </p>

                  <div className="mt-2 flex items-end gap-2">

                    <h3 className="text-4xl font-black text-purple-900">
                      {result.yield.predicted_yield.toFixed(
                        3
                      )}
                    </h3>

                    <span className="mb-1 text-sm font-bold text-purple-600">
                      {result.yield.yield_unit}
                    </span>

                  </div>

                </div>

                {result.yield_metadata && (
                  <div className="mt-5 grid grid-cols-2 gap-4">

                    <Metric
                      label="Current Year"
                      value={String(
                        result.yield_metadata.current_year
                      )}
                    />

                    <Metric
                      label="Previous Year"
                      value={
                        result.yield_metadata.previous_year_label
                      }
                    />

                    <Metric
                      label="Previous Yield"
                      value={`${result.yield_metadata.previous_yield ?? "—"} Tonnes/Hectare`}
                    />

                    <Metric
                      label="Dataset"
                      value={
                        result.yield_metadata.source
                      }
                    />

                  </div>
                )}

              </ResultCard>

              {/* RECOMMENDATION */}

              <ResultCard>

                <ResultHeader
                  icon={<BrainIcon />}
                  eyebrow="04 • Decision Support"
                  title="Recommendation Engine"
                />

                <div className="mt-6 rounded-2xl bg-green-50 p-5">

                  <p className="text-xs font-black uppercase tracking-wider text-green-600">
                    Overall Status
                  </p>

                  <h3 className="mt-2 text-2xl font-black text-green-900">
                    {formatStatus(
                      result.recommendation
                        .overall_status
                    )}
                  </h3>

                </div>

                {result.recommendation
                  .recommendations
                  .length > 0 && (
                  <div className="mt-6">

                    <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                      Recommendations
                    </p>

                    <ul className="mt-3 space-y-2">

                      {result.recommendation.recommendations.map(
                        (
                          recommendation,
                          index
                        ) => (
                          <li
                            key={`${recommendation}-${index}`}
                            className="flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm leading-6 text-green-800"
                          >

                            <span className="mt-1">
                              <CheckIcon />
                            </span>

                            <span>
                              {
                                recommendation
                              }
                            </span>

                          </li>
                        )
                      )}

                    </ul>

                  </div>
                )}

              </ResultCard>

            </div>

            {/* ALERTS */}

            <div className="mt-6 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-xl shadow-amber-900/5 md:p-8">

              <ResultHeader
                icon={<AlertIcon />}
                eyebrow="Safety & Validation"
                title="Alerts"
              />

              <div className="mt-6 space-y-3">

                {result.recommendation.alerts.length >
                0 ? (
                  result.recommendation.alerts.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={`${item}-${index}`}
                        className="alert-row animate-list-item"
                      >

                        <div className="alert-icon">
                          !
                        </div>

                        <p>
                          {item}
                        </p>

                      </div>
                    )
                  )
                ) : (
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
                    No validation alerts were generated.
                  </div>
                )}

              </div>

            </div>

            {/* DISCLAIMER */}

            <div className="mt-6 rounded-2xl border border-gray-200 bg-white/80 p-5 text-center text-xs leading-6 text-gray-500 shadow-sm">

              AI predictions are based on the supplied
              inputs and training data. They should be
              used as decision-support information and
              verified with local agricultural conditions
              and qualified agricultural experts.

            </div>

          </section>
        )}

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {!result &&
          !loading && (
            <section className="animate-fade-up-delay-2 mt-8 rounded-3xl border border-dashed border-green-200 bg-white/60 p-8 text-center backdrop-blur">

              <div className="empty-ai-icon mx-auto">
                <BrainIcon />
              </div>

              <h3 className="mt-5 text-xl font-black text-gray-900">
                Your AI analysis will appear here
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500">
                Complete the field information,
                upload a plant image, and run the
                analysis to see the combined AI
                results.
              </p>

            </section>
          )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="mt-12 border-t border-green-100/80 py-8 text-center">

          <div className="flex items-center justify-center gap-2">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-700 text-white">
              <LeafIcon />
            </div>

            <span className="text-xs font-bold text-gray-500">
              Powered by Smart Agriculture AI
            </span>

          </div>

          <p className="mt-2 text-[10px] font-medium text-gray-400">
            Multi-model agricultural intelligence platform
          </p>

        </footer>

      </div>

    </main>
  );
}

/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">

      <div className="section-icon">
        <SparkIcon />
      </div>

      <div>

        <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-2xl font-black text-gray-950">
          {title}
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          {description}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   SUB HEADING
========================================================= */

function SubHeading({
  title,
}: {
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="h-px flex-1 bg-gradient-to-r from-green-200 to-transparent" />

      <h3 className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
        {title}
      </h3>

      <div className="h-px flex-1 bg-gradient-to-l from-green-200 to-transparent" />

    </div>
  );
}

/* =========================================================
   INPUT FIELD
========================================================= */

function InputField({
  label,
  name,
  value,
  onChange,
  unit,
  type = "text",
  min,
  max,
  step,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
  unit?: string;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-500">
        {label}
      </span>

      <div className="relative">

        <input
          name={name}
          value={value}
          type={type}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3.5 pr-14 text-sm font-semibold text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
        />

        {unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-green-50 px-2 py-1 text-[10px] font-black text-green-700">
            {unit}
          </span>
        )}

      </div>

    </label>
  );
}

/* =========================================================
   WEATHER INPUT
========================================================= */

function WeatherInput({
  label,
  name,
  value,
  onChange,
  unit,
  loading,
  min,
  max,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
  unit: string;
  loading: boolean;
  min?: string;
  max?: string;
}) {
  return (
    <label className="block">

      <div className="mb-2 flex items-center justify-between gap-2">

        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
          {label}
        </span>

        <span className="text-[9px] font-bold uppercase tracking-wider text-green-600">
          {loading
            ? "Updating..."
            : "Auto"}
        </span>

      </div>

      <div className="relative">

        <input
          name={name}
          value={value}
          type="number"
          step="0.1"
          min={min}
          max={max}
          onChange={onChange}
          className="w-full rounded-2xl border border-green-200 bg-green-50/60 px-4 py-3.5 pr-14 text-sm font-semibold text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
        />

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-green-50 px-2 py-1 text-[10px] font-black text-green-700">
          {unit}
        </span>

      </div>

    </label>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLSelectElement>
  ) => void;
  options: string[];
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-500">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3.5 text-sm font-semibold text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
      >

        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}

      </select>

    </label>
  );
}

/* =========================================================
   RESULT CARD
========================================================= */

function ResultCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-green-900/5 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

/* =========================================================
   RESULT HEADER
========================================================= */

function ResultHeader({
  icon,
  eyebrow,
  title,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="result-icon">
        {icon}
      </div>

      <div>

        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-green-600">
          {eyebrow}
        </p>

        <h3 className="mt-0.5 text-lg font-black text-gray-950">
          {title}
        </h3>

      </div>

    </div>
  );
}

/* =========================================================
   PREDICTION ROW
========================================================= */

function PredictionRow({
  rank,
  name,
  confidence,
}: {
  rank: number;
  name: string;
  confidence: number;
}) {
  return (
    <div className="prediction-row animate-list-item">

      <div className="prediction-rank">
        {rank}
      </div>

      <div className="min-w-0 flex-1">

        <p className="truncate text-sm font-bold text-gray-700">
          {name}
        </p>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">

          <div
            className="confidence-bar h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600"
            style={{
              width: `${Math.min(
                confidence,
                100
              )}%`,
            }}
          />

        </div>

      </div>

      <span className="text-xs font-black text-green-700">
        {confidence}%
      </span>

    </div>
  );
}

/* =========================================================
   METRIC
========================================================= */

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-bold text-gray-700">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   CAPABILITY
========================================================= */

function Capability({
  label,
}: {
  label: string;
}) {
  return (
    <div className="capability-pill">

      <span className="capability-dot" />

      {label}

    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function SparkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" />

      <path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-6 w-6"
    >
      <path d="M9.5 4a3.5 3.5 0 0 0-3 5.3A3.5 3.5 0 0 0 7 16a3.5 3.5 0 0 0 5 3.1A3.5 3.5 0 0 0 17 16a3.5 3.5 0 0 0 .5-6.7A3.5 3.5 0 0 0 14.5 4a3.5 3.5 0 0 0-5 0Z" />

      <path d="M12 4v16" />

      <path d="M7.5 9.5H12M12 14.5h4.5" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <path d="M4 19V5" />

      <path d="M4 19h16" />

      <path d="m7 15 3-4 3 2 5-6" />

      <path d="M18 7h-3" />

      <path d="M18 7v3" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-6 w-6"
    >
      <path d="M20 4C11 4 5 8 5 14c0 3.3 2.7 6 6 6 6 0 10-6 9-16Z" />

      <path d="M4 20c3-5 7-8 13-10" />
    </svg>
  );
}

function VisionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />

      <circle
        cx="12"
        cy="12"
        r="2.5"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-8 w-8"
    >
      <path d="M12 16V4" />

      <path d="m7 9 5-5 5 5" />

      <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="h-4 w-4"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M12 3 2.8 19a1 1 0 0 0 .9 1.5h16.6a1 1 0 0 0 .9-1.5L12 3Z" />

      <path d="M12 9v4" />

      <path d="M12 17h.01" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-300 text-xs font-black text-blue-600">
      i
    </div>
  );
}