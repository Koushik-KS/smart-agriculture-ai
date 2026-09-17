"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type AnalysisResult = {
  crop: {
    recommended_crop: string;
    confidence: number;
    confidence_level: string;
    message: string;
  };

  disease: {
    predicted_disease: string;
    confidence: number;
    confidence_level: string;
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
};

type WeatherData = {
  temperature: number | null;
  humidity: number | null;
  rainfall: number | null;
  temperature_unit: string;
  humidity_unit: string;
  rainfall_unit: string;
};

export default function AIAnalysisPage() {
  const [form, setForm] = useState({
    N: "90",
    P: "40",
    K: "40",
    temperature: "25",
    humidity: "80",
    ph: "6.5",
    rainfall: "200",
    year_start: "2024",
    state_name: "Karnataka",
    district_name: "Haveri",
    crop_name: "Rice",
    crop_type: "Cereals",
    season: "Kharif",
    area: "100",
    previous_yield: "2.1",
  });

  const [weather, setWeather] =
    useState<WeatherData | null>(null);

  const [weatherLoading, setWeatherLoading] =
    useState(false);

  const [weatherError, setWeatherError] =
    useState("");

  const [file, setFile] =
    useState<File | null>(null);

  const [result, setResult] =
    useState<AnalysisResult | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================
  // Fetch Weather Using State + District
  // ==========================================

  const fetchWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError("");

    try {
      const state =
        form.state_name.trim();

      const district =
        form.district_name.trim();

      if (!state || !district) {
        throw new Error(
          "Please enter both state and district."
        );
      }

      // ======================================
      // STEP 1: Geocode location
      // ======================================

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

      if (!geocodeResponse.ok) {
        throw new Error(
          location.message ||
            "Location not found."
        );
      }

      // ======================================
      // STEP 2: Fetch weather
      // ======================================

      const weatherResponse =
        await fetch(
          `http://localhost:5000/api/weather?latitude=${encodeURIComponent(
            location.latitude
          )}&longitude=${encodeURIComponent(
            location.longitude
          )}`
        );

      const data =
        await weatherResponse.json();

      if (!weatherResponse.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch weather."
        );
      }

      // ======================================
      // STEP 3: Store weather
      // ======================================

      setWeather(data);

      // ======================================
      // STEP 4: Update form automatically
      // ======================================

      setForm((previous) => ({
        ...previous,

        temperature:
          data.temperature !== null
            ? String(data.temperature)
            : previous.temperature,

        humidity:
          data.humidity !== null
            ? String(data.humidity)
            : previous.humidity,

        rainfall:
          data.rainfall !== null
            ? String(data.rainfall)
            : previous.rainfall,
      }));

    } catch (err) {

      setWeather(null);

      setWeatherError(
        err instanceof Error
          ? err.message
          : "Failed to fetch weather."
      );

    } finally {

      setWeatherLoading(false);

    }
  }, [
    form.state_name,
    form.district_name,
  ]);

  // ==========================================
  // Fetch weather when page loads
  // ==========================================

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  // ==========================================
  // Form Change
  // ==========================================

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ==========================================
  // File Change
  // ==========================================

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (
      e.target.files &&
      e.target.files[0]
    ) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  // ==========================================
  // Submit AI Analysis
  // ==========================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!file) {
      setError(
        "Please upload a plant leaf image."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

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

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          "http://localhost:5000/api/ai-analysis",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "AI analysis failed."
        );
      }

      setResult(data);

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );

    } finally {

      setLoading(false);

    }
  };

  // ==========================================
  // Format Disease
  // ==========================================

  const formatDiseaseName = (
    name: string
  ) => {
    return name
      .replaceAll(
        "___",
        " - "
      )
      .replaceAll(
        "_",
        " "
      );
  };

  // ==========================================
  // Format Status
  // ==========================================

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
        (char) =>
          char.toUpperCase()
      );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* =====================================
            HEADER
        ====================================== */}

        <div className="mb-10 text-center">

          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">

            <span>🌱</span>

            <span>
              AI-Powered Agriculture
            </span>

          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Smart Agriculture AI
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            Analyze soil conditions, plant health
            and historical agricultural data using
            multiple AI models.
          </p>

        </div>


        {/* =====================================
            FORM
        ====================================== */}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl"
        >

          {/* Form Header */}

          <div className="border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-6 text-white sm:px-8">

            <h2 className="text-2xl font-bold">
              Agricultural Information
            </h2>

            <p className="mt-1 text-sm text-green-50">
              Provide the field information
              required for AI analysis.
            </p>

          </div>


          <div className="p-6 sm:p-8">

            {/* =================================
                SOIL & WEATHER
            ================================== */}

            <SectionHeader
              icon="🌱"
              title="Soil & Weather Conditions"
              description="Soil values are entered manually. Weather data is automatically retrieved using the selected state and district."
            />


            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <InputField
                label="Nitrogen (N)"
                name="N"
                value={form.N}
                onChange={handleChange}
                type="number"
              />

              <InputField
                label="Phosphorus (P)"
                name="P"
                value={form.P}
                onChange={handleChange}
                type="number"
              />

              <InputField
                label="Potassium (K)"
                name="K"
                value={form.K}
                onChange={handleChange}
                type="number"
              />


              <WeatherInput
                label="Temperature (°C)"
                name="temperature"
                value={form.temperature}
                onChange={handleChange}
                loading={weatherLoading}
              />


              <WeatherInput
                label="Humidity (%)"
                name="humidity"
                value={form.humidity}
                onChange={handleChange}
                loading={weatherLoading}
              />


              <InputField
                label="Soil pH"
                name="ph"
                value={form.ph}
                onChange={handleChange}
                type="number"
                step="0.1"
              />


              <WeatherInput
                label="Rainfall (mm)"
                name="rainfall"
                value={form.rainfall}
                onChange={handleChange}
                loading={weatherLoading}
              />

            </div>


            {/* Weather Status */}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                {weather && (
                  <div>

                    <p className="text-sm font-medium text-green-700">
                      🌤️ Weather data loaded automatically
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Location:{" "}
                      {form.district_name},{" "}
                      {form.state_name}
                    </p>

                  </div>
                )}

                {weatherError && (
                  <p className="text-sm font-medium text-red-600">
                    ⚠️ {weatherError}
                  </p>
                )}

              </div>


              <button
                type="button"
                onClick={fetchWeather}
                disabled={weatherLoading}
                className="w-fit rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {weatherLoading
                  ? "Updating Weather..."
                  : "↻ Refresh Weather"}

              </button>

            </div>


            {/* =================================
                LOCATION & CROP
            ================================== */}

            <div className="mt-10">

              <SectionHeader
                icon="📍"
                title="Location & Crop Information"
                description="Provide the agricultural location and crop details."
              />


              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                <InputField
                  label="Year"
                  name="year_start"
                  value={form.year_start}
                  onChange={handleChange}
                  type="number"
                />

                <InputField
                  label="State"
                  name="state_name"
                  value={form.state_name}
                  onChange={handleChange}
                />

                <InputField
                  label="District"
                  name="district_name"
                  value={form.district_name}
                  onChange={handleChange}
                />

                <InputField
                  label="Crop"
                  name="crop_name"
                  value={form.crop_name}
                  onChange={handleChange}
                />

                <InputField
                  label="Crop Type"
                  name="crop_type"
                  value={form.crop_type}
                  onChange={handleChange}
                />

                <InputField
                  label="Season"
                  name="season"
                  value={form.season}
                  onChange={handleChange}
                />

              </div>

            </div>


            {/* =================================
                YIELD
            ================================== */}

            <div className="mt-10">

              <SectionHeader
                icon="📊"
                title="Yield Information"
                description="Historical information used by the yield prediction model."
              />


              <div className="grid gap-5 sm:grid-cols-2">

                <InputField
                  label="Area (Hectares)"
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  type="number"
                  step="0.01"
                />

                <InputField
                  label="Previous Yield (Tonnes/Ha)"
                  name="previous_yield"
                  value={form.previous_yield}
                  onChange={handleChange}
                  type="number"
                  step="0.01"
                />

              </div>

            </div>


            {/* =================================
                DISEASE IMAGE
            ================================== */}

            <div className="mt-10">

              <SectionHeader
                icon="🦠"
                title="Plant Disease Detection"
                description="Upload a clear image of the plant leaf."
              />


              <label
                htmlFor="plant-image"
                className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-green-300 bg-green-50/50 px-6 py-10 text-center transition hover:border-green-500 hover:bg-green-50"
              >

                <div className="mb-4 text-5xl">
                  📷
                </div>

                <p className="text-lg font-semibold text-gray-800">
                  {file
                    ? "Change plant image"
                    : "Upload plant leaf image"}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  PNG, JPG or JPEG images are supported
                </p>

                <span className="mt-5 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition group-hover:bg-green-700">
                  Choose Image
                </span>

                <input
                  id="plant-image"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />

              </label>


              {file && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-xl">
                    🖼️
                  </div>

                  <div className="min-w-0">

                    <p className="text-sm font-semibold text-gray-800">
                      Selected image
                    </p>

                    <p className="truncate text-sm text-gray-500">
                      {file.name}
                    </p>

                  </div>

                </div>
              )}

            </div>


            {/* =================================
                ERROR
            ================================== */}

            {error && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">

                <span className="text-xl">
                  ⚠️
                </span>

                <div>

                  <p className="font-semibold">
                    Analysis Error
                  </p>

                  <p className="mt-1 text-sm">
                    {error}
                  </p>

                </div>

              </div>
            )}


            {/* =================================
                SUBMIT
            ================================== */}

            <button
              type="submit"
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:from-green-700 hover:to-emerald-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />

                  Running AI Analysis...
                </>
              ) : (
                <>
                  <span>🤖</span>

                  Run AI Analysis
                </>
              )}

            </button>

          </div>

        </form>


        {/* =====================================
            RESULTS
        ====================================== */}

        {result && (
          <div className="mt-10">

            {/* Result Header */}

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

              <div>

                <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
                  Analysis Complete
                </p>

                <h2 className="mt-1 text-3xl font-extrabold text-gray-900">
                  AI Analysis Results
                </h2>

                <p className="mt-1 text-gray-600">
                  Results generated from the integrated AI pipeline.
                </p>

              </div>


              <div
                className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                  result.recommendation.overall_status ===
                  "attention_required"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >

                <span>
                  {result.recommendation.overall_status ===
                  "attention_required"
                    ? "⚠️"
                    : "✅"}
                </span>

                {formatStatus(
                  result.recommendation.overall_status
                )}

              </div>

            </div>


            {/* Result Cards */}

            <div className="grid gap-6 lg:grid-cols-3">

              <ResultCard
                icon="🌾"
                title="Crop Recommendation"
                value={
                  result.crop.recommended_crop
                }
                details={`Confidence: ${result.crop.confidence}%`}
                level={
                  result.crop.confidence_level
                }
              />


              <ResultCard
                icon="🦠"
                title="Plant Disease"
                value={formatDiseaseName(
                  result.disease.predicted_disease
                )}
                details={`Confidence: ${result.disease.confidence}%`}
                level={
                  result.disease.confidence_level
                }
              />


              <YieldResultCard
                value={
                  result.yield.predicted_yield
                }
                unit={
                  result.yield.yield_unit
                }
              />

            </div>


            {/* Recommendation Panel */}

            <div
              className={`mt-6 overflow-hidden rounded-3xl border shadow-lg ${
                result.recommendation.overall_status ===
                "attention_required"
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-green-200 bg-green-50"
              }`}
            >

              <div className="border-b border-black/5 px-6 py-5 sm:px-8">

                <div className="flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                    🤖
                  </div>

                  <div>

                    <h3 className="text-2xl font-bold text-gray-900">
                      AI Recommendation
                    </h3>

                    <p className="text-sm text-gray-600">
                      Combined interpretation of the AI outputs
                    </p>

                  </div>

                </div>

              </div>


              <div className="p-6 sm:p-8">

                {/* Status */}

                <div className="mb-6">

                  <p className="text-sm font-medium text-gray-500">
                    Overall Status
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-4 py-2 text-sm font-bold ${
                      result.recommendation.overall_status ===
                      "attention_required"
                        ? "bg-yellow-200 text-yellow-900"
                        : "bg-green-200 text-green-900"
                    }`}
                  >

                    {result.recommendation.overall_status ===
                    "attention_required"
                      ? "⚠️ Attention Required"
                      : "✅ Normal"}

                  </span>

                </div>


                {/* Alerts */}

                {result.recommendation.alerts.length >
                  0 && (

                  <div className="mb-6 rounded-2xl border border-red-200 bg-white p-5">

                    <div className="flex items-center gap-2">

                      <span className="text-xl">
                        ⚠️
                      </span>

                      <h4 className="text-lg font-bold text-red-700">
                        Alerts
                      </h4>

                    </div>


                    <ul className="mt-4 space-y-3">

                      {result.recommendation.alerts.map(
                        (alert, index) => (

                          <li
                            key={index}
                            className="flex gap-3 text-sm leading-6 text-gray-700"
                          >

                            <span className="mt-1 text-red-500">
                              ●
                            </span>

                            <span>
                              {alert}
                            </span>

                          </li>

                        )
                      )}

                    </ul>

                  </div>

                )}


                {/* Recommendations */}

                {result.recommendation.recommendations.length >
                  0 && (

                  <div className="rounded-2xl border border-green-200 bg-white p-5">

                    <div className="flex items-center gap-2">

                      <span className="text-xl">
                        💡
                      </span>

                      <h4 className="text-lg font-bold text-green-700">
                        Recommendations
                      </h4>

                    </div>


                    <ul className="mt-4 space-y-3">

                      {result.recommendation.recommendations.map(
                        (recommendation, index) => (

                          <li
                            key={index}
                            className="flex gap-3 text-sm leading-6 text-gray-700"
                          >

                            <span className="mt-1 text-green-600">
                              ✓
                            </span>

                            <span>
                              {recommendation}
                            </span>

                          </li>

                        )
                      )}

                    </ul>

                  </div>

                )}

              </div>

            </div>


            {/* Disclaimer */}

            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-center text-xs leading-5 text-gray-500">
              AI predictions are based on the supplied inputs
              and training data. They should be used as
              decision-support information and verified with
              local agricultural conditions and qualified
              agricultural experts.
            </div>

          </div>
        )}

      </div>

    </main>
  );
}


/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl">
        {icon}
      </div>

      <div>

        <h3 className="text-lg font-bold text-gray-900">
          {title}
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>

      </div>

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
  type = "text",
  step,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  type?: string;
  step?: string;
}) {
  return (
    <div>

      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-gray-700"
      >
        {label}
      </label>

      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
      />

    </div>
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
  loading,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  loading: boolean;
}) {
  return (
    <div>

      <div className="mb-2 flex items-center justify-between">

        <label
          htmlFor={name}
          className="text-sm font-semibold text-gray-700"
        >
          {label}
        </label>

        <span className="text-xs font-semibold text-green-600">
          {loading
            ? "Updating..."
            : "Auto"}
        </span>

      </div>

      <input
        id={name}
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        step="0.1"
        className="w-full rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
      />

    </div>
  );
}


/* =========================================================
   RESULT CARD
========================================================= */

function ResultCard({
  icon,
  title,
  value,
  details,
  level,
}: {
  icon: string;
  title: string;
  value: string;
  details: string;
  level: string;
}) {
  const levelStyle =
    level === "high"
      ? "bg-green-100 text-green-700"
      : level === "moderate"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  return (
    <div className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-xl">

      <div className="flex items-center justify-between">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
          {icon}
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${levelStyle}`}
        >
          {level}
        </span>

      </div>

      <p className="mt-5 text-sm font-semibold text-gray-500">
        {title}
      </p>

      <h3 className="mt-2 break-words text-2xl font-extrabold capitalize text-gray-900">
        {value}
      </h3>

      <p className="mt-3 text-sm text-gray-500">
        {details}
      </p>

    </div>
  );
}


/* =========================================================
   YIELD RESULT CARD
========================================================= */

function YieldResultCard({
  value,
  unit,
}: {
  value: number;
  unit: string;
}) {
  return (
    <div className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-xl">

      <div className="flex items-center justify-between">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
          📊
        </div>

        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase text-blue-700">
          Prediction
        </span>

      </div>

      <p className="mt-5 text-sm font-semibold text-gray-500">
        Yield Prediction
      </p>

      <h3 className="mt-2 text-3xl font-extrabold text-gray-900">
        {value}
      </h3>

      <p className="mt-3 text-sm text-gray-500">
        {unit}
      </p>

    </div>
  );
}