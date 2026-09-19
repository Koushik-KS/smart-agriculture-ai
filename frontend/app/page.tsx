"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type FormData = {
  N: string;
  P: string;
  K: string;
  temperature: string;
  humidity: string;
  ph: string;
  rainfall: string;
};

type Result = {
  recommended_crop: string;
  confidence: number;
  confidence_level: string;
  message: string;
};

const initialForm: FormData = {
  N: "",
  P: "",
  K: "",
  temperature: "",
  humidity: "",
  ph: "",
  rainfall: "",
};

const fields = [
  {
    key: "N",
    label: "Nitrogen",
    unit: "mg/kg",
    placeholder: "e.g. 90",
    icon: "nitrogen",
  },
  {
    key: "P",
    label: "Phosphorus",
    unit: "mg/kg",
    placeholder: "e.g. 40",
    icon: "phosphorus",
  },
  {
    key: "K",
    label: "Potassium",
    unit: "mg/kg",
    placeholder: "e.g. 40",
    icon: "potassium",
  },
  {
    key: "temperature",
    label: "Temperature",
    unit: "°C",
    placeholder: "e.g. 25",
    icon: "temperature",
  },
  {
    key: "humidity",
    label: "Humidity",
    unit: "%",
    placeholder: "e.g. 80",
    icon: "humidity",
  },
  {
    key: "ph",
    label: "Soil pH",
    unit: "pH",
    placeholder: "e.g. 6.5",
    icon: "ph",
  },
  {
    key: "rainfall",
    label: "Rainfall",
    unit: "mm",
    placeholder: "e.g. 200",
    icon: "rainfall",
  },
];

