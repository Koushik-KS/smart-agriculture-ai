"use client";

import { ChangeEvent, useState } from "react";

export default function PlantDiseasePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [result, setResult] = useState<{
    predicted_disease: string;
    confidence: number;
    confidence_level: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError("");
  };

  const detectDisease = async () => {
    if (!file) {
      setError("Please select a plant leaf image first.");
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to detect plant disease."
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

  const reset = () => {
    setFile(null);
    setPreview("");
    setResult(null);
    setError("");
  };

  return (
  <main
  style={{
    minHeight: "100vh",
    padding: "40px 20px",
    background: "#f4f7f5",
    color: "#1f2937",
    fontFamily: "Arial, sans-serif",
  }}
>
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            marginBottom: "10px",
          }}
        >
          🌿 Plant Disease Detection
        </h1>

        <p
          style={{
            color: "#555",
            marginBottom: "30px",
          }}
        >
          Upload a plant leaf image and let the AI identify the
          disease.
        </p>

        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            Select Leaf Image
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />

          {preview && (
            <div style={{ marginTop: "25px" }}>
              <p style={{ fontWeight: "bold" }}>Image Preview</p>

              <img
                src={preview}
                alt="Selected plant leaf"
                style={{
                  width: "300px",
                  maxWidth: "100%",
                  borderRadius: "12px",
                  border: "1px solid #ddd",
                }}
              />
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "25px",
            }}
          >
            <button
              onClick={detectDisease}
              disabled={!file || loading}
              style={{
                padding: "12px 20px",
                border: "none",
                borderRadius: "8px",
                cursor: !file || loading ? "not-allowed" : "pointer",
                opacity: !file || loading ? 0.6 : 1,
              }}
            >
              {loading ? "Analyzing..." : "Detect Disease"}
            </button>

            <button
              onClick={reset}
              style={{
                padding: "12px 20px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>

          {error && (
            <div
              style={{
                marginTop: "25px",
                padding: "15px",
                borderRadius: "8px",
                background: "#ffe5e5",
              }}
            >
              ❌ {error}
            </div>
          )}

          {result && (
            <div
              style={{
                marginTop: "30px",
                padding: "25px",
                borderRadius: "12px",
                background: "#f1f8f3",
                border: "1px solid #d6eadb",
              }}
            >
              <h2>🤖 AI Result</h2>

              <p>
                <strong>Prediction:</strong>{" "}
                {result.predicted_disease}
              </p>

              <p>
                <strong>Confidence:</strong>{" "}
                {result.confidence}%
              </p>

              <p>
                <strong>Confidence Level:</strong>{" "}
                {result.confidence_level}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}