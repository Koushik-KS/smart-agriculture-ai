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
  previous_yield: string;
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
   CONFIG & CROPS CATALOG
========================================================= */

const BACKEND_FALLBACK_URL =
  "https://smart-agriculture-backend-cpuf.onrender.com";

const CROP_CATEGORIES: Record<string, string[]> = {
  Cereals: ["Rice", "Maize", "Wheat", "Jowar", "Bajra", "Ragi", "Barley"],
  Pulses: [
    "Gram",
    "Arhar/Tur",
    "Moong(Green Gram)",
    "Urad",
    "Horse-Gram",
    "Lentil",
    "Peas",
  ],
  Oilseeds: [
    "Groundnut",
    "Sunflower",
    "Soyabean",
    "Sesamum",
    "Mustard",
    "Castor Seed",
    "Niger Seed",
  ],
  "Commercial Crops": ["Sugarcane", "Cotton(Lint)", "Tobacco", "Jute"],
  Fruits: [
    "Apple",
    "Banana",
    "Grapes",
    "Mango",
    "Orange",
    "Papaya",
    "Pomegranate",
    "Watermelon",
    "Muskmelon",
  ],
  Vegetables: [
    "Tomato",
    "Potato",
    "Onion",
    "Brinjal",
    "Cabbage",
    "Cauliflower",
    "Chilli",
  ],
  Spices: [
    "Black Pepper",
    "Cardamom",
    "Coriander",
    "Cumin",
    "Garlic",
    "Ginger",
    "Turmeric",
  ],
  Fibers: ["Cotton(Lint)", "Jute", "Mesta", "Sunhemp"],
};

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

  crop_type: "Cereals",
  crop_name: "Rice",
  season: "Kharif",

  area: "100",
  previous_yield: "1.567",
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
  const [form, setForm] = useState<FormData>(initialForm);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);

  /* WEATHER */
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  /* PREVIOUS YIELD */
  const [previousYield, setPreviousYield] =
    useState<PreviousYieldData | null>(null);
  const [previousYieldLoading, setPreviousYieldLoading] = useState(false);
  const [previousYieldError, setPreviousYieldError] = useState("");

  /* RESULT */
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState("");

  /* =======================================================
     STATES & DISTRICTS
  ======================================================= */

  const states = useMemo(() => {
    return indiaLocations
      .map((location) => location.state)
      .sort((a, b) => a.localeCompare(b));
  }, []);

  const selectedState = useMemo(() => {
    return indiaLocations.find(
      (location) => location.state === form.state_name
    );
  }, [form.state_name]);

  const districts = useMemo(() => {
    return (selectedState?.districts || []).slice().sort((a, b) =>
      a.localeCompare(b)
    );
  }, [selectedState]);

  /* =======================================================
     CROP TYPES & CROPS
  ======================================================= */

  const cropTypes = useMemo(() => {
    return Object.keys(CROP_CATEGORIES);
  }, []);

  const availableCrops = useMemo(() => {
    const list = CROP_CATEGORIES[form.crop_type];
    if (list && list.length > 0) {
      return list;
    }
    return cropInformation.map((c) => c.crop);
  }, [form.crop_type]);

  /* =======================================================
     WEATHER
  ======================================================= */

  const fetchWeather = useCallback(async () => {
    const state = form.state_name.trim();
    const district = form.district_name.trim();

    if (!state || !district) {
      setWeather(null);
      setWeatherError("Please select both state and district.");
      return;
    }

    setWeatherLoading(true);
    setWeatherError("");

    try {
      let location: { latitude: number; longitude: number } | null = null;

      try {
        const geocodeRes = await fetch(
          `/api/geocode?state=${encodeURIComponent(
            state
          )}&district=${encodeURIComponent(district)}`,
          { cache: "no-store" }
        );
        if (geocodeRes.ok) {
          location = await geocodeRes.json();
        }
      } catch {
        // Fallback to direct backend
        const geocodeFallback = await fetch(
          `${BACKEND_FALLBACK_URL}/api/geocode?state=${encodeURIComponent(
            state
          )}&district=${encodeURIComponent(district)}`,
          { cache: "no-store" }
        );
        if (geocodeFallback.ok) {
          location = await geocodeFallback.json();
        }
      }

      if (!location || !("latitude" in location)) {
        throw new Error("Unable to locate selected district coordinates.");
      }

      let weatherData: WeatherData | null = null;

      try {
        const weatherRes = await fetch(
          `/api/weather?latitude=${encodeURIComponent(
            location.latitude
          )}&longitude=${encodeURIComponent(location.longitude)}`,
          { cache: "no-store" }
        );
        if (weatherRes.ok) {
          weatherData = await weatherRes.json();
        }
      } catch {
        // Fallback to direct backend
        const weatherFallback = await fetch(
          `${BACKEND_FALLBACK_URL}/api/weather?latitude=${encodeURIComponent(
            location.latitude
          )}&longitude=${encodeURIComponent(location.longitude)}`,
          { cache: "no-store" }
        );
        if (weatherFallback.ok) {
          weatherData = await weatherFallback.json();
        }
      }

      if (!weatherData) {
        throw new Error("Failed to fetch weather information.");
      }

      setWeather(weatherData);

      setForm((previous) => {
        let newTemp = previous.temperature;
        let newHumidity = previous.humidity;

        if (
          weatherData?.temperature !== null &&
          Number.isFinite(Number(weatherData?.temperature))
        ) {
          // Clamp to Crop AI model valid range (8.8 to 43.7 C)
          const clamped = Math.min(
            Math.max(Number(weatherData?.temperature), 8.8),
            43.7
          );
          newTemp = clamped.toFixed(1);
        }

        if (
          weatherData?.humidity !== null &&
          Number.isFinite(Number(weatherData?.humidity))
        ) {
          // Clamp to Crop AI model valid range (14.3 to 100 %)
          const clamped = Math.min(
            Math.max(Number(weatherData?.humidity), 14.3),
            100
          );
          newHumidity = clamped.toFixed(1);
        }

        return {
          ...previous,
          temperature: newTemp,
          humidity: newHumidity,
        };
      });
    } catch (err) {
      console.error("Weather error:", err);
      setWeather(null);
      setWeatherError(
        err instanceof Error
          ? err.message
          : "Unable to load weather information."
      );
    } finally {
      setWeatherLoading(false);
    }
  }, [form.state_name, form.district_name]);

  /* =======================================================
     PREVIOUS YEAR YIELD LOOKUP
  ======================================================= */

  const fetchPreviousYield = useCallback(async () => {
    const { year_start, state_name, district_name, crop_name, season } =
      form;

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
      const params = new URLSearchParams({
        year_start,
        state_name,
        district_name,
        crop_name,
        season,
      });

      let res: Response | null = null;

      try {
        res = await fetch(`/api/previous-yield?${params.toString()}`, {
          cache: "no-store",
        });
      } catch {
        // Fallback to direct backend
        res = await fetch(
          `${BACKEND_FALLBACK_URL}/api/previous-yield?${params.toString()}`,
          { cache: "no-store" }
        );
      }

      if (res && res.ok) {
        const data = await res.json();
        setPreviousYield(data);
        if (
          data.previous_yield !== null &&
          Number.isFinite(Number(data.previous_yield))
        ) {
          setForm((prev) => ({
            ...prev,
            previous_yield: String(data.previous_yield),
          }));
        }
      } else {
        setPreviousYield(null);
      }
    } catch (err) {
      console.error("Previous yield error:", err);
      setPreviousYield(null);
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

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  /* =======================================================
     FORM CHANGE HANDLERS
  ======================================================= */

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    if (name === "state_name") {
      const newState = indiaLocations.find(
        (location) => location.state === value
      );

      setWeather(null);
      setWeatherError("");
      setPreviousYield(null);
      setPreviousYieldError("");

      setForm((previous) => ({
        ...previous,
        state_name: value,
        district_name: newState?.districts[0] || "",
      }));

      setResult(null);
      return;
    }

    if (name === "crop_type") {
      const list = CROP_CATEGORIES[value] || [];
      const firstCrop = list[0] || "Rice";

      setForm((previous) => ({
        ...previous,
        crop_type: value,
        crop_name: firstCrop,
      }));

      setResult(null);
      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setResult(null);
  };

  /* =======================================================
     FILE CHANGE & DRAG-AND-DROP
  ======================================================= */

  const processFile = (fileToProcess: File) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];

    if (!allowedTypes.includes(fileToProcess.type)) {
      setSelectedFile(null);
      setPreviewUrl("");
      setError("Please select a PNG, JPG or JPEG image.");
      return;
    }

    if (fileToProcess.size > 10 * 1024 * 1024) {
      setSelectedFile(null);
      setPreviewUrl("");
      setError("Image size must be less than 10 MB.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(fileToProcess);
    setSelectedFile(fileToProcess);
    setPreviewUrl(url);
    setError("");
    setResult(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  /* =======================================================
     FORM VALIDATION
  ======================================================= */

  const validateForm = () => {
    const numericFields = [
      ["Nitrogen (N)", form.N, 0, 140],
      ["Phosphorus (P)", form.P, 5, 145],
      ["Potassium (K)", form.K, 5, 205],
      ["Temperature", form.temperature, 8.8, 43.7],
      ["Humidity", form.humidity, 14.3, 100],
      ["Soil pH", form.ph, 3.5, 10],
      ["Rainfall", form.rainfall, 20.2, 298.6],
      ["Year", form.year_start, 1998, 2030],
      ["Cultivated Area", form.area, 0.0001, 1000000],
      ["Previous-Year Yield", form.previous_yield, 0, 100000],
    ] as const;

    for (const [field, rawValue, min, max] of numericFields) {
      const value = Number(rawValue);

      if (!Number.isFinite(value)) {
        return `${field} must be a valid number.`;
      }

      if (value < min || value > max) {
        return `${field} must be between ${min} and ${max}.`;
      }
    }

    if (!form.state_name) {
      return "Please select an agricultural state.";
    }

    if (!form.district_name) {
      return "Please select an agricultural district.";
    }

    if (!form.crop_name) {
      return "Please select a target crop.";
    }

    if (!form.crop_type) {
      return "Please select a crop type.";
    }

    if (!form.season) {
      return "Please select a growing season.";
    }

    if (!selectedFile) {
      return "Please upload a plant leaf image.";
    }

    return "";
  };

  /* =======================================================
     SUBMIT: RUN COMPLETE AI ANALYSIS
  ======================================================= */

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setError("");
    setResult(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!selectedFile) {
      setError("Please upload a plant leaf image.");
      return;
    }

    setLoading(true);
    setAnalysisStep(0);

    try {
      const formData = new FormData();

      // Append all required fields exactly as expected by the backend
      formData.append("N", form.N);
      formData.append("P", form.P);
      formData.append("K", form.K);
      formData.append("temperature", form.temperature);
      formData.append("humidity", form.humidity);
      formData.append("ph", form.ph);
      formData.append("rainfall", form.rainfall);
      formData.append("year_start", form.year_start);
      formData.append("state_name", form.state_name);
      formData.append("district_name", form.district_name);
      formData.append("crop_name", form.crop_name);
      formData.append("crop_type", form.crop_type);
      formData.append("season", form.season);
      formData.append("area", form.area);

      // Previous-year yield: use historical if found, else user form input
      const resolvedPreviousYield =
        previousYield?.previous_yield !== null &&
        previousYield?.previous_yield !== undefined
          ? String(previousYield.previous_yield)
          : form.previous_yield || "0.25";

      formData.append("previous_yield", resolvedPreviousYield);

      // Append leaf image
      formData.append("file", selectedFile);

      setAnalysisStep(1);

      let response: Response;

      try {
        response = await fetch("/api/ai-analysis", {
          method: "POST",
          body: formData,
        });
      } catch {
        // Direct Render backend fallback if Next.js proxy is unavailable
        response = await fetch(`${BACKEND_FALLBACK_URL}/api/ai-analysis`, {
          method: "POST",
          body: formData,
        });
      }

      setAnalysisStep(2);

      const responseText = await response.text();
      let data: AnalysisResult & { message?: string };

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          responseText || "Backend returned an unparseable response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            `AI analysis failed with status ${response.status}.`
        );
      }

      setAnalysisStep(3);
      await new Promise((resolve) => setTimeout(resolve, 250));

      setAnalysisStep(4);
      await new Promise((resolve) => setTimeout(resolve, 250));

      setAnalysisStep(5);
      await new Promise((resolve) => setTimeout(resolve, 250));

      setResult(data);
      setAnalysisStep(analysisSteps.length - 1);
    } catch (err) {
      console.error("AI analysis error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete integrated AI analysis."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     HELPERS & FORMATTERS
  ======================================================= */

  const formatDiseaseName = (value: string) => {
    return value.replaceAll("___", " — ").replaceAll("_", " ");
  };

  const formatFeatureName = (value: string) => {
    const names: Record<string, string> = {
      N: "Nitrogen (N)",
      P: "Phosphorus (P)",
      K: "Potassium (K)",
      temperature: "Temperature",
      humidity: "Humidity",
      ph: "Soil pH",
      rainfall: "Rainfall",
    };
    return names[value] || value;
  };

  const formatStatus = (status: string) => {
    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const confidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-700";
    if (confidence >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const confidenceBarColor = (confidence: number) => {
    if (confidence >= 80) return "from-green-500 to-emerald-600";
    if (confidence >= 60) return "from-amber-400 to-orange-500";
    return "from-red-400 to-rose-600";
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-5 sm:px-6 lg:px-8">
      {/* BACKGROUND PARTICLES & GLOW */}
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
          <Link href="/" className="group flex items-center gap-3">
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

          {/* MODULE LINKS */}
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
            HERO HEADER
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
            Combine soil intelligence, weather conditions, plant disease
            detection, historical yield data, and machine learning into one
            analysis workflow.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Capability label="Soil AI" />
            <Capability label="Disease Vision" />
            <Capability label="Yield ML" />
            <Capability label="Recommendation Engine" />
          </div>
        </section>

        {/* =================================================
            FORM ERROR BANNER
        ================================================= */}
        {error && (
          <div className="animate-fade-up mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm font-semibold text-red-800 shadow-sm backdrop-blur">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-xs font-black text-red-700">
              !
            </div>
            <p className="leading-5">{error}</p>
          </div>
        )}

        {/* =================================================
            MAIN INPUT GRID
        ================================================= */}
        <form id="ai-analysis-form" onSubmit={handleSubmit}>
          <section className="grid gap-7 lg:grid-cols-5">
            {/* LEFT COLUMN: 01 Agricultural Context */}
            <div className="animate-card-in rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-green-900/10 backdrop-blur-xl lg:col-span-3 md:p-8">
              <SectionHeading
                eyebrow="01 • Agricultural Context"
                title="Field Conditions"
                description="Provide the soil, environment, location, crop and historical context used by the AI models."
              />

              {/* SOIL CONDITIONS */}
              <div className="mt-7">
                <SubHeading title="Soil & Environment" />

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <InputField
                    label="Nitrogen"
                    name="N"
                    value={form.N}
                    unit="N"
                    type="number"
                    min="0"
                    max="140"
                    onChange={handleChange}
                  />

                  <InputField
                    label="Phosphorus"
                    name="P"
                    value={form.P}
                    unit="P"
                    type="number"
                    min="5"
                    max="145"
                    onChange={handleChange}
                  />

                  <InputField
                    label="Potassium"
                    name="K"
                    value={form.K}
                    unit="K"
                    type="number"
                    min="5"
                    max="205"
                    onChange={handleChange}
                  />

                  <WeatherInput
                    label="Temperature"
                    name="temperature"
                    value={form.temperature}
                    unit="°C"
                    loading={weatherLoading}
                    min="8.8"
                    max="43.7"
                    onChange={handleChange}
                  />

                  <WeatherInput
                    label="Humidity"
                    name="humidity"
                    value={form.humidity}
                    unit="%"
                    loading={weatherLoading}
                    min="14.3"
                    max="100"
                    onChange={handleChange}
                  />

                  <InputField
                    label="Soil pH"
                    name="ph"
                    value={form.ph}
                    unit="pH"
                    type="number"
                    step="0.1"
                    min="3.5"
                    max="10"
                    onChange={handleChange}
                  />

                  <InputField
                    label="Rainfall"
                    name="rainfall"
                    value={form.rainfall}
                    unit="mm"
                    type="number"
                    step="0.1"
                    min="20.2"
                    max="298.6"
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* WEATHER STATUS */}
              <div className="mt-7">
                <SubHeading title="Weather Intelligence" />

                <div className="mt-4 rounded-2xl border border-green-100 bg-green-50/60 p-4">
                  {weatherLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-200 border-t-green-700" />
                      <p className="text-sm font-semibold text-green-800">
                        Synchronizing real-time weather from Open-Meteo...
                      </p>
                    </div>
                  ) : weather ? (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Metric
                        label="Temperature"
                        value={`${weather.temperature ?? "—"} ${weather.temperature_unit || "°C"}`}
                      />
                      <Metric
                        label="Humidity"
                        value={`${weather.humidity ?? "—"} ${weather.humidity_unit || "%"}`}
                      />
                      <Metric
                        label="Precipitation"
                        value={`${weather.current_precipitation ?? "0"} ${weather.precipitation_unit || "mm"}`}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Weather data unavailable. Default environmental values
                      will be used.
                    </p>
                  )}

                  {weatherError && (
                    <p className="mt-2 text-xs font-semibold text-amber-700">
                      {weatherError}
                    </p>
                  )}
                </div>
              </div>

              {/* LOCATION & CROP */}
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

                  <InputField
                    label="Previous-Year Yield"
                    name="previous_yield"
                    value={form.previous_yield}
                    onChange={handleChange}
                    unit="t/ha"
                    type="number"
                    step="0.001"
                    min="0"
                    max="100000"
                  />
                </div>
              </div>

              {/* HISTORICAL YIELD DATABASE STATUS */}
              <div className="mt-7">
                <SubHeading title="Historical Yield Reference" />

                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  {previousYieldLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
                      <p className="text-sm font-semibold text-blue-700">
                        Checking historical SQLite dataset...
                      </p>
                    </div>
                  ) : previousYield ? (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Metric
                        label="Historical Year"
                        value={previousYield.previous_year_label}
                      />
                      <Metric
                        label="Database Yield"
                        value={`${previousYield.previous_yield ?? "—"} ${previousYield.yield_unit}`}
                      />
                      <Metric
                        label="Source"
                        value={previousYield.source}
                      />
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-gray-500">
                      Historical record not in database for this specific
                      district/crop. Using the entered previous yield (
                      {form.previous_yield} t/ha) as reference.
                    </p>
                  )}

                  {previousYieldError && (
                    <p className="mt-3 text-xs font-semibold text-amber-700">
                      {previousYieldError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: 02 Computer Vision & Execution */}
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
                      Drag and drop a leaf image here, or choose an image from
                      your device.
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

              {/* MODEL NOTICE */}
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <InfoIcon />
                  <div>
                    <p className="text-xs font-black text-blue-800">
                      Integrated AI Workflow
                    </p>
                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      All four models (Crop Recommendation, Disease Detection,
                      Yield Prediction, and Recommendation Engine) will run in
                      parallel and synchronize results.
                    </p>
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 text-sm font-black text-white shadow-lg transition hover:from-green-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Running Integrated AI Analysis...
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
        </form>

        {/* =================================================
            LOADING ORBITAL ANIMATION
        ================================================= */}
        {loading && (
          <section className="animate-fade-up mt-10 rounded-3xl border border-green-200 bg-white/90 p-8 text-center shadow-xl backdrop-blur-xl">
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
                      ((analysisStep + 1) / analysisSteps.length) * 100
                    }%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs font-semibold text-gray-400">
                Step {analysisStep + 1} of {analysisSteps.length}
              </p>
            </div>
          </section>
        )}

        {/* =================================================
            RESULTS DISPLAY
        ================================================= */}
        {result && (
          <section className="animate-result-reveal mt-10">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                  Analysis Complete
                </p>
                <h2 className="mt-1 text-3xl font-black text-gray-950 sm:text-4xl">
                  AI Analysis Results
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Synthesized from Crop AI, Plant Disease AI, Yield AI, and
                  Recommendation AI.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-green-300 bg-white px-4 py-2.5 text-xs font-bold text-green-800 shadow-sm transition hover:bg-green-50"
              >
                Modify Inputs
              </button>
            </div>

            {/* RESULT CARDS GRID */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* CARD 1: CROP RECOMMENDATION */}
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
                          width: `${Math.min(result.crop.confidence, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-500">
                  {result.crop.message}
                </p>

                {result.crop.top_recommendations &&
                  result.crop.top_recommendations.length > 0 && (
                    <div className="mt-6">
                      <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                        Top Alternative Recommendations
                      </p>

                      <div className="mt-3 space-y-3">
                        {result.crop.top_recommendations.map(
                          (item, index) => (
                            <PredictionRow
                              key={`${item.crop}-${index}`}
                              rank={index + 1}
                              name={item.crop}
                              confidence={item.confidence}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}

                {result.crop.feature_importance &&
                  result.crop.feature_importance.length > 0 && (
                    <div className="mt-6">
                      <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                        Soil & Climate Influencing Factors
                      </p>

                      <div className="mt-3 space-y-3">
                        {result.crop.feature_importance
                          .slice(0, 5)
                          .map((item) => {
                            const val =
                              item.importance > 1
                                ? item.importance
                                : item.importance * 100;
                            return (
                              <div key={item.feature}>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-gray-600">
                                    {formatFeatureName(item.feature)}
                                  </span>
                                  <span className="text-xs font-black text-green-700">
                                    {val.toFixed(1)}%
                                  </span>
                                </div>

                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600"
                                    style={{
                                      width: `${Math.min(val, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
              </ResultCard>

              {/* CARD 2: PLANT DISEASE */}
              <ResultCard>
                <ResultHeader
                  icon={<VisionIcon />}
                  eyebrow="02 • Computer Vision"
                  title="Plant Disease Detection"
                />

                <div className="mt-6 rounded-2xl bg-blue-50 p-5">
                  <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                    Detected Leaf Condition
                  </p>

                  <h3 className="mt-2 text-xl font-black text-blue-900">
                    {formatDiseaseName(result.disease.predicted_disease)}
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
                          width: `${Math.min(result.disease.confidence, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {result.disease.top_predictions &&
                  result.disease.top_predictions.length > 0 && (
                    <div className="mt-6">
                      <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                        Top Vision Predictions
                      </p>

                      <div className="mt-3 space-y-3">
                        {result.disease.top_predictions.map(
                          (item, index) => (
                            <PredictionRow
                              key={`${item.disease}-${index}`}
                              rank={index + 1}
                              name={formatDiseaseName(item.disease)}
                              confidence={item.confidence}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}

                <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <p className="text-xs leading-5 text-blue-700">
                    The vision model detects 38 common crop diseases trained
                    using PlantVillage datasets. Ensure images are focused
                    directly on the diseased symptoms.
                  </p>
                </div>
              </ResultCard>

              {/* CARD 3: YIELD PREDICTION */}
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
                      {result.yield.predicted_yield.toFixed(3)}
                    </h3>
                    <span className="mb-1 text-sm font-bold text-purple-600">
                      {result.yield.yield_unit}
                    </span>
                  </div>
                </div>

                {result.yield_metadata && (
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <Metric
                      label="Current Season Year"
                      value={String(result.yield_metadata.current_year)}
                    />
                    <Metric
                      label="Comparison Period"
                      value={result.yield_metadata.previous_year_label}
                    />
                    <Metric
                      label="Historical Reference Yield"
                      value={`${result.yield_metadata.previous_yield ?? "—"} Tonnes/Hectare`}
                    />
                    <Metric
                      label="Reference Source"
                      value={result.yield_metadata.source}
                    />
                  </div>
                )}
              </ResultCard>

              {/* CARD 4: RECOMMENDATION ENGINE */}
              <ResultCard>
                <ResultHeader
                  icon={<BrainIcon />}
                  eyebrow="04 • Decision Support"
                  title="Recommendation Engine"
                />

                <div className="mt-6 rounded-2xl bg-emerald-50 p-5">
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-600">
                    Overall Status
                  </p>

                  <h3 className="mt-2 text-2xl font-black text-emerald-900">
                    {formatStatus(result.recommendation.overall_status)}
                  </h3>
                </div>

                {result.recommendation.recommendations.length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                      AI Action Recommendations
                    </p>

                    <ul className="mt-3 space-y-2">
                      {result.recommendation.recommendations.map(
                        (recommendation, index) => (
                          <li
                            key={`${recommendation}-${index}`}
                            className="flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm leading-6 text-green-800"
                          >
                            <span className="mt-1">
                              <CheckIcon />
                            </span>
                            <span>{recommendation}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </ResultCard>
            </div>

            {/* ALERTS & SAFETY SECTION */}
            <div className="mt-6 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-xl shadow-amber-900/5 md:p-8">
              <ResultHeader
                icon={<AlertIcon />}
                eyebrow="Safety & Consistency"
                title="System Alerts & Warnings"
              />

              <div className="mt-6 space-y-3">
                {result.recommendation.alerts.length > 0 ? (
                  result.recommendation.alerts.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="alert-row animate-list-item"
                    >
                      <div className="alert-icon">!</div>
                      <p>{item}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
                    No consistency warnings or disease alerts were generated.
                    Conditions appear optimal.
                  </div>
                )}
              </div>
            </div>

            {/* DISCLAIMER */}
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white/80 p-5 text-center text-xs leading-6 text-gray-500 shadow-sm">
              AI recommendations are generated using mathematical machine
              learning models and neural networks. Always verify critical
              agricultural and treatment decisions with qualified local experts
              and local ground conditions.
            </div>
          </section>
        )}

        {/* =================================================
            EMPTY STATE
        ================================================= */}
        {!result && !loading && (
          <section className="animate-fade-up-delay-2 mt-8 rounded-3xl border border-dashed border-green-200 bg-white/60 p-8 text-center backdrop-blur">
            <div className="empty-ai-icon mx-auto">
              <BrainIcon />
            </div>

            <h3 className="mt-5 text-xl font-black text-gray-900">
              Your AI analysis will appear here
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500">
              Complete the field information, upload a plant leaf image, and run
              the analysis to synthesize all four AI models into a single report.
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
   UI SUB-COMPONENTS
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
        <h2 className="mt-1 text-2xl font-black text-gray-950">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function SubHeading({ title }: { title: string }) {
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
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
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
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
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
          {loading ? "Updating..." : "Auto"}
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
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
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
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

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
      <div className="result-icon">{icon}</div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-green-600">
          {eyebrow}
        </p>
        <h3 className="mt-0.5 text-lg font-black text-gray-950">{title}</h3>
      </div>
    </div>
  );
}

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
      <div className="prediction-rank">{rank}</div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-gray-700">{name}</p>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="confidence-bar h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600"
            style={{
              width: `${Math.min(confidence, 100)}%`,
            }}
          />
        </div>
      </div>

      <span className="text-xs font-black text-green-700">{confidence}%</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-bold text-gray-700">{value}</p>
    </div>
  );
}

function Capability({ label }: { label: string }) {
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
      <circle cx="12" cy="12" r="2.5" />
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