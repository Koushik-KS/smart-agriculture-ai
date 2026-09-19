"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import { indiaLocations } from "../../data/indiaLocations";
import { cropInformation } from "../../data/cropInformation";

/* =========================================================
   TYPES
========================================================= */

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
    previous_yield: number;
    source: string;
  };
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
  previous_yield: number;
  yield_unit: string;
  source: string;
};

/* =========================================================
   PAGE
========================================================= */

export default function AIAnalysisPage() {
  /* =======================================================
     FORM
  ======================================================= */

  const [form, setForm] = useState({
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
  });

  /* =======================================================
     WEATHER
  ======================================================= */

  const [weather, setWeather] =
    useState<WeatherData | null>(null);

  const [weatherLoading, setWeatherLoading] =
    useState(false);

  const [weatherError, setWeatherError] =
    useState("");

  /* =======================================================
     PREVIOUS YIELD
  ======================================================= */

  const [previousYield, setPreviousYield] =
    useState<PreviousYieldData | null>(null);

  const [
    previousYieldLoading,
    setPreviousYieldLoading,
  ] = useState(false);

  const [
    previousYieldError,
    setPreviousYieldError,
  ] = useState("");

  /* =======================================================
     FILE
  ======================================================= */

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [dragActive, setDragActive] =
    useState(false);

  /* =======================================================
     AI RESULT
  ======================================================= */

  const [result, setResult] =
    useState<AnalysisResult | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [analysisStep, setAnalysisStep] =
    useState(0);

  const [error, setError] =
    useState("");

  /* =======================================================
     ANALYSIS STEPS
  ======================================================= */

  const analysisSteps = [
    "Validating farm information",
    "Running crop recommendation",
    "Analyzing plant image",
    "Predicting crop yield",
    "Generating recommendations",
  ];

  /* =======================================================
     STATES
  ======================================================= */

  const states = useMemo(() => {
    return indiaLocations
      .map(
        (location) =>
          location.state
      )
      .sort((a, b) =>
        a.localeCompare(b)
      );
  }, []);

  /* =======================================================
     SELECTED STATE
  ======================================================= */

  const selectedState = useMemo(() => {
    return indiaLocations.find(
      (location) =>
        location.state ===
        form.state_name
    );
  }, [form.state_name]);

  /* =======================================================
     DISTRICTS
  ======================================================= */

  const districts = useMemo(() => {
    return (
      selectedState?.districts || []
    );
  }, [selectedState]);

  /* =======================================================
     CROP TYPES
  ======================================================= */

  const cropTypes = useMemo(() => {
    const types = cropInformation
      .map((crop) => {
        const cropWithType =
          crop as typeof crop & {
            type?: string;
          };

        return cropWithType.type;
      })
      .filter(
        (
          type
        ): type is string =>
          Boolean(type)
      );

    return Array.from(
      new Set(types)
    ).sort();
  }, []);

  /* =======================================================
     AVAILABLE CROPS
  ======================================================= */

  const crops = useMemo(() => {
    const filtered =
      cropInformation
        .filter((crop) => {
          const cropWithType =
            crop as typeof crop & {
              type?: string;
            };

          return (
            !form.crop_type ||
            !cropWithType.type ||
            cropWithType.type ===
              form.crop_type
          );
        })
        .map(
          (crop) =>
            crop.crop
        )
        .sort();

    return filtered;
  }, [form.crop_type]);

  const availableCrops =
    crops.length > 0
      ? crops
      : cropInformation
          .map(
            (crop) =>
              crop.crop
          )
          .sort();

  /* =======================================================
     CROP INFORMATION
  ======================================================= */

  const cropInfo = useMemo(() => {
    const normalized =
      form.crop_name
        .trim()
        .toLowerCase();

    return cropInformation.find(
      (crop) =>
        crop.crop
          .trim()
          .toLowerCase() ===
        normalized
    );
  }, [form.crop_name]);

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange = (
    name: string,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setResult(null);
    setError("");
  };

  /* =======================================================
     STATE CHANGE
  ======================================================= */

  const handleStateChange = (
    value: string
  ) => {
    const newState =
      indiaLocations.find(
        (location) =>
          location.state ===
          value
      );

    const firstDistrict =
      newState?.districts?.[0] ||
      "";

    setForm((previous) => ({
      ...previous,

      state_name:
        value,

      district_name:
        firstDistrict,
    }));

    setWeather(null);
    setWeatherError("");

    setPreviousYield(null);
    setPreviousYieldError("");

    setResult(null);
    setError("");
  };

  /* =======================================================
     CROP TYPE CHANGE
  ======================================================= */

  const handleCropTypeChange = (
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      crop_type: value,
    }));

    setResult(null);
    setError("");
  };

  /* =======================================================
     WEATHER
  ======================================================= */

  const fetchWeather =
    useCallback(
      async () => {
        const state =
          form.state_name.trim();

        const district =
          form.district_name.trim();

        if (
          !state ||
          !district
        ) {
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
              `http://localhost:5000/api/geocode?state=${encodeURIComponent(
                state
              )}&district=${encodeURIComponent(
                district
              )}`
            );

          const location =
            await geocodeResponse.json();

          if (
            !geocodeResponse.ok
          ) {
            throw new Error(
              location.message ||
                "Location not found."
            );
          }

          const weatherResponse =
            await fetch(
              `http://localhost:5000/api/weather?latitude=${encodeURIComponent(
                location.latitude
              )}&longitude=${encodeURIComponent(
                location.longitude
              )}`
            );

          const weatherData =
            await weatherResponse.json();

          if (
            !weatherResponse.ok
          ) {
            throw new Error(
              weatherData.message ||
                "Failed to fetch weather."
            );
          }

          setWeather(
            weatherData
          );

          setForm((previous) => ({
            ...previous,

            temperature:
              weatherData.temperature !==
              null
                ? String(
                    weatherData.temperature
                  )
                : previous.temperature,

            humidity:
              weatherData.humidity !==
              null
                ? String(
                    weatherData.humidity
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
              : "Failed to fetch weather."
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
    useCallback(
      async () => {
        if (
          !form.year_start ||
          !form.state_name ||
          !form.district_name ||
          !form.crop_name ||
          !form.season
        ) {
          setPreviousYield(null);
          setPreviousYieldError(
            "Complete year, location, crop and season information."
          );
          return;
        }

        setPreviousYieldLoading(
          true
        );

        setPreviousYieldError(
          ""
        );

        try {
          const query =
            new URLSearchParams({
              year_start:
                form.year_start,

              state_name:
                form.state_name,

              district_name:
                form.district_name,

              crop_name:
                form.crop_name,

              season:
                form.season,
            });

          const response =
            await fetch(
              `http://localhost:5000/api/previous-yield?${query.toString()}`
            );

          const data =
            await response.json();

          if (
            !response.ok
          ) {
            throw new Error(
              data.message ||
                "Previous year yield not found."
            );
          }

          setPreviousYield(
            data
          );
        } catch (err) {
          setPreviousYield(
            null
          );

          setPreviousYieldError(
            err instanceof Error
              ? err.message
              : "Previous year yield not found."
          );
        } finally {
          setPreviousYieldLoading(
            false
          );
        }
      },
      [
        form.year_start,
        form.state_name,
        form.district_name,
        form.crop_name,
        form.season,
      ]
    );

  /* =======================================================
     WEATHER EFFECT
  ======================================================= */

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  /* =======================================================
     PREVIOUS YIELD EFFECT
  ======================================================= */

  useEffect(() => {
    fetchPreviousYield();
  }, [fetchPreviousYield]);

  /* =======================================================
     FILE CHANGE
  ======================================================= */

  const processFile = (
    selected: File
  ) => {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];

    if (
      !allowedTypes.includes(
        selected.type
      )
    ) {
      setSelectedFile(null);
      setPreviewUrl("");
      setError(
        "Please select a PNG, JPG or JPEG image."
      );
      return;
    }

    setSelectedFile(
      selected
    );

    setPreviewUrl(
      URL.createObjectURL(
        selected
      )
    );

    setError("");
    setResult(null);
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected =
      event.target.files?.[0];

    if (selected) {
      processFile(selected);
    }
  };

  /* =======================================================
     DROP
  ======================================================= */

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    setDragActive(false);

    const selected =
      event.dataTransfer.files?.[0];

    if (selected) {
      processFile(selected);
    }
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateForm = () => {
    const numericFields = [
      ["N", 0, 140],
      ["P", 5, 145],
      ["K", 5, 205],
      ["temperature", 8.8, 43.7],
      ["humidity", 14.3, 100],
      ["ph", 3.5, 10],
      ["rainfall", 20.2, 298.6],
      ["year_start", 1998, 2030],
      ["area", 0.0001, 1000000],
    ] as const;

    for (
      const [
        field,
        min,
        max,
      ] of numericFields
    ) {
      const value =
        Number(
          form[field]
        );

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

    if (!form.district_name) {
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

      Object.entries(
        form
      ).forEach(
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
          "http://localhost:5000/api/ai-analysis",
          {
            method: "POST",
            body: formData,
          }
        );

      setAnalysisStep(2);

      const data =
        await response.json();

      if (
        !response.ok
      ) {
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
            250
          )
      );

      setResult(data);

      setAnalysisStep(
        analysisSteps.length -
          1
      );
    } catch (err) {
      console.error(
        "AI analysis error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while running AI analysis."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     FORMAT DISEASE
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

  /* =======================================================
     FORMAT FEATURE
  ======================================================= */

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
      humidity:
        "Humidity",
      ph: "Soil pH",
      rainfall:
        "Rainfall",
    };

    return (
      names[value] ||
      value
    );
  };

  /* =======================================================
     STATUS
  ======================================================= */

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

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-8 sm:px-6 lg:px-8">

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
            NAVIGATION
        ================================================= */}

        <nav className="glass-nav mb-10 flex flex-col gap-5 rounded-2xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

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

          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">

  <Link
    href="/"
    className="px-4 py-2 rounded-xl text-sm font-semibold text-[#176b3a] hover:bg-[#eefaf2] transition"
  >
    Dashboard
  </Link>

  <Link
    href="/plant-disease"
    className="px-4 py-2 rounded-xl text-sm font-semibold text-[#176b3a] hover:bg-[#eefaf2] transition"
  >
    Plant Disease
  </Link>

  <Link
    href="/yield-prediction"
    className="px-4 py-2 rounded-xl text-sm font-semibold text-[#176b3a] hover:bg-[#eefaf2] transition"
  >
    Yield Prediction
  </Link>

  <Link
    href="/recommendation"
    className="px-4 py-2 rounded-xl text-sm font-semibold text-[#176b3a] hover:bg-[#eefaf2] transition"
  >
    Recommendation
  </Link>

  <Link
    href="/weather"
    className="px-4 py-2 rounded-xl text-sm font-semibold text-[#176b3a] hover:bg-[#eefaf2] transition"
  >
    Weather
  </Link>

  <Link
    href="/ai-analysis"
    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#087f3e] shadow-lg"
  >
    AI Analysis
  </Link>

</div>

        </nav>

        {/* =================================================
            HEADER
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
              AGRICULTURAL INPUTS
          ================================================= */}

          <div className="animate-card-in rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-green-900/10 backdrop-blur-xl lg:col-span-3 md:p-8">

            <SectionHeading
              eyebrow="01 • Agricultural Context"
              title="Field Conditions"
              description="Provide the soil, environment, location, crop and historical context used by the AI models."
            />

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-8"
            >

              {/* SOIL */}

              <SubHeading title="Soil Conditions" />

              <div className="mt-4 grid gap-4 sm:grid-cols-3">

                <InputField
                  label="Nitrogen"
                  value={form.N}
                  unit="N"
                  type="number"
                  step="0.1"
                  onChange={(value) =>
                    handleChange(
                      "N",
                      value
                    )
                  }
                />

                <InputField
                  label="Phosphorus"
                  value={form.P}
                  unit="P"
                  type="number"
                  step="0.1"
                  onChange={(value) =>
                    handleChange(
                      "P",
                      value
                    )
                  }
                />

                <InputField
                  label="Potassium"
                  value={form.K}
                  unit="K"
                  type="number"
                  step="0.1"
                  onChange={(value) =>
                    handleChange(
                      "K",
                      value
                    )
                  }
                />

                <InputField
                  label="Soil pH"
                  value={form.ph}
                  unit="pH"
                  type="number"
                  step="0.1"
                  onChange={(value) =>
                    handleChange(
                      "ph",
                      value
                    )
                  }
                />

                <InputField
                  label="Rainfall"
                  value={form.rainfall}
                  unit="mm"
                  type="number"
                  step="0.1"
                  onChange={(value) =>
                    handleChange(
                      "rainfall",
                      value
                    )
                  }
                />

              </div>

              {/* WEATHER */}

              <div className="mt-8">

                <SubHeading title="Environmental Conditions" />

                <div className="mt-4 grid gap-4 sm:grid-cols-2">

                  <WeatherInput
                    label="Temperature"
                    value={
                      form.temperature
                    }
                    unit="°C"
                    loading={
                      weatherLoading
                    }
                    onChange={(value) =>
                      handleChange(
                        "temperature",
                        value
                      )
                    }
                  />

                  <WeatherInput
                    label="Humidity"
                    value={
                      form.humidity
                    }
                    unit="%"
                    loading={
                      weatherLoading
                    }
                    onChange={(value) =>
                      handleChange(
                        "humidity",
                        value
                      )
                    }
                  />

                </div>

                {weather && (
                  <div className="weather-status mt-4">

                    <span className="weather-pulse" />

                    <span>
                      Live weather loaded for{" "}
                      <strong>
                        {form.district_name},{" "}
                        {form.state_name}
                      </strong>
                    </span>

                    <span className="ml-auto font-bold">

                      {
                        weather.recent_precipitation ??
                        0
                      }{" "}
                      {
                        weather.precipitation_unit
                      }{" "}
                      recent

                    </span>

                  </div>
                )}

                {weatherError && (
                  <p className="mt-3 text-xs font-medium text-red-500">
                    {weatherError}
                  </p>
                )}

              </div>

              {/* LOCATION */}

              <div className="mt-8">

                <SubHeading title="Location & Crop" />

                <div className="mt-4 grid gap-4 sm:grid-cols-2">

                  <SelectField
                    label="State"
                    value={
                      form.state_name
                    }
                    options={states}
                    onChange={
                      handleStateChange
                    }
                  />

                  <SelectField
                    label="District"
                    value={
                      form.district_name
                    }
                    options={
                      districts
                    }
                    onChange={(value) =>
                      handleChange(
                        "district_name",
                        value
                      )
                    }
                  />

                  <SelectField
                    label="Crop Type"
                    value={
                      form.crop_type
                    }
                    options={
                      cropTypes.length >
                      0
                        ? cropTypes
                        : [
                            "Cereals",
                            "Pulses",
                            "Oilseeds",
                            "Fruits",
                            "Vegetables",
                            "Commercial Crops",
                          ]
                    }
                    onChange={
                      handleCropTypeChange
                    }
                  />

                  <SelectField
                    label="Crop"
                    value={
                      form.crop_name
                    }
                    options={
                      availableCrops
                    }
                    onChange={(value) =>
                      handleChange(
                        "crop_name",
                        value
                      )
                    }
                  />

                  <SelectField
                    label="Season"
                    value={
                      form.season
                    }
                    options={[
                      "Kharif",
                      "Rabi",
                      "Whole Year",
                      "Summer",
                      "Winter",
                      "Autumn",
                      "Total",
                    ]}
                    onChange={(value) =>
                      handleChange(
                        "season",
                        value
                      )
                    }
                  />

                  <InputField
                    label="Agricultural Year"
                    value={
                      form.year_start
                    }
                    unit="year"
                    type="number"
                    onChange={(value) =>
                      handleChange(
                        "year_start",
                        value
                      )
                    }
                  />

                  <InputField
                    label="Cultivated Area"
                    value={
                      form.area
                    }
                    unit="ha"
                    type="number"
                    step="0.01"
                    onChange={(value) =>
                      handleChange(
                        "area",
                        value
                      )
                    }
                  />

                </div>

              </div>

              {/* HISTORICAL YIELD */}

              <div className="mt-8">

                <SubHeading title="Historical Yield Context" />

                <div className="historical-card mt-4">

                  <div className="historical-icon">
                    <TrendIcon />
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="text-[10px] font-black uppercase tracking-wider text-green-600">
                      Previous-Year Yield
                    </p>

                    {previousYieldLoading ? (
                      <p className="mt-1 text-sm font-bold text-gray-500">
                        Retrieving historical data...
                      </p>
                    ) : previousYield ? (
                      <>
                        <p className="mt-1 text-lg font-black text-gray-900">
                          {
                            previousYield.previous_yield
                          }{" "}
                          {
                            previousYield.yield_unit
                          }
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Historical year:{" "}
                          {
                            previousYield.previous_year_label
                          }
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-sm font-bold text-red-500">
                        Historical yield unavailable
                      </p>
                    )}

                  </div>

                  {previousYield && (
                    <span className="verified-badge">
                      <CheckIcon />
                      Dataset
                    </span>
                  )}

                </div>

                {previousYieldError && (
                  <p className="mt-3 text-xs font-medium text-red-500">
                    {previousYieldError}
                  </p>
                )}

              </div>

              {/* CROP INFORMATION */}

              {cropInfo && (
                <div className="mt-8 rounded-3xl border border-green-100 bg-green-50/60 p-5">

                  <div className="flex items-center gap-3">

                    <div className="section-icon">
                      <LeafIcon />
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-green-600">
                        Crop Information
                      </p>

                      <h3 className="mt-1 text-lg font-black text-gray-900">
                        {cropInfo.crop}
                      </h3>
                    </div>

                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">

                    {"suitableTemperature" in
                      cropInfo &&
                      cropInfo.suitableTemperature && (
                        <div className="rounded-xl bg-white p-3">

                          <p className="text-xs font-semibold text-gray-500">
                            Suitable Temperature
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-900">
                            {
                              cropInfo
                                .suitableTemperature
                                .min
                            }
                            {" – "}
                            {
                              cropInfo
                                .suitableTemperature
                                .max
                            }
                            °C
                          </p>

                        </div>
                      )}

                    {"waterRequirement" in
                      cropInfo &&
                      cropInfo.waterRequirement && (
                        <div className="rounded-xl bg-white p-3">

                          <p className="text-xs font-semibold text-gray-500">
                            Water Requirement
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-900">
                            {
                              cropInfo.waterRequirement
                            }
                          </p>

                        </div>
                      )}

                    {"drainage" in
                      cropInfo &&
                      cropInfo.drainage && (
                        <div className="rounded-xl bg-white p-3">

                          <p className="text-xs font-semibold text-gray-500">
                            Drainage
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-900">
                            {
                              cropInfo.drainage
                            }
                          </p>

                        </div>
                      )}

                  </div>

                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={
                  loading ||
                  previousYieldLoading ||
                  !previousYield
                }
                className="ai-primary-button mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-green-700 via-emerald-600 to-green-600 px-6 py-4 font-black text-white shadow-xl shadow-green-700/20 disabled:cursor-not-allowed disabled:opacity-70"
              >

                {loading ? (
                  <>
                    <span className="ai-button-spinner" />
                    AI Analysis Running
                  </>
                ) : previousYieldLoading ? (
                  <>
                    <MiniLoader />
                    Retrieving Historical Yield
                  </>
                ) : (
                  <>
                    <SparkIcon />
                    Run Complete AI Analysis
                    <ArrowIcon />
                  </>
                )}

              </button>

            </form>

          </div>

          {/* =================================================
              IMAGE INPUT
          ================================================= */}

          <div className="animate-card-in-delay rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-green-900/10 backdrop-blur-xl lg:col-span-2 md:p-8">

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
              onDrop={
                handleDrop
              }
              className={`upload-zone mt-8 ${
                dragActive
                  ? "upload-zone-active"
                  : ""
              }`}
            >

              <input
                id="plant-image"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={
                  handleFileChange
                }
                className="hidden"
              />

              {!selectedFile ? (
                <label
                  htmlFor="plant-image"
                  className="relative z-10 flex cursor-pointer flex-col items-center justify-center px-6 py-12 text-center"
                >

                  <div className="upload-icon">
                    <UploadIcon />
                  </div>

                  <p className="mt-6 text-sm font-black text-gray-800">
                    Upload plant leaf image
                  </p>

                  <p className="mt-2 text-xs leading-5 text-gray-400">
                    PNG, JPG or JPEG
                  </p>

                  <span className="mt-5 rounded-xl bg-green-700 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-green-700/20">
                    Choose Image
                  </span>

                </label>
              ) : (
                <div className="relative z-10 p-4">

                  <div className="scan-preview">

                    <img
                      src={previewUrl}
                      alt="Selected plant leaf"
                      className="h-72 w-full object-cover"
                    />

                    <div className="scan-corners" />

                    {loading && (
                      <div className="scan-line" />
                    )}

                  </div>

                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 p-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-green-700 shadow-sm">
                      <ImageIcon />
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="text-xs font-black text-gray-800">
                        Selected image
                      </p>

                      <p className="truncate text-xs text-gray-500">
                        {selectedFile.name}
                      </p>

                    </div>

                    <label
                      htmlFor="plant-image"
                      className="cursor-pointer rounded-xl bg-white px-3 py-2 text-[10px] font-black text-green-700 shadow-sm"
                    >
                      Change
                    </label>

                  </div>

                </div>
              )}

            </div>

            {/* AI MODEL */}

            <div className="mt-7 rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-green-950 p-6 text-white shadow-xl">

              <div className="flex items-center justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-green-300">
                  <BrainIcon />
                </div>

                <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-green-300">
                  Model Ready
                </span>

              </div>

              <h3 className="mt-5 text-xl font-black">
                MobileNetV2
              </h3>

              <p className="mt-2 text-xs leading-5 text-gray-300">
                Transfer-learning computer vision
                model trained for plant disease
                classification.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">

                <DarkMetric
                  label="Task"
                  value="Classification"
                />

                <DarkMetric
                  label="Classes"
                  value="38 Diseases"
                />

                <DarkMetric
                  label="Input"
                  value="224 × 224"
                />

                <DarkMetric
                  label="Architecture"
                  value="MobileNetV2"
                />

              </div>

            </div>

            {/* PIPELINE */}

            <div className="mt-7">

              <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                AI Pipeline
              </p>

              <div className="mt-4 space-y-3">

                <PipelineStep
                  number="01"
                  title="Image Validation"
                  description="Validate and prepare the uploaded image"
                />

                <PipelineStep
                  number="02"
                  title="Vision Analysis"
                  description="MobileNetV2 processes the leaf image"
                />

                <PipelineStep
                  number="03"
                  title="Disease Classification"
                  description="Generate disease probabilities"
                />

                <PipelineStep
                  number="04"
                  title="Decision Support"
                  description="Combine model outputs with farm context"
                />

              </div>

            </div>

          </div>

        </section>

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
                {
                  analysisSteps[
                    analysisStep
                  ]
                }
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

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                  Analysis Complete
                </p>

                <h2 className="mt-2 text-3xl font-black text-gray-950 sm:text-4xl">
                  AI Analysis Results
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Results generated from the integrated agricultural AI pipeline.
                </p>

              </div>

              <div
                className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-black ${
                  result.recommendation
                    .overall_status ===
                  "attention_required"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-green-100 text-green-800"
                }`}
              >

                {result.recommendation
                  .overall_status ===
                "attention_required" ? (
                  <WarningIcon />
                ) : (
                  <CheckIcon />
                )}

                {formatStatus(
                  result.recommendation
                    .overall_status
                )}

              </div>

            </div>

            {/* TOP RESULT CARDS */}

            <div className="grid gap-6 md:grid-cols-3">

              <ResultCard>

                <ResultHeader
                  icon={
                    <LeafIcon />
                  }
                  eyebrow="01 • Crop AI"
                  title="Crop Recommendation"
                />

                <div className="mt-6">

                  <p className="text-3xl font-black capitalize text-gray-950">
                    {
                      result.crop
                        .recommended_crop
                    }
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {
                      result.crop
                        .message
                    }
                  </p>

                  <div className="mt-5">

                    <div className="mb-2 flex justify-between">

                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Confidence
                      </span>

                      <span className="text-sm font-black text-green-700">
                        {
                          result.crop
                            .confidence
                        }%
                      </span>

                    </div>

                    <ConfidenceBar
                      value={
                        result.crop
                          .confidence
                      }
                      color="from-green-500 to-emerald-600"
                    />

                  </div>

                </div>

              </ResultCard>

              <ResultCard>

                <ResultHeader
                  icon={
                    <ScanIcon />
                  }
                  eyebrow="02 • Vision AI"
                  title="Plant Disease"
                />

                <div className="mt-6">

                  <p className="text-xl font-black leading-7 text-gray-950">
                    {
                      formatDiseaseName(
                        result.disease
                          .predicted_disease
                      )
                    }
                  </p>

                  <div className="mt-5">

                    <div className="mb-2 flex justify-between">

                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Confidence
                      </span>

                      <span className="text-sm font-black text-green-700">
                        {
                          result.disease
                            .confidence
                        }%
                      </span>

                    </div>

                    <ConfidenceBar
                      value={
                        result.disease
                          .confidence
                      }
                      color="from-emerald-500 to-green-600"
                    />

                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                    Confidence Level:{" "}
                    {
                      result.disease
                        .confidence_level
                    }
                  </p>

                </div>

              </ResultCard>

              <ResultCard>

                <ResultHeader
                  icon={
                    <ChartIcon />
                  }
                  eyebrow="03 • Yield ML"
                  title="Yield Prediction"
                />

                <div className="mt-7">

                  <p className="text-5xl font-black tracking-tight text-green-700">
                    {
                      result.yield
                        .predicted_yield
                    }
                  </p>

                  <p className="mt-2 text-xs font-black uppercase tracking-wider text-gray-400">
                    {
                      result.yield
                        .yield_unit
                    }
                  </p>

                  <div className="mt-6 rounded-2xl bg-green-50 p-4">

                    <p className="text-xs font-bold text-green-800">
                      Historical context
                    </p>

                    <p className="mt-1 text-xs text-green-700">
                      Previous year:{" "}
                      {
                        result
                          .yield_metadata
                          ?.previous_yield ??
                        "—"
                      }{" "}
                      t/ha
                    </p>

                  </div>

                </div>

              </ResultCard>

            </div>

            {/* TOP CROP RECOMMENDATIONS */}

            {result.crop
              .top_recommendations &&
              result.crop
                .top_recommendations
                .length >
                0 && (
                <div className="mt-6 rounded-3xl border border-green-100 bg-white p-6 shadow-xl shadow-green-900/5 md:p-8">

                  <ResultHeader
                    icon={
                      <LayersIcon />
                    }
                    eyebrow="Crop Ranking"
                    title="Top Crop Recommendations"
                  />

                  <div className="mt-6 grid gap-3">

                    {result.crop
                      .top_recommendations
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <PredictionRow
                            key={`${item.crop}-${index}`}
                            rank={
                              index + 1
                            }
                            name={
                              item.crop
                            }
                            confidence={
                              item.confidence
                            }
                          />
                        )
                      )}

                  </div>

                </div>
              )}

            {/* DISEASE PREDICTIONS */}

            {result.disease
              .top_predictions &&
              result.disease
                .top_predictions
                .length >
                0 && (
                <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-green-900/5 md:p-8">

                  <ResultHeader
                    icon={
                      <ScanIcon />
                    }
                    eyebrow="Vision Ranking"
                    title="Top Disease Predictions"
                  />

                  <div className="mt-6 grid gap-3">

                    {result.disease
                      .top_predictions
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <PredictionRow
                            key={`${item.disease}-${index}`}
                            rank={
                              index + 1
                            }
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

            {/* FEATURE IMPORTANCE */}

            {result.crop
              .feature_importance &&
              result.crop
                .feature_importance
                .length >
                0 && (
                <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-green-900/5 md:p-8">

                  <ResultHeader
                    icon={
                      <ChartIcon />
                    }
                    eyebrow="Model Interpretation"
                    title="AI Factors"
                  />

                  <p className="mt-3 text-sm text-gray-500">
                    Global Random Forest feature importance for the crop recommendation model.
                  </p>

                  <div className="mt-6 space-y-4">

                    {result.crop
                      .feature_importance
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              item.feature
                            }
                            className="animate-list-item"
                            style={{
                              animationDelay: `${
                                index *
                                80
                              }ms`,
                            }}
                          >

                            <div className="mb-2 flex items-center justify-between">

                              <span className="text-xs font-bold text-gray-600">
                                {formatFeatureName(
                                  item.feature
                                )}
                              </span>

                              <span className="text-xs font-black text-green-700">
                                {
                                  item.importance
                                }%
                              </span>

                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-gray-100">

                              <div
                                className="confidence-bar h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600"
                                style={{
                                  width: `${Math.min(
                                    item.importance,
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

            {/* RECOMMENDATIONS + ALERTS */}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">

              <div className="rounded-3xl border border-green-100 bg-white p-6 shadow-xl shadow-green-900/5 md:p-8">

                <ResultHeader
                  icon={
                    <CheckIcon />
                  }
                  eyebrow="Decision Support"
                  title="Recommendations"
                />

                <div className="mt-6 space-y-3">

                  {result
                    .recommendation
                    .recommendations
                    .length >
                  0 ? (
                    result
                      .recommendation
                      .recommendations
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={`${item}-${index}`}
                            className="recommendation-row animate-list-item"
                            style={{
                              animationDelay: `${
                                index *
                                100
                              }ms`,
                            }}
                          >

                            <div className="recommendation-check">
                              <CheckIcon />
                            </div>

                            <p>
                              {item}
                            </p>

                          </div>
                        )
                      )
                  ) : (
                    <p className="text-sm text-gray-500">
                      No additional recommendations were generated.
                    </p>
                  )}

                </div>

              </div>

              <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-xl shadow-amber-900/5 md:p-8">

                <ResultHeader
                  icon={
                    <WarningIcon />
                  }
                  eyebrow="Safety & Validation"
                  title="Alerts"
                />

                <div className="mt-6 space-y-3">

                  {result
                    .recommendation
                    .alerts
                    .length >
                  0 ? (
                    result
                      .recommendation
                      .alerts
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={`${item}-${index}`}
                            className="alert-row animate-list-item"
                            style={{
                              animationDelay: `${
                                index *
                                100
                              }ms`,
                            }}
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

            </div>

            {/* DISCLAIMER */}

            <div className="mt-6 rounded-2xl border border-gray-200 bg-white/80 p-5">

              <div className="flex gap-3">

                <InfoIcon />

                <p className="text-xs leading-5 text-gray-500">
                  AI predictions are decision-support
                  outputs and should not be treated as
                  a substitute for professional agricultural
                  advice, field inspection, or local expert
                  verification.
                </p>

              </div>

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
                analysis to see the combined AI results.
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

        <h2 className="mt-2 text-2xl font-black text-gray-950">
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

      <h3 className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
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
  value,
  unit,
  type = "text",
  step,
  onChange,
}: {
  label: string;
  value: string;
  unit: string;
  type?: string;
  step?: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
        {label}
      </span>

      <div className="relative">

        <input
          type={type}
          value={value}
          step={step}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3.5 pr-16 text-sm font-semibold text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
        />

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-white px-2 py-1 text-[10px] font-black text-gray-500 shadow-sm">
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
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3.5 text-sm font-semibold text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
      >

        {options.length ===
        0 ? (
          <option value="">
            No options available
          </option>
        ) : (
          options.map(
            (option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            )
          )
        )}

      </select>

    </label>
  );
}

/* =========================================================
   WEATHER INPUT
========================================================= */

function WeatherInput({
  label,
  value,
  unit,
  loading,
  onChange,
}: {
  label: string;
  value: string;
  unit: string;
  loading: boolean;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">

      <div className="mb-2 flex items-center justify-between">

        <span className="text-xs font-black uppercase tracking-wider text-gray-500">
          {label}
        </span>

        <span className="text-[10px] font-black uppercase tracking-wider text-green-600">
          {loading
            ? "Updating..."
            : "Auto"}
        </span>

      </div>

      <div className="relative">

        <input
          type="number"
          value={value}
          step="0.1"
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
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
   DARK METRIC
========================================================= */

function DarkMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">

      <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-black text-white">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   HISTORICAL CARD
========================================================= */

/* =========================================================
   PIPELINE STEP
========================================================= */

function PipelineStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-[10px] font-black text-green-700">
        {number}
      </div>

      <div>

        <p className="text-sm font-black text-gray-800">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-gray-400">
          {description}
        </p>

      </div>

    </div>
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
   CONFIDENCE BAR
========================================================= */

function ConfidenceBar({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">

      <div
        className={`confidence-bar h-full rounded-full bg-gradient-to-r ${color}`}
        style={{
          width: `${Math.min(
            value,
            100
          )}%`,
        }}
      />

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
      strokeWidth="1.7"
      className="h-5 w-5"
    >
      <path d="m12 3 1.4 5.1L18 10l-4.6 1.9L12 17l-1.4-5.1L6 10l4.6-1.9L12 3Z" />
      <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" />
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

function ScanIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-7 w-7"
    >
      <path d="M4 8V5a1 1 0 0 1 1-1h3" />
      <path d="M16 4h3a1 1 0 0 1 1 1v3" />
      <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
      <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
      <rect
        x="8"
        y="8"
        width="8"
        height="8"
        rx="1.5"
      />
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
      className="h-7 w-7"
    >
      <path d="M9 4.5A3 3 0 0 0 6 7.5v.2A3.3 3.3 0 0 0 4 11a3.3 3.3 0 0 0 2 3.1v.4a3 3 0 0 0 3 3h1V4.5H9Z" />
      <path d="M15 4.5A3 3 0 0 1 18 7.5v.2A3.3 3.3 0 0 1 20 11a3.3 3.3 0 0 1-2 3.1v.4a3 3 0 0 1-3 3h-1V4.5h1Z" />
      <path d="M8 9h2M7 13h3M14 9h2M14 13h3" />
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

function ImageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-5 w-5"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
      />
      <circle
        cx="8.5"
        cy="9"
        r="1.5"
      />
      <path d="m4 17 5-5 4 4 2-2 5 5" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M4 18 10 12l4 3 6-8" />
      <path d="M16 7h4v4" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-5 w-5"
    >
      <path d="m12 3 8 4-8 4-8-4 8-4Z" />
      <path d="m4 12 8 4 8-4" />
      <path d="m4 16 8 4 8-4" />
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

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M12 3 21 20H3L12 3Z" />
      <path d="M12 9v5" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5 shrink-0 text-blue-600"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="M12 10v6" />
      <path d="M12 7.5h.01" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function MiniLoader() {
  return (
    <span className="mini-spinner" />
  );
}