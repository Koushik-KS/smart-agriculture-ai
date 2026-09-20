
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

interface RecommendationResponse {
  recommended_crop?: string | null;
  crop_confidence?: number | null;
  selected_crop?: string | null;
  predicted_disease?: string | null;
  disease_confidence?: number | null;
  predicted_yield?: number | null;
  overall_status?: string | null;
  alerts?: string[];
  recommendations?: string[];
  message?: string;
  error?: string;
  detail?: string;
}

interface FormState {
  recommended_crop: string;
  crop_confidence: string;
  selected_crop: string;
  predicted_disease: string;
  disease_confidence: string;
  predicted_yield: string;
}

const initialForm: FormState = {
  recommended_crop: "Rice",
  crop_confidence: "85",
  selected_crop: "Rice",
  predicted_disease: "Tomato___healthy",
  disease_confidence: "95",
  predicted_yield: "2.2",
};

export default function RecommendationPage() {
  const [form, setForm] = useState<FormState>(initialForm);

  const [result, setResult] =
    useState<RecommendationResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    field: keyof FormState,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
  }

  function formatDiseaseName(
    disease: string | null | undefined
  ) {
    if (!disease) {
      return "Not available";
    }

    return disease
      .replace(/___/g, " - ")
      .replace(/_/g, " ");
  }

  function formatStatus(
    status: string | null | undefined
  ) {
    if (!status) {
      return "Unknown";
    }

    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  function getStatusClass(
    status: string | null | undefined
  ) {
    const normalizedStatus = String(
      status || ""
    ).toLowerCase();

    if (
      normalizedStatus.includes("critical") ||
      normalizedStatus.includes("danger")
    ) {
      return "status-danger";
    }

    if (
      normalizedStatus.includes("warning") ||
      normalizedStatus.includes("attention") ||
      normalizedStatus.includes("risk")
    ) {
      return "status-warning";
    }

    return "status-normal";
  }

  function validateForm() {
    if (
      !form.recommended_crop.trim() ||
      !form.selected_crop.trim() ||
      !form.predicted_disease.trim()
    ) {
      return "Please fill in all required text fields.";
    }

    const cropConfidence = Number(
      form.crop_confidence
    );

    const diseaseConfidence = Number(
      form.disease_confidence
    );

    const predictedYield = Number(
      form.predicted_yield
    );

    if (
      !Number.isFinite(cropConfidence) ||
      cropConfidence < 0 ||
      cropConfidence > 100
    ) {
      return "Crop confidence must be between 0 and 100.";
    }

    if (
      !Number.isFinite(diseaseConfidence) ||
      diseaseConfidence < 0 ||
      diseaseConfidence > 100
    ) {
      return "Disease confidence must be between 0 and 100.";
    }

    if (
      !Number.isFinite(predictedYield) ||
      predictedYield < 0
    ) {
      return "Predicted yield must be a valid non-negative number.";
    }

    return "";
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const requestBody = {
      recommended_crop:
        form.recommended_crop.trim(),

      crop_confidence:
        Number(form.crop_confidence),

      selected_crop:
        form.selected_crop.trim(),

      predicted_disease:
        form.predicted_disease.trim(),

      disease_confidence:
        Number(form.disease_confidence),

      predicted_yield:
        Number(form.predicted_yield),
    };

    try {
      /*
       * Use the Next.js proxy route.
       *
       * Do not use localhost or a direct Render URL here.
       */
      const response = await fetch(
        "/api/recommendation",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(requestBody),
        }
      );

      const responseText = await response.text();

      let data: RecommendationResponse;

      try {
        data = JSON.parse(
          responseText
        ) as RecommendationResponse;
      } catch {
        throw new Error(
          responseText ||
            "The server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            data.detail ||
            "Failed to generate recommendation."
        );
      }

      setResult(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to the recommendation service."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(initialForm);
    setResult(null);
    setError("");
  }

  return (
    <main className="page-container">
      <nav className="navbar">
        <Link href="/" className="brand">
          Smart Agriculture AI
        </Link>

        <div className="nav-links">
          <Link href="/" className="nav-link">
            Dashboard
          </Link>

          <Link
            href="/plant-disease"
            className="nav-link"
          >
            Plant Disease
          </Link>

          <Link
            href="/yield-prediction"
            className="nav-link"
          >
            Yield Prediction
          </Link>

          <Link
            href="/recommendation"
            className="nav-link nav-active"
          >
            Recommendation
          </Link>

          <Link
            href="/weather"
            className="nav-link"
          >
            Weather
          </Link>

          <Link
            href="/ai-analysis"
            className="nav-link"
          >
            AI Analysis
          </Link>
        </div>
      </nav>

      <section className="content">
        <header className="heading">
          <p className="eyebrow">
            Agricultural Intelligence
          </p>

          <h1>
            Smart Recommendation Engine
          </h1>

          <p className="description">
            Combine crop recommendation, plant disease
            detection, and yield prediction outputs to
            generate agricultural alerts and
            recommendations.
          </p>
        </header>

        <div className="layout">
          <section className="card">
            <div className="card-heading">
              <div className="icon-box">
                01
              </div>

              <div>
                <h2>
                  Model Inputs
                </h2>

                <p>
                  Enter the outputs generated by your
                  machine learning models.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field">
                  <label
                    htmlFor="recommended_crop"
                  >
                    Recommended Crop
                  </label>

                  <input
                    id="recommended_crop"
                    type="text"
                    value={form.recommended_crop}
                    onChange={(event) =>
                      handleChange(
                        "recommended_crop",
                        event.target.value
                      )
                    }
                    placeholder="Example: Rice"
                    required
                  />
                </div>

                <div className="field">
                  <label
                    htmlFor="crop_confidence"
                  >
                    Crop Confidence (%)
                  </label>

                  <input
                    id="crop_confidence"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.crop_confidence}
                    onChange={(event) =>
                      handleChange(
                        "crop_confidence",
                        event.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="field">
                  <label
                    htmlFor="selected_crop"
                  >
                    Selected Crop
                  </label>

                  <input
                    id="selected_crop"
                    type="text"
                    value={form.selected_crop}
                    onChange={(event) =>
                      handleChange(
                        "selected_crop",
                        event.target.value
                      )
                    }
                    placeholder="Example: Rice"
                    required
                  />

                  <span className="helper">
                    Crop selected for agricultural analysis.
                  </span>
                </div>

                <div className="field">
                  <label
                    htmlFor="predicted_yield"
                  >
                    Predicted Yield (t/ha)
                  </label>

                  <input
                    id="predicted_yield"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.predicted_yield}
                    onChange={(event) =>
                      handleChange(
                        "predicted_yield",
                        event.target.value
                      )
                    }
                    required
                  />

                  <span className="helper">
                    Estimated yield in tonnes per hectare.
                  </span>
                </div>

                <div className="field full-width">
                  <label
                    htmlFor="predicted_disease"
                  >
                    Detected Disease
                  </label>

                  <input
                    id="predicted_disease"
                    type="text"
                    value={form.predicted_disease}
                    onChange={(event) =>
                      handleChange(
                        "predicted_disease",
                        event.target.value
                      )
                    }
                    placeholder="Example: Tomato___healthy"
                    required
                  />

                  <span className="helper">
                    Use the disease name returned by the
                    plant disease model.
                  </span>
                </div>

                <div className="field full-width">
                  <label
                    htmlFor="disease_confidence"
                  >
                    Disease Confidence (%)
                  </label>

                  <input
                    id="disease_confidence"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.disease_confidence}
                    onChange={(event) =>
                      handleChange(
                        "disease_confidence",
                        event.target.value
                      )
                    }
                    required
                  />
                </div>
              </div>

              <div className="actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Generating..."
                    : "Generate Recommendation"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Reset
                </button>
              </div>
            </form>

            {error && (
              <div
                className="error-box"
                role="alert"
              >
                {error}
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-heading">
              <div className="icon-box">
                02
              </div>

              <div>
                <h2>
                  Analysis Result
                </h2>

                <p>
                  Results returned by the recommendation
                  engine.
                </p>
              </div>
            </div>

            {!result ? (
              <div className="empty-state">
                <div className="empty-icon">
                  AI
                </div>

                <h3>
                  No Analysis Yet
                </h3>

                <p>
                  Submit the model outputs to view
                  agricultural alerts and recommendations.
                </p>
              </div>
            ) : (
              <>
                <div className="status-row">
                  <span>
                    Overall Status
                  </span>

                  <strong
                    className={`status-badge ${getStatusClass(
                      result.overall_status
                    )}`}
                  >
                    {formatStatus(
                      result.overall_status
                    )}
                  </strong>
                </div>

                <div className="metric-grid">
                  <div className="metric">
                    <span>
                      Recommended Crop
                    </span>

                    <strong>
                      {result.recommended_crop ||
                        "Not available"}
                    </strong>
                  </div>

                  <div className="metric">
                    <span>
                      Crop Confidence
                    </span>

                    <strong>
                      {result.crop_confidence != null
                        ? `${result.crop_confidence}%`
                        : "N/A"}
                    </strong>
                  </div>

                  <div className="metric">
                    <span>
                      Detected Disease
                    </span>

                    <strong>
                      {formatDiseaseName(
                        result.predicted_disease
                      )}
                    </strong>
                  </div>

                  <div className="metric">
                    <span>
                      Predicted Yield
                    </span>

                    <strong>
                      {result.predicted_yield != null
                        ? `${result.predicted_yield} t/ha`
                        : "N/A"}
                    </strong>
                  </div>
                </div>

                <ResultList
                  title="Alerts"
                  items={result.alerts}
                  emptyText="No alerts were generated."
                />

                <ResultList
                  title="Recommendations"
                  items={result.recommendations}
                  emptyText="No recommendations were generated."
                />

                <p className="disclaimer">
                  This result is decision-support
                  information based on the supplied
                  model outputs. Verify it with local
                  agricultural conditions and qualified
                  agricultural professionals.
                </p>
              </>
            )}
          </section>
        </div>
      </section>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background: #f5f7f4;
          color: #17231b;
        }

        .navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          padding: 18px 5%;
          background: #ffffff;
          border-bottom: 1px solid #e3eae3;
        }

        .brand {
          color: #1c633c;
          font-size: 21px;
          font-weight: 800;
          text-decoration: none;
          white-space: nowrap;
        }

        .nav-links {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 7px;
          flex-wrap: wrap;
        }

        .nav-link {
          padding: 9px 11px;
          border-radius: 8px;
          color: #526157;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: 0.2s ease;
        }

        .nav-link:hover,
        .nav-active {
          color: #1c633c;
          background: #e4f2e6;
        }

        .content {
          width: min(1180px, 92%);
          margin: 0 auto;
          padding: 48px 0 70px;
        }

        .heading {
          margin-bottom: 30px;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #348252;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        h1 {
          margin: 0 0 14px;
          color: #17231b;
          font-size: clamp(30px, 4vw, 46px);
          line-height: 1.1;
          letter-spacing: -1.5px;
        }

        .description {
          max-width: 700px;
          margin: 0;
          color: #69766d;
          font-size: 15px;
          line-height: 1.7;
        }

        .layout {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 24px;
          align-items: start;
        }

        .card {
          padding: 28px;
          border: 1px solid #e3eae3;
          border-radius: 18px;
          background: #ffffff;
          box-shadow:
            0 8px 30px rgba(27, 57, 35, 0.04);
        }

        .card-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .icon-box,
        .empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #e6f3e8;
          color: #287444;
          font-weight: 800;
        }

        h2 {
          margin: 0;
          font-size: 19px;
          font-weight: 800;
        }

        .card-heading p {
          margin: 4px 0 0;
          color: #7a867d;
          font-size: 12px;
        }

        .form-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        label {
          color: #394a3d;
          font-size: 12px;
          font-weight: 700;
        }

        input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 13px;
          border: 1px solid #dce5dc;
          border-radius: 10px;
          outline: none;
          color: #24352a;
          background: #fbfdfb;
          font-size: 14px;
        }

        input:focus {
          border-color: #4b9862;
          box-shadow: 0 0 0 3px #e4f2e6;
        }

        .helper {
          color: #879389;
          font-size: 11px;
          line-height: 1.5;
        }

        .actions {
          display: flex;
          gap: 12px;
          margin-top: 26px;
        }

        button {
          padding: 13px 18px;
          border: 0;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          transition: 0.2s ease;
        }

        button:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .primary-button {
          flex: 1;
          color: #ffffff;
          background: #287444;
        }

        .primary-button:hover {
          background: #1f6037;
        }

        .secondary-button {
          color: #48604e;
          background: #edf2ed;
        }

        .secondary-button:hover {
          background: #e0e9e1;
        }

        .error-box {
          margin-top: 20px;
          padding: 13px;
          border: 1px solid #f1caca;
          border-radius: 10px;
          color: #a43d3d;
          background: #fff3f3;
          font-size: 13px;
          line-height: 1.5;
        }

        .empty-state {
          min-height: 310px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #879389;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          margin-bottom: 18px;
          border-radius: 18px;
        }

        .empty-state h3 {
          margin: 0 0 8px;
          color: #44594a;
          font-size: 17px;
        }

        .empty-state p {
          max-width: 300px;
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
        }

        .status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 24px;
          color: #7b887e;
          font-size: 12px;
          font-weight: 700;
        }

        .status-badge {
          padding: 7px 11px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-normal {
          color: #246a3d;
          background: #e3f3e7;
        }

        .status-warning {
          color: #95601b;
          background: #fff0d7;
        }

        .status-danger {
          color: #a13c3c;
          background: #ffe4e4;
        }

        .metric-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 26px;
        }

        .metric {
          padding: 15px;
          border: 1px solid #e7eee7;
          border-radius: 12px;
          background: #f6f9f6;
        }

        .metric span {
          display: block;
          margin-bottom: 8px;
          color: #7a887d;
          font-size: 11px;
          font-weight: 650;
        }

        .metric strong {
          display: block;
          color: #234f31;
          font-size: 18px;
          overflow-wrap: anywhere;
        }

        .result-section {
          margin-top: 24px;
        }

        .result-section h3 {
          margin: 0 0 12px;
          color: #344b3a;
          font-size: 14px;
          font-weight: 800;
        }

        .result-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .result-item,
        .no-items {
          padding: 12px;
          border: 1px solid #e7eee7;
          border-radius: 10px;
          color: #58695c;
          background: #f9fbf9;
          font-size: 13px;
          line-height: 1.6;
        }

        .result-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .marker {
          color: #378052;
          font-weight: 900;
          flex-shrink: 0;
        }

        .disclaimer {
          margin: 26px 0 0;
          padding-top: 18px;
          border-top: 1px solid #e8eee8;
          color: #89958b;
          font-size: 11px;
          line-height: 1.6;
        }

        @media (max-width: 900px) {
          .layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .navbar {
            padding: 16px 4%;
          }

          .nav-links {
            justify-content: flex-start;
          }

          .content {
            width: 90%;
            padding-top: 32px;
          }

          .card {
            padding: 20px;
          }

          .form-grid,
          .metric-grid {
            grid-template-columns: 1fr;
          }

          .full-width {
            grid-column: auto;
          }

          .actions {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}

function ResultList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items?: string[];
  emptyText: string;
}) {
  return (
    <section className="result-section">
      <h3>
        {title}
      </h3>

      {items && items.length > 0 ? (
        <ul className="result-list">
          {items.map((item, index) => (
            <li
              className="result-item"
              key={`${title}-${index}`}
            >
              <span className="marker">
                •
              </span>

              <span>
                {item}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-items">
          {emptyText}
        </div>
      )}
    </section>
  );
}