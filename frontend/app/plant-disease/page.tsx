"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useState,
} from "react";

type DiseasePrediction = {
  disease: string;
  confidence: number;
};

type DiseaseResult = {
  predicted_disease: string;
  confidence: number;
  confidence_level: string;
  top_predictions?: DiseasePrediction[];
};

export default function PlantDiseasePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] =
    useState<DiseaseResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] =
    useState(false);

  /*
   * Clean up object URL when component changes.
   */
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setError(
        "Please select a valid plant image."
      );
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const imageUrl =
      URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setPreview(imageUrl);
    setResult(null);
    setError("");
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setDragActive(false);

    const droppedFile =
      event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const detectDisease = async () => {
    if (!file) {
      setError(
        "Please select a plant leaf image first."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        "http://localhost:5000/api/plant-disease",
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
            "Failed to detect plant disease."
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while analyzing the image."
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(null);
    setPreview("");
    setResult(null);
    setError("");
    setDragActive(false);
  };

  const formatDiseaseName = (
    disease: string
  ) => {
    return disease
      .replaceAll("___", " — ")
      .replaceAll("_", " ");
  };

  const confidenceColor =
    result?.confidence_level === "high"
      ? "text-green-700"
      : result?.confidence_level ===
        "moderate"
      ? "text-amber-600"
      : "text-red-600";

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <section className="mb-10 text-center">

          <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-green-700 shadow-sm backdrop-blur">

            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />

            Computer Vision AI

          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">

            Plant Disease

            <span className="block bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 bg-clip-text text-transparent">
              Detection
            </span>

          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            Upload a plant leaf image and use
            our trained computer vision model to
            identify possible plant diseases.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">

            <Capability
              icon={<VisionIcon />}
              text="MobileNetV2"
            />

            <Capability
              icon={<LayersIcon />}
              text="38 Classes"
            />

            <Capability
              icon={<BrainIcon />}
              text="Transfer Learning"
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
                Unable to analyze image
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
              UPLOAD / PREVIEW
          =================================================== */}

          <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-green-900/10 backdrop-blur-xl md:p-8 lg:col-span-3">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                  01 • Image Input
                </p>

                <h2 className="mt-2 text-2xl font-black text-gray-950">
                  Upload Plant Leaf
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Use a clear image where the leaf
                  is visible and occupies a good
                  portion of the frame.
                </p>

              </div>

              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700 sm:flex">
                <LeafIcon />
              </div>

            </div>

            {/* UPLOAD AREA */}

            {!preview ? (
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
                className={`mt-7 rounded-3xl border-2 border-dashed p-3 transition-all duration-300 ${
                  dragActive
                    ? "scale-[1.01] border-green-500 bg-green-50"
                    : "border-green-200 bg-green-50/40 hover:border-green-400 hover:bg-green-50/70"
                }`}
              >

                <label
                  htmlFor="plant-image"
                  className="flex min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-white bg-white/70 px-6 py-10 text-center"
                >

                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-green-100 to-emerald-50 text-green-700 shadow-lg shadow-green-900/10">

                    <UploadIcon />

                  </div>

                  <h3 className="mt-6 text-xl font-black text-gray-900">
                    Drop your leaf image here
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                    Drag and drop your image into
                    this area or select a file from
                    your device.
                  </p>

                  <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-green-700/20 transition hover:-translate-y-0.5 hover:bg-green-800">

                    <FolderIcon />

                    Browse Image

                  </span>

                  <p className="mt-5 text-xs font-bold uppercase tracking-wider text-gray-400">
                    PNG • JPG • JPEG
                  </p>

                </label>

                <input
                  id="plant-image"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />

              </div>
            ) : (
              <div className="mt-7">

                {/* IMAGE PREVIEW */}

                <div className="relative overflow-hidden rounded-3xl border border-green-100 bg-gray-950 p-2 shadow-xl">

                  <div className="relative overflow-hidden rounded-2xl">

                    <img
                      src={preview}
                      alt="Selected plant leaf"
                      className={`h-[360px] w-full object-cover ${
                        loading
                          ? "scale-[1.02]"
                          : ""
                      } transition-transform duration-700`}
                    />

                    {/* SCANNING ANIMATION */}

                    {loading && (
                      <>
                        <div className="absolute inset-0 bg-green-900/10" />

                        <div className="absolute left-0 right-0 top-0 h-1 animate-scan-line bg-gradient-to-r from-transparent via-green-300 to-transparent shadow-[0_0_18px_rgba(74,222,128,0.9)]" />

                        <div className="absolute inset-5 rounded-2xl border border-green-300/60" />

                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-black text-white backdrop-blur-md">

                          Scanning leaf...

                        </div>
                      </>
                    )}

                  </div>

                </div>

                {/* FILE DETAILS */}

                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">

                    <CheckIcon />

                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-sm font-black text-gray-800">
                      {file?.name}
                    </p>

                    <p className="mt-1 text-xs font-medium text-gray-500">

                      {file
                        ? (
                            file.size /
                            1024
                          ).toFixed(1)
                        : "0"}{" "}
                      KB • Image ready for analysis

                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={reset}
                    disabled={loading}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    Remove
                  </button>

                </div>

              </div>
            )}

            {/* ACTIONS */}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={detectDisease}
                disabled={!file || loading}
                className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-green-700 via-emerald-600 to-green-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-green-700/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >

                {loading ? (
                  <>
                    <Spinner />

                    Analyzing Plant...
                  </>
                ) : (
                  <>
                    <ScanIcon />

                    Detect Disease

                    <ArrowIcon />
                  </>
                )}

              </button>

              <button
                type="button"
                onClick={reset}
                disabled={loading}
                className="rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm font-black text-gray-600 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700 disabled:opacity-50"
              >
                Reset
              </button>

            </div>

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
                Vision Intelligence
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                The uploaded image is processed
                by the plant disease classification
                model.
              </p>

              {/* MODEL CARD */}

              <div className="mt-7 rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-green-950 p-6 text-white shadow-xl">

                <div className="flex items-center justify-between">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-green-300">

                    <BrainIcon />

                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1.5">

                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />

                    <span className="text-[10px] font-black uppercase tracking-wider text-green-300">
                      Model Ready
                    </span>

                  </div>

                </div>

                <h3 className="mt-7 text-2xl font-black">
                  MobileNetV2
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-300">
                  Transfer learning based image
                  classification model.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">

                  <DarkMetric
                    label="Classes"
                    value="38"
                  />

                  <DarkMetric
                    label="Input"
                    value="224 × 224"
                  />

                  <DarkMetric
                    label="Framework"
                    value="TensorFlow"
                  />

                  <DarkMetric
                    label="Task"
                    value="Classification"
                  />

                </div>

              </div>

              {/* PIPELINE */}

              <div className="mt-7">

                <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Detection Pipeline
                </p>

                <div className="mt-4 space-y-3">

                  <PipelineStep
                    number="01"
                    title="Image Processing"
                    description="Resize and prepare the leaf image"
                  />

                  <PipelineStep
                    number="02"
                    title="Vision Inference"
                    description="MobileNetV2 analyzes visual patterns"
                  />

                  <PipelineStep
                    number="03"
                    title="Disease Classification"
                    description="Generate class probabilities"
                  />

                  <PipelineStep
                    number="04"
                    title="Top Predictions"
                    description="Return the highest-confidence results"
                  />

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            RESULT SECTION
        ===================================================== */}

        {result && (
          <section className="mt-8">

            {/* RESULT HEADER */}

            <div className="mb-5">

              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                03 • AI Result
              </p>

              <h2 className="mt-2 text-3xl font-black text-gray-950">
                Disease Analysis
              </h2>

            </div>

            <div className="grid gap-6 lg:grid-cols-5">

              {/* PRIMARY RESULT */}

              <div className="rounded-3xl border border-green-100 bg-white p-6 shadow-xl shadow-green-900/5 md:p-8 lg:col-span-3">

                <div className="flex items-start gap-4">

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">

                    <ScanIcon />

                  </div>

                  <div className="min-w-0">

                    <p className="text-xs font-black uppercase tracking-wider text-green-600">
                      Predicted Condition
                    </p>

                    <h3 className="mt-2 text-2xl font-black leading-8 text-gray-950">
                      {formatDiseaseName(
                        result.predicted_disease
                      )}
                    </h3>

                  </div>

                </div>

                {/* CONFIDENCE */}

                <div className="mt-8 rounded-2xl bg-gray-50 p-5">

                  <div className="flex items-end justify-between gap-4">

                    <div>

                      <p className="text-xs font-black uppercase tracking-wider text-gray-400">
                        Model Confidence
                      </p>

                      <p
                        className={`mt-2 text-4xl font-black ${confidenceColor}`}
                      >
                        {result.confidence}%
                      </p>

                    </div>

                    <div
                      className={`rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wider ${
                        result.confidence_level ===
                        "high"
                          ? "bg-green-100 text-green-700"
                          : result.confidence_level ===
                            "moderate"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {result.confidence_level}
                    </div>

                  </div>

                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-200">

                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-1000"
                      style={{
                        width: `${Math.min(
                          result.confidence,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>

                {/* NOTE */}

                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">

                  <div className="shrink-0 text-blue-600">
                    <InfoIcon />
                  </div>

                  <p className="text-xs leading-5 text-blue-700">
                    This prediction is generated
                    from the trained PlantVillage
                    image dataset. Field conditions
                    may differ from controlled
                    training images.
                  </p>

                </div>

              </div>

              {/* TOP PREDICTIONS */}

              <div className="rounded-3xl border border-white/70 bg-white p-6 shadow-xl shadow-green-900/5 md:p-8 lg:col-span-2">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
                    <LayersIcon />
                  </div>

                  <div>

                    <p className="text-xs font-black uppercase tracking-wider text-green-600">
                      Classification
                    </p>

                    <h3 className="mt-1 text-lg font-black text-gray-950">
                      Top Predictions
                    </h3>

                  </div>

                </div>

                <div className="mt-6 space-y-4">

                  {result.top_predictions &&
                  result.top_predictions.length >
                    0 ? (
                    result.top_predictions.map(
                      (
                        prediction,
                        index
                      ) => (
                        <PredictionRow
                          key={
                            prediction.disease
                          }
                          rank={
                            index + 1
                          }
                          disease={formatDiseaseName(
                            prediction.disease
                          )}
                          confidence={
                            prediction.confidence
                          }
                        />
                      )
                    )
                  ) : (
                    <PredictionRow
                      rank={1}
                      disease={formatDiseaseName(
                        result.predicted_disease
                      )}
                      confidence={
                        result.confidence
                      }
                    />
                  )}

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

                Analyze Another Image

              </button>

            </div>

          </section>
        )}

        {/* =====================================================
            DISCLAIMER
        ===================================================== */}

        <div className="mt-10 pb-8 text-center">

          <p className="mx-auto max-w-3xl text-xs leading-6 text-gray-400">
            AI predictions are intended as
            decision-support information. For
            real-world crop management, verify
            results with field observations and
            qualified agricultural experts.
          </p>

        </div>

      </div>

    </main>
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
   PREDICTION ROW
========================================================= */

function PredictionRow({
  rank,
  disease,
  confidence,
}: {
  rank: number;
  disease: string;
  confidence: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">

      <div className="flex items-center gap-3">

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-black text-green-700 shadow-sm">
          {rank}
        </div>

        <p className="min-w-0 flex-1 text-sm font-bold leading-5 text-gray-700">
          {disease}
        </p>

        <span className="text-xs font-black text-green-700">
          {confidence}%
        </span>

      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">

        <div
          className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-700"
          style={{
            width: `${Math.min(
              confidence,
              100
            )}%`,
          }}
        />

      </div>

    </div>
  );
}

/* =========================================================
   SPINNER
========================================================= */

function Spinner() {
  return (
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}

/* =========================================================
   ICONS
========================================================= */

function LeafIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-7 w-7"
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
      className="h-4 w-4"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
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

function BrainIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-6 w-6"
    >
      <path d="M9.5 4a3.5 3.5 0 0 0-3 5.3A3.5 3.5 0 0 0 7 16a3.5 3.5 0 0 0 5 3.1A3.5 3.5 0 0 0 17 16a3.5 3.5 0 0 0 .5-6.7A3.5 3.5 0 0 0 14.5 4a3.5 3.5 0 0 0-5 0Z" />
      <path d="M12 4v16" />
      <path d="M7.5 9.5H12M12 14.5h4.5" />
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
      className="h-9 w-9"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h5l2 2h8A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-11Z" />
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
      className="h-5 w-5"
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
      className="h-4 w-4"
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