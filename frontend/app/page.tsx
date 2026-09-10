"use client";

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
    label: "Nitrogen (N)",
    unit: "mg/kg",
    placeholder: "e.g. 90",
  },
  {
    key: "P",
    label: "Phosphorus (P)",
    unit: "mg/kg",
    placeholder: "e.g. 40",
  },
  {
    key: "K",
    label: "Potassium (K)",
    unit: "mg/kg",
    placeholder: "e.g. 40",
  },
  {
    key: "temperature",
    label: "Temperature",
    unit: "°C",
    placeholder: "e.g. 25",
  },
  {
    key: "humidity",
    label: "Humidity",
    unit: "%",
    placeholder: "e.g. 80",
  },
  {
    key: "ph",
    label: "Soil pH",
    unit: "pH",
    placeholder: "e.g. 6.5",
  },
  {
    key: "rainfall",
    label: "Rainfall",
    unit: "mm",
    placeholder: "e.g. 200",
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
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
        "http://localhost:5000/api/crop-recommendation",
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
        throw new Error(data.message || "Failed to get recommendation.");
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
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-3 text-5xl">🌾</div>

          <h1 className="text-4xl font-bold tracking-tight text-green-900 md:text-5xl">
            Smart Agriculture AI
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            AI-powered crop recommendation based on soil and environmental
            conditions.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Input Card */}
          <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-green-100 lg:col-span-2 md:p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-gray-900">
                🌱 Crop Recommendation
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Enter the soil and environmental values to get an AI-based
                recommendation.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.key}>
                    <label
                      htmlFor={field.key}
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      {field.label}
                    </label>

                    <div className="relative">
                      <input
                        id={field.key}
                        type="number"
                        step="any"
                        value={form[field.key as keyof FormData]}
                        onChange={(event) =>
                          handleChange(field.key, event.target.value)
                        }
                        placeholder={field.placeholder}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-20 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
                      />

                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                        {field.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  ❌ {error}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-green-700 px-6 py-3.5 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "🤖 AI is analyzing..." : "🌱 Recommend Crop"}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border border-gray-200 px-6 py-3.5 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </form>
          </section>

          {/* Result Card */}
          <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-green-100 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900">
              🔎 AI Result
            </h2>

            {!result && !loading && (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                <div className="mb-5 text-6xl">🌱</div>

                <p className="font-semibold text-gray-700">
                  No recommendation yet
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Enter your agricultural data and click{" "}
                  <span className="font-semibold">Recommend Crop</span>.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                <div className="mb-5 animate-pulse text-6xl">🤖</div>

                <p className="font-semibold text-gray-700">
                  AI is analyzing your data...
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Connecting to the crop recommendation model.
                </p>
              </div>
            )}

            {result && !loading && (
              <div className="mt-8">
                <p className="text-sm font-medium text-gray-500">
                  Recommended Crop
                </p>

                <div className="mt-2 rounded-2xl bg-green-50 p-5">
                  <p className="text-4xl font-bold capitalize text-green-800">
                    {result.recommended_crop}
                  </p>
                </div>

                <div className="mt-7">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      AI Confidence
                    </span>

                    <span className="text-lg font-bold text-green-700">
                      {result.confidence}%
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-green-600 transition-all duration-700"
                      style={{
                        width: `${Math.min(result.confidence, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-semibold capitalize text-gray-700">
                    Confidence: {result.confidence_level}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {result.message}
                  </p>
                </div>

                <p className="mt-6 text-xs leading-5 text-gray-400">
                  This recommendation is generated by a machine learning
                  model and should be considered as decision-support
                  information.
                </p>
              </div>
            )}
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          Smart Agriculture AI • Crop Recommendation Module
        </p>
      </div>
    </main>
  );
}