export default function Home() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key: string, value: string) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setResult(null);

    const values = Object.values(form);

    if (values.some((value) => value.trim() === "")) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/crop-recommendation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            N: Number(form.N),
            P: Number(form.P),
            K: Number(form.K),
            temperature: Number(form.temperature),
            humidity: Number(form.humidity),
            ph: Number(form.ph),
            rainfall: Number(form.rainfall),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to get recommendation."
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the AI service."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setResult(null);
    setError("");
  };

  return (
    <main className="min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="agri-glow agri-glow-one" />
        <div className="agri-glow agri-glow-two" />
        <div className="agri-glow agri-glow-three" />

        <div className="floating-particle particle-one" />
        <div className="floating-particle particle-two" />
        <div className="floating-particle particle-three" />
        <div className="floating-particle particle-four" />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Navigation */}
        <nav className="glass-nav mb-8 flex flex-col gap-4 rounded-2xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="group flex items-center gap-3"
          >
            <div className="brand-mark">
              <span className="brand-mark-line" />
              <span className="brand-mark-leaf" />
            </div>

            <div>
              <p className="text-lg font-black tracking-tight text-green-950">
                Smart Agriculture AI
              </p>

              <p className="text-xs font-semibold text-green-700">
                Intelligent farming platform
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="nav-active rounded-xl px-4 py-2.5 text-sm font-bold"
            >
              Crop Recommendation
            </Link>

            <Link
              href="/ai-analysis"
              className="nav-link rounded-xl px-4 py-2.5 text-sm font-bold"
            >
              AI Analysis
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="mb-10 text-center">
          <div className="animate-fade-up mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-green-700 shadow-sm backdrop-blur">
            <span className="status-dot" />
            AI-Powered Agriculture
          </div>

          <h1 className="animate-fade-up-delay text-4xl font-black tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
            Smarter Decisions.
            <span className="block bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 bg-clip-text text-transparent">
              Better Farming.
            </span>
          </h1>

          <p className="animate-fade-up-delay-2 mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            Use machine learning to identify the most suitable
            crop based on soil nutrients and environmental
            conditions.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <StatPill
              icon={<BrainIcon />}
              text="Machine Learning"
            />

            <StatPill
              icon={<PlantIcon />}
              text="Soil Intelligence"
            />

            <StatPill
              icon={<LightningIcon />}
              text="Instant Prediction"
            />
          </div>
        </section>

        {/* Main content */}
        <div className="grid gap-7 lg:grid-cols-5">
          {/* Input card */}
          <section className="animate-card-in rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-green-900/10 backdrop-blur-xl lg:col-span-3 md:p-8">
            <div className="mb-8 flex items-start gap-4">
              <div className="section-icon">
                <PlantIcon />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-600">
                  Input Data
                </p>

                <h2 className="mt-1 text-2xl font-black text-gray-950">
                  Crop Recommendation
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
                  Enter soil and environmental conditions to let
                  the trained AI model analyze the field.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                {fields.map((field, index) => (
                  <div
                    key={field.key}
                    className="animate-field-in"
                    style={{
                      animationDelay: `${index * 70}ms`,
                    }}
                  >
                    <label
                      htmlFor={field.key}
                      className="mb-2.5 flex items-center gap-2 text-sm font-bold text-gray-700"
                    >
                      <span className="field-icon">
                        <FieldIcon type={field.icon} />
                      </span>

                      {field.label}
                    </label>

                    <div className="input-shell group relative">
                      <input
                        id={field.key}
                        type="number"
                        step="any"
                        value={
                          form[
                            field.key as keyof FormData
                          ]
                        }
                        onChange={(event) =>
                          handleChange(
                            field.key,
                            event.target.value
                          )
                        }
                        placeholder={field.placeholder}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3.5 pr-20 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                      />

                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-white px-2 py-1 text-xs font-bold text-gray-400 shadow-sm">
                        {field.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="animate-shake mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                  <div className="error-icon">
                    !
                  </div>

                  <div>
                    <p className="font-bold">
                      Input Error
                    </p>

                    <p className="mt-1 text-sm">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={loading}
                  className="ai-primary-button group flex flex-1 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-green-700 via-emerald-600 to-green-600 px-6 py-4 font-bold text-white shadow-lg shadow-green-700/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="ai-spinner h-5 w-5 rounded-full" />
                      AI is analyzing...
                    </>
                  ) : (
                    <>
                      <SparkIcon />
                      Analyze & Recommend
                      <ArrowIcon />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-2xl border border-gray-200 bg-white px-6 py-4 font-bold text-gray-600 shadow-sm transition hover:-translate-y-1 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                >
                  Reset
                </button>
              </div>
            </form>
          </section>

          {/* Result card */}
          <section className="animate-card-in-delay rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-green-900/10 backdrop-blur-xl lg:col-span-2 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-600">
                  AI Output
                </p>

                <h2 className="mt-1 text-2xl font-black text-gray-950">
                  Recommendation
                </h2>
              </div>

              <div className="result-icon">
                <SparkIcon />
              </div>
            </div>

            {/* Empty */}
            {!result && !loading && (
              <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
                <div className="empty-orbit relative mb-7 flex h-28 w-28 items-center justify-center rounded-full bg-green-50">
                  <div className="absolute inset-2 rounded-full border border-dashed border-green-300 animate-spin-slow" />

                  <div className="empty-ai-core">
                    <PlantIcon />
                  </div>
                </div>

                <p className="text-lg font-extrabold text-gray-800">
                  Ready for analysis
                </p>

                <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                  Enter the agricultural conditions and let the
                  AI model generate a crop recommendation.
                </p>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
                <div className="ai-loader mb-7">
                  <div className="ai-loader-ring" />
                  <div className="ai-loader-ring ai-loader-ring-2" />

                  <div className="ai-loader-core">
                    <BrainIcon />
                  </div>
                </div>

                <p className="text-lg font-extrabold text-gray-800">
                  Analyzing field conditions
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Evaluating soil nutrients and environmental
                  conditions...
                </p>

                <div className="mt-6 flex items-center gap-2">
                  <span className="loading-dot" />
                  <span className="loading-dot delay-1" />
                  <span className="loading-dot delay-2" />
                </div>
              </div>
            )}

            {/* Result */}
            {result && !loading && (
              <div className="animate-result-reveal mt-8">
                <div className="result-highlight rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black uppercase tracking-wider text-green-700">
                      Recommended Crop
                    </p>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                      AI Generated
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-4">
                    <div className="crop-result-icon">
                      <PlantIcon />
                    </div>

                    <div>
                      <p className="text-4xl font-black capitalize text-green-800">
                        {result.recommended_crop}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Based on your supplied conditions
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confidence */}
                <div className="mt-7">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">
                      AI Confidence
                    </span>

                    <span className="text-xl font-black text-green-700">
                      {result.confidence}%
                    </span>
                  </div>

                  <div className="h-4 overflow-hidden rounded-full bg-gray-100 p-0.5">
                    <div
                      className="confidence-bar h-full rounded-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-700"
                      style={{
                        width: `${Math.min(
                          result.confidence,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Confidence level */}
                <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50/80 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-700">
                      Confidence Level
                    </p>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black capitalize ${
                        result.confidence_level === "high"
                          ? "bg-green-100 text-green-700"
                          : result.confidence_level ===
                              "moderate"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {result.confidence_level}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {result.message}
                  </p>
                </div>

                {/* Information */}
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                  <div className="info-icon">
                    i
                  </div>

                  <p className="text-xs leading-5 text-blue-800">
                    This recommendation is generated by a
                    machine learning model and should be treated
                    as decision-support information.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Feature cards */}
        <section className="animate-fade-up-delay-2 mt-8 grid gap-4 sm:grid-cols-3">
          <FeatureMiniCard
            icon={<BrainIcon />}
            title="Machine Learning"
            text="Trained Random Forest model"
          />

          <FeatureMiniCard
            icon={<PlantIcon />}
            title="7 Key Inputs"
            text="Soil and environmental factors"
          />

          <FeatureMiniCard
            icon={<LightningIcon />}
            title="Fast Results"
            text="AI prediction in seconds"
          />
        </section>

        {/* Footer */}
        <footer className="mt-10 pb-4 text-center">
          <p className="text-xs font-semibold text-gray-400">
            Smart Agriculture AI • Crop Recommendation Module
          </p>

          <p className="mt-1 text-[11px] text-gray-400">
            AI-powered decision support for agricultural analysis
          </p>
        </footer>
      </div>
    </main>
  );
}

/* =========================================================
   COMPONENTS
   ========================================================= */

function StatPill({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="stat-pill">
      <span className="flex h-5 w-5 items-center justify-center">
        {icon}
      </span>

      {text}
    </div>
  );
}

function FeatureMiniCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700 transition duration-300 group-hover:scale-110">
        {icon}
      </div>

      <div>
        <p className="text-sm font-extrabold text-gray-800">
          {title}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          {text}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   FIELD ICON
   ========================================================= */

function FieldIcon({
  type,
}: {
  type: string;
}) {
  if (
    type === "nitrogen" ||
    type === "phosphorus" ||
    type === "potassium"
  ) {
    return (
      <span className="text-[11px] font-black">
        {type === "nitrogen"
          ? "N"
          : type === "phosphorus"
            ? "P"
            : "K"}
      </span>
    );
  }

  if (type === "temperature") {
    return <TemperatureIcon />;
  }

  if (type === "humidity") {
    return <DropletIcon />;
  }

  if (type === "ph") {
    return <BeakerIcon />;
  }

  return <RainIcon />;
}

/* =========================================================
   SVG ICONS
   ========================================================= */

function PlantIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M12 21V11" />
      <path d="M12 14c-4.5 0-7-2.8-7-7 4.7 0 7 2.2 7 7Z" />
      <path d="M12 12c0-4.2 2.4-7 7-7 0 4.4-2.5 7-7 7Z" />
      <path d="M8 21h8" />
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
      className="h-5 w-5"
    >
      <path d="M9.5 4.5A3 3 0 0 0 6 7.3 3.3 3.3 0 0 0 4 10.4a3.2 3.2 0 0 0 2.2 3.05A3.4 3.4 0 0 0 9.5 18" />
      <path d="M14.5 4.5A3 3 0 0 1 18 7.3a3.3 3.3 0 0 1 2 3.1 3.2 3.2 0 0 1-2.2 3.05A3.4 3.4 0 0 1 14.5 18" />
      <path d="M9.5 4.5v15M14.5 4.5v15M9.5 9.5h5M9.5 14.5h5" />
    </svg>
  );
}

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

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  );
}

function TemperatureIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
    >
      <path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z" />
      <path d="M12 7v8" />
    </svg>
  );
}

function DropletIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
    >
      <path d="M12 3S6 10 6 14a6 6 0 0 0 12 0c0-4-6-11-6-11Z" />
    </svg>
  );
}

function BeakerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
    >
      <path d="M9 3h6" />
      <path d="M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" />
      <path d="M8 15h8" />
    </svg>
  );
}

function RainIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
    >
      <path d="M7 17h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 10a3.5 3.5 0 0 0 1 7Z" />
      <path d="m9 19-1 2" />
      <path d="m13 19-1 2" />
      <path d="m17 19-1 2" />
    </svg>
  );
}
