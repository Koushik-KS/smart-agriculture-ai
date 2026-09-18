"use client";

import { FormEvent, useMemo, useState } from "react";
import { indiaLocations } from "../../data/indiaLocations";

type YieldResult = {
  predicted_yield: number;
  yield_unit: string;
};

export default function YieldPredictionPage() {
  const [formData, setFormData] = useState({
    year_start: "2024",
    state_name: "Karnataka",
    district_name: "Haveri",
    crop_name: "Urad",
    crop_type: "Pulses",
    season: "Rabi",
    area: "186",
    previous_yield: "0.25",
  });

  const [result, setResult] =
    useState<YieldResult | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * =========================================================
   * STATE LIST
   * =========================================================
   */

  const states = useMemo(() => {
    return indiaLocations
      .map((location) => location.state)
      .sort((a, b) => a.localeCompare(b));
  }, []);

  /*
   * =========================================================
   * DISTRICT LIST BASED ON SELECTED STATE
   * =========================================================
   */

  const districts = useMemo(() => {
    const selectedLocation =
      indiaLocations.find(
        (location) =>
          location.state ===
          formData.state_name
      );

    return (
      selectedLocation?.districts || []
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [formData.state_name]);

  /*
   * =========================================================
   * NORMAL FIELD CHANGE
   * =========================================================
   */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setResult(null);
    setError("");
  };

  /*
   * =========================================================
   * STATE CHANGE
   * =========================================================
   */

  const handleStateChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newState =
      e.target.value;

    const selectedLocation =
      indiaLocations.find(
        (location) =>
          location.state === newState
      );

    const firstDistrict =
      selectedLocation?.districts?.[0] ||
      "";

    setFormData({
      ...formData,
      state_name: newState,
      district_name: firstDistrict,
    });

    setResult(null);
    setError("");
  };

  /*
   * =========================================================
   * SUBMIT
   * =========================================================
   */

  const handleSubmit = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "http://localhost:5000/api/yield-prediction",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            year_start:
              Number(
                formData.year_start
              ),

            state_name:
              formData.state_name,

            district_name:
              formData.district_name,

            crop_name:
              formData.crop_name,

            crop_type:
              formData.crop_type,

            season:
              formData.season,

            area:
              Number(formData.area),

            previous_yield:
              Number(
                formData.previous_yield
              ),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Prediction failed."
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while predicting crop yield."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================================================
   * RESET
   * =========================================================
   */

  const reset = () => {
    setResult(null);
    setError("");
  };

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <section className="mb-10 text-center">

          <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-green-700 shadow-sm backdrop-blur">

            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />

            Agricultural Machine Learning

          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">

            Crop Yield

            <span className="block bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 bg-clip-text text-transparent">
              Prediction
            </span>

          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            Estimate crop yield using historical
            agricultural data, farm information,
            location, season, and previous-year
            yield.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">

            <Capability
              icon={<ChartIcon />}
              text="Random Forest"
            />

            <Capability
              icon={<DatabaseIcon />}
              text="Historical Data"
            />

            <Capability
              icon={<TrendIcon />}
              text="Yield Regression"
            />

          </div>

        </section>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 font-black text-red-600">
              !
            </div>

            <div>

              <p className="font-black text-red-800">
                Prediction Failed
              </p>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* =====================================================
            MAIN WORKSPACE
        ===================================================== */}

        <section className="grid gap-7 lg:grid-cols-5">

          {/* ===================================================
              FORM
          =================================================== */}

          <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-green-900/10 backdrop-blur-xl md:p-8 lg:col-span-3">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                  01 • Farm Information
                </p>

                <h2 className="mt-2 text-2xl font-black text-gray-950">
                  Agricultural Context
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Enter the agricultural conditions
                  used by the yield prediction model.
                </p>

              </div>

              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700 sm:flex">
                <ChartIcon />
              </div>

            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-8"
            >

              <div className="grid gap-5 sm:grid-cols-2">

                {/* =================================================
                    YEAR
                ================================================= */}

                <InputField
                  label="Agricultural Year"
                  name="year_start"
                  type="number"
                  value={
                    formData.year_start
                  }
                  placeholder="2024"
                  hint="Year of prediction"
                  onChange={handleChange}
                />

                {/* =================================================
                    STATE DROPDOWN
                ================================================= */}

                <SelectField
                  label="State"
                  name="state_name"
                  value={
                    formData.state_name
                  }
                  options={states}
                  hint="Select the state where the farm is located"
                  onChange={
                    handleStateChange
                  }
                />

                {/* =================================================
                    DISTRICT DROPDOWN
                ================================================= */}

                <SelectField
                  label="District"
                  name="district_name"
                  value={
                    formData.district_name
                  }
                  options={districts}
                  hint="Select the district where the farm is located"
                  onChange={handleChange}
                />

                {/* =================================================
                    CROP
                ================================================= */}

                <InputField
                  label="Crop"
                  name="crop_name"
                  value={
                    formData.crop_name
                  }
                  placeholder="Urad"
                  hint="Name of the crop"
                  onChange={handleChange}
                />

                {/* =================================================
                    CROP TYPE
                ================================================= */}

                <SelectField
                  label="Crop Type"
                  name="crop_type"
                  value={
                    formData.crop_type
                  }
                  options={[
                    "Pulses",
                    "Cereals",
                    "Oilseeds",
                    "Commercial Crops",
                    "Fruits",
                    "Vegetables",
                    "Spices",
                    "Fibers",
                  ]}
                  hint="Agricultural crop category"
                  onChange={handleChange}
                />

                {/* =================================================
                    SEASON
                ================================================= */}

                <SelectField
                  label="Season"
                  name="season"
                  value={
                    formData.season
                  }
                  options={[
                    "Kharif",
                    "Rabi",
                    "Summer",
                    "Winter",
                    "Autumn",
                    "Whole Year",
                    "Total",
                  ]}
                  hint="Growing season"
                  onChange={handleChange}
                />

                {/* =================================================
                    AREA
                ================================================= */}

                <UnitInput
                  label="Cultivated Area"
                  name="area"
                  value={
                    formData.area
                  }
                  unit="ha"
                  type="number"
                  step="0.01"
                  hint="Total cultivated area"
                  onChange={handleChange}
                />

                {/* =================================================
                    PREVIOUS YIELD
                ================================================= */}

                <UnitInput
                  label="Previous-Year Yield"
                  name="previous_yield"
                  value={
                    formData.previous_yield
                  }
                  unit="t/ha"
                  type="number"
                  step="0.001"
                  hint="Historical yield from previous year"
                  onChange={handleChange}
                />

              </div>

              {/* =================================================
                  SUBMIT
              ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className="ai-primary-button mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-green-700 via-emerald-600 to-green-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-green-700/20 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <>
                    <span className="ai-button-spinner" />

                    Predicting Crop Yield...
                  </>
                ) : (
                  <>
                    <ChartIcon />

                    Predict Crop Yield

                    <ArrowIcon />
                  </>
                )}

              </button>

            </form>

          </div>

          {/* ===================================================
              MODEL INFORMATION
          =================================================== */}

          <div className="lg:col-span-2">

            <div className="h-full rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-green-900/10 backdrop-blur-xl md:p-8">

              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                02 • AI Model
              </p>

              <h2 className="mt-2 text-2xl font-black text-gray-950">
                Yield Intelligence
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                The model estimates yield using
                historical agricultural patterns
                and the supplied farm information.
              </p>

              {/* MODEL CARD */}

              <div className="vision-model-card mt-7 rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-green-950 p-6 text-white shadow-xl">

                <div className="flex items-center justify-between">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-green-300">
                    <ChartIcon />
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1.5">

                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />

                    <span className="text-[10px] font-black uppercase tracking-wider text-green-300">
                      Model Ready
                    </span>

                  </div>

                </div>

                <h3 className="mt-7 text-2xl font-black">
                  Random Forest
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-300">
                  Regression model trained on
                  historical agricultural yield
                  records.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">

                  <DarkMetric
                    label="Task"
                    value="Regression"
                  />

                  <DarkMetric
                    label="Target"
                    value="Yield"
                  />

                  <DarkMetric
                    label="Historical"
                    value="1997–2023"
                  />

                  <DarkMetric
                    label="Unit"
                    value="Tonnes / Ha"
                  />

                </div>

              </div>

              {/* MODEL PIPELINE */}

              <div className="mt-7">

                <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Prediction Pipeline
                </p>

                <div className="mt-4 space-y-3">

                  <PipelineStep
                    number="01"
                    title="Farm Context"
                    description="Location, crop, season and area"
                  />

                  <PipelineStep
                    number="02"
                    title="Historical Context"
                    description="Previous-year yield information"
                  />

                  <PipelineStep
                    number="03"
                    title="Feature Processing"
                    description="Categorical and numerical features"
                  />

                  <PipelineStep
                    number="04"
                    title="Yield Prediction"
                    description="Random Forest regression inference"
                  />

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            RESULT
        ===================================================== */}

        {result && (
          <section className="vision-result-reveal mt-8">

            <div className="mb-5">

              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                03 • AI Result
              </p>

              <h2 className="mt-2 text-3xl font-black text-gray-950">
                Yield Prediction Result
              </h2>

            </div>

            <div className="grid gap-6 lg:grid-cols-5">

              {/* PRIMARY RESULT */}

              <div className="result-highlight rounded-3xl border border-green-100 bg-white p-6 shadow-xl shadow-green-900/5 md:p-8 lg:col-span-3">

                <div className="flex items-start gap-4">

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                    <ChartIcon />
                  </div>

                  <div>

                    <p className="text-xs font-black uppercase tracking-wider text-green-600">
                      Estimated Crop Yield
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      AI-generated regression prediction
                    </p>

                  </div>

                </div>

                <div className="mt-8 text-center">

                  <p className="text-6xl font-black tracking-tight text-green-700 sm:text-7xl">
                    {
                      result.predicted_yield
                    }
                  </p>

                  <p className="mt-3 text-sm font-bold uppercase tracking-wider text-gray-400">
                    {
                      result.yield_unit
                    }
                  </p>

                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">

                  <Metric
                    label="Crop"
                    value={
                      formData.crop_name
                    }
                  />

                  <Metric
                    label="Location"
                    value={
                      formData.district_name
                    }
                  />

                  <Metric
                    label="Season"
                    value={
                      formData.season
                    }
                  />

                  <Metric
                    label="Area"
                    value={`${formData.area} ha`}
                  />

                </div>

              </div>

              {/* RESULT SUMMARY */}

              <div className="rounded-3xl border border-white/70 bg-white p-6 shadow-xl shadow-green-900/5 md:p-8 lg:col-span-2">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
                    <CheckIcon />
                  </div>

                  <div>

                    <p className="text-xs font-black uppercase tracking-wider text-green-600">
                      Prediction Complete
                    </p>

                    <h3 className="mt-1 text-lg font-black text-gray-950">
                      Model Output
                    </h3>

                  </div>

                </div>

                <div className="mt-7 space-y-5">

                  <ResultMetric
                    label="Predicted Yield"
                    value={`${result.predicted_yield} ${result.yield_unit}`}
                  />

                  <ResultMetric
                    label="Previous-Year Yield"
                    value={`${formData.previous_yield} t/ha`}
                  />

                  <ResultMetric
                    label="Agricultural Year"
                    value={
                      formData.year_start
                    }
                  />

                  <ResultMetric
                    label="State"
                    value={
                      formData.state_name
                    }
                  />

                  <ResultMetric
                    label="District"
                    value={
                      formData.district_name
                    }
                  />

                  <ResultMetric
                    label="Crop"
                    value={
                      formData.crop_name
                    }
                  />

                </div>

                <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50 p-4">

                  <div className="flex items-start gap-3">

                    <div className="shrink-0 text-blue-600">
                      <InfoIcon />
                    </div>

                    <p className="text-xs leading-5 text-blue-700">
                      This estimate is generated
                      from the trained Random Forest
                      regression model and historical
                      agricultural data. It should be
                      interpreted as decision-support
                      information.
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* ANALYZE AGAIN */}

            <div className="mt-6 flex justify-center">

              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-black text-gray-700 shadow-sm transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
              >

                <RefreshIcon />

                Make Another Prediction

              </button>

            </div>

          </section>
        )}

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="mt-10 pb-8 text-center">

          <p className="mx-auto max-w-3xl text-xs leading-6 text-gray-400">
            Smart Agriculture AI uses machine
            learning models trained on historical
            agricultural data. Predictions may vary
            with local field conditions and data
            availability.
          </p>

        </div>

      </div>

    </main>
  );
}

/* =========================================================
   INPUT FIELD
========================================================= */

function InputField({
  label,
  name,
  value,
  placeholder,
  hint,
  type = "text",
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  hint: string;
  type?: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
}) {
  return (
    <div className="animate-field-in">

      <label
        htmlFor={name}
        className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        required
        className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3.5 text-sm font-semibold text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
      />

      <p className="mt-2 text-[10px] font-medium text-gray-400">
        {hint}
      </p>

    </div>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  label,
  name,
  value,
  options,
  hint,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
  hint: string;
  onChange: (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => void;
}) {
  return (
    <div className="animate-field-in">

      <label
        htmlFor={name}
        className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500"
      >
        {label}
      </label>

      <div className="relative">

        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required
          className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3.5 pr-11 text-sm font-semibold text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
        >

          {options.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}

        </select>

        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
          <ChevronDownIcon />
        </div>

      </div>

      <p className="mt-2 text-[10px] font-medium text-gray-400">
        {hint}
      </p>

    </div>
  );
}

/* =========================================================
   UNIT INPUT
========================================================= */

function UnitInput({
  label,
  name,
  value,
  unit,
  hint,
  type,
  step,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  unit: string;
  hint: string;
  type: string;
  step?: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
}) {
  return (
    <div className="animate-field-in">

      <label
        htmlFor={name}
        className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500"
      >
        {label}
      </label>

      <div className="relative">

        <input
          id={name}
          name={name}
          type={type}
          step={step}
          value={value}
          onChange={onChange}
          required
          className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3.5 pr-20 text-sm font-semibold text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
        />

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-white px-2 py-1 text-[10px] font-black text-gray-500 shadow-sm">
          {unit}
        </span>

      </div>

      <p className="mt-2 text-[10px] font-medium text-gray-400">
        {hint}
      </p>

    </div>
  );
}

/* =========================================================
   CAPABILITY
========================================================= */

function Capability({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-xs font-bold text-gray-600 shadow-sm">

      <span className="text-green-600">
        {icon}
      </span>

      {text}

    </div>
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
   RESULT METRIC
========================================================= */

function ResultMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">

      <span className="text-xs font-bold text-gray-400">
        {label}
      </span>

      <span className="text-right text-sm font-black text-gray-800">
        {value}
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
    <div className="rounded-xl bg-gray-50 p-3">

      <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-black text-gray-700">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

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

function DatabaseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
    >
      <ellipse
        cx="12"
        cy="5"
        rx="7"
        ry="3"
      />

      <path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />

      <path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" />
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
      className="h-4 w-4"
    >
      <path d="M4 18 10 12l4 3 6-8" />
      <path d="M16 7h4v4" />
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
      className="h-5 w-5"
    >
      <path d="m5 12 4 4L19 6" />
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

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
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

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M20 11a8 8 0 0 0-14.8-4L4 9" />
      <path d="M4 5v4h4" />
      <path d="M4 13a8 8 0 0 0 14.8 4L20 15" />
      <path d="M20 19v-4h-4" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}