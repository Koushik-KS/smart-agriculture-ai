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
  overall_status?: string;
  alerts?: string[];
  recommendations?: string[];
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://smart-agriculture-backend-cpuf.onrender.com";

export default function RecommendationPage() {
  const [form, setForm] = useState({
    recommended_crop: "Rice",
    crop_confidence: "85",
    selected_crop: "Rice",
    predicted_disease: "Tomato___healthy",
    disease_confidence: "95",
    predicted_yield: "2.2",
  });

  const [result, setResult] =
    useState<RecommendationResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
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

  function formatStatus(status: string | undefined) {
    if (!status) {
      return "Unknown";
    }

    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  function getStatusClass(status: string | undefined) {
    const normalizedStatus = String(
      status || ""
    ).toLowerCase();

    if (
      normalizedStatus.includes("attention") ||
      normalizedStatus.includes("warning") ||
      normalizedStatus.includes("risk")
    ) {
      return "status-warning";
    }

    if (
      normalizedStatus.includes("critical") ||
      normalizedStatus.includes("danger")
    ) {
      return "status-danger";
    }

    return "status-normal";
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

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

    if (
      !requestBody.recommended_crop ||
      !requestBody.selected_crop ||
      !requestBody.predicted_disease
    ) {
      setError(
        "Please fill in all required text fields."
      );
      setLoading(false);
      return;
    }

    if (
      !Number.isFinite(
        requestBody.crop_confidence
      ) ||
      requestBody.crop_confidence < 0 ||
      requestBody.crop_confidence > 100
    ) {
      setError(
        "Crop confidence must be between 0 and 100."
      );
      setLoading(false);
      return;
    }

    if (
      !Number.isFinite(
        requestBody.disease_confidence
      ) ||
      requestBody.disease_confidence < 0 ||
      requestBody.disease_confidence > 100
    ) {
      setError(
        "Disease confidence must be between 0 and 100."
      );
      setLoading(false);
      return;
    }

    if (
      !Number.isFinite(
        requestBody.predicted_yield
      ) ||
      requestBody.predicted_yield < 0
    ) {
      setError(
        "Predicted yield must be a valid positive number."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/recommendation`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(requestBody),
        }
      );

      const responseText = await response.text();

      let data: RecommendationResponse & {
        message?: string;
        error?: string;
      };

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to generate recommendation."
        );
      }

      setResult(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      recommended_crop: "Rice",
      crop_confidence: "85",
      selected_crop: "Rice",
      predicted_disease: "Tomato___healthy",
      disease_confidence: "95",
      predicted_yield: "2.2",
    });

    setResult(null);
    setError("");
  }

  return (
    <main className="page-container">
      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background: #f5f7f4;
          color: #17231b;
          padding: 0;
        }

        .navbar {
          width: 100%;
          background: #ffffff;
          border-bottom: 1px solid #e4e9e3;
          padding: 18px 5%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
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
          gap: 8px;
          flex-wrap: wrap;
        }

        .nav-link {
          color: #526157;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          padding: 9px 12px;
          border-radius: 8px;
          transition: 0.2s ease;
        }

        .nav-link:hover {
          background: #edf5ee;
          color: #1c633c;
        }

        .nav-active {
          background: #e4f2e6;
          color: #1c633c;
        }

        .content {
          width: min(1180px, 92%);
          margin: 0 auto;
          padding: 48px 0 70px;
        }

        .heading {
          margin-bottom: 32px;
        }

        .eyebrow {
          color: #348252;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .title {
          font-size: clamp(30px, 4vw, 46px);
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -1.5px;
          margin: 0 0 14px;
        }

        .description {
          max-width: 700px;
          color: #69766d;
          font-size: 15px;
          line-height: 1.7;
          margin: 0;
        }

        .layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }

        .card {
          background: #ffffff;
          border: 1px solid #e3eae3;
          border-radius: 18px;
          padding: 28px;
          box-shadow: 0 8px 30px rgba(27, 57, 35, 0.04);
        }

        .card-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #e6f3e8;
          color: #287444;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-title {
          font-size: 19px;
          font-weight: 800;
          margin: 0;
        }

        .card-subtitle {
          color: #7a867d;
          font-size: 12px;
          margin-top: 4px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .label {
          color: #394a3d;
          font-size: 12px;
          font-weight: 750;
        }

        .input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dce5dc;
          border-radius: 10px;
          padding: 12px 13px;
          color: #24352a;
          background: #fbfdfb;
          font-size: 14px;
          outline: none;
          transition: 0.2s ease;
        }

        .input:focus {
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

        .button {
          border: 0;
          border-radius: 10px;
          padding: 13px 18px;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .primary-button {
          background: #287444;
          color: #ffffff;
          flex: 1;
        }

        .primary-button:hover {
          background: #1f6037;
        }

        .primary-button:disabled {
          background: #94b59d;
          cursor: wait;
        }

        .secondary-button {
          background: #edf2ed;
          color: #48604e;
        }

        .secondary-button:hover {
          background: #e0e9e1;
        }

        .error-box {
          margin-top: 20px;
          border: 1px solid #f1caca;
          background: #fff3f3;
          color: #a43d3d;
          border-radius: 10px;
          padding: 13px;
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
          padding: 20px;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: #edf5ee;
          color: #548161;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        .empty-title {
          color: #44594a;
          font-size: 17px;
          font-weight: 750;
          margin: 0 0 8px;
        }

        .empty-text {
          max-width: 300px;
          font-size: 13px;
          line-height: 1.6;
          margin: 0;
        }

        .status-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .status-label {
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
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 26px;
        }

        .metric {
          background: #f6f9f6;
          border: 1px solid #e7eee7;
          border-radius: 12px;
          padding: 15px;
        }

        .metric-label {
          color: #7a887d;
          font-size: 11px;
          font-weight: 650;
          margin-bottom: 8px;
        }

        .metric-value {
          color: #234f31;
          font-size: 19px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .metric-small {
          color: #78877b;
          font-size: 11px;
          margin-top: 5px;
        }

        .result-section {
          margin-top: 24px;
        }

        .section-title {
          color: #344b3a;
          font-size: 14px;
          font-weight: 800;
          margin: 0 0 12px;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .list-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          border: 1px solid #e7eee7;
          background: #f9fbf9;
          border-radius: 10px;
          padding: 12px;
          color: #58695c;
          font-size: 13px;
          line-height: 1.6;
        }

        .list-marker {
          color: #378052;
          font-weight: 900;
          flex-shrink: 0;
        }

        .no-items {
          color: #8a968c;
          background: #f8faf8;
          border-radius: 10px;
          padding: 14px;
          font-size: 12px;
        }

        .disclaimer {
          color: #89958b;
          font-size: 11px;
          line-height: 1.6;
          border-top: 1px solid #e8eee8;
          margin-top: 26px;
          padding-top: 18px;
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

          .nav-link {
            font-size: 12px;
            padding: 8px 9px;
          }

          .content {
            width: 90%;
            padding-top: 32px;
          }

          .card {
            padding: 20px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .full-width {
            grid-column: auto;
          }

          .metric-grid {
            grid-template-columns: 1fr;
          }

          .actions {
            flex-direction: column;
          }
        }
      `}</style>

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
        <div className="heading">
          <div className="eyebrow">
            Agricultural Intelligence
          </div>

          <h1 className="title">
            Smart Recommendation Engine
          </h1>

          <p className="description">
            Combine crop recommendation, plant disease
            detection, and yield prediction results to
            generate useful agricultural alerts and
            recommendations.
          </p>
        </div>

        <div className="layout">
          <section className="card">
            <div className="card-heading">
              <div className="icon-box">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3v18" />
                  <path d="M5 8h14" />
                  <path d="M5 16h14" />
                  <path d="M7 3h10" />
                  <path d="M7 21h10" />
                </svg>
              </div>

              <div>
                <h2 className="card-title">
                  Model Inputs
                </h2>

                <p className="card-subtitle">
                  Enter the outputs generated by the
                  machine learning models.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label
                    className="label"
                    htmlFor="recommended_crop"
                  >
                    Recommended Crop
                  </label>

                  <input
                    id="recommended_crop"
                    className="input"
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

                <div className="form-group">
                  <label
                    className="label"
                    htmlFor="crop_confidence"
                  >
                    Crop Confidence (%)
                  </label>

                  <input
                    id="crop_confidence"
                    className="input"
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

                <div className="form-group">
                  <label
                    className="label"
                    htmlFor="selected_crop"
                  >
                    Selected Crop
                  </label>

                  <input
                    id="selected_crop"
                    className="input"
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
                    Crop selected for the agricultural
                    analysis.
                  </span>
                </div>

                <div className="form-group">
                  <label
                    className="label"
                    htmlFor="predicted_yield"
                  >
                    Predicted Yield
                  </label>

                  <input
                    id="predicted_yield"
                    className="input"
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
                    Measured in tonnes per hectare.
                  </span>
                </div>

                <div className="form-group full-width">
                  <label
                    className="label"
                    htmlFor="predicted_disease"
                  >
                    Detected Disease
                  </label>

                  <input
                    id="predicted_disease"
                    className="input"
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

                <div className="form-group full-width">
                  <label
                    className="label"
                    htmlFor="disease_confidence"
                  >
                    Disease Confidence (%)
                  </label>

                  <input
                    id="disease_confidence"
                    className="input"
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
                  className="button primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Generating..."
                    : "Generate Recommendation"}
                </button>

                <button
                  type="button"
                  className="button secondary-button"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Reset
                </button>
              </div>
            </form>

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}
          </section>

          <section className="card">
            {result ? (
              <>
                <div className="card-heading">
                  <div className="icon-box">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 3l2.8 5.7L21 9.6l-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3z" />
                    </svg>
                  </div>

                  <div>
                    <h2 className="card-title">
                      Analysis Result
                    </h2>

                    <p className="card-subtitle">
                      Generated by the recommendation
                      engine.
                    </p>
                  </div>
                </div>

                <div className="status-row">
                  <span className="status-label">
                    Overall Status
                  </span>

                  <span
                    className={`status-badge ${getStatusClass(
                      result.overall_status
                    )}`}
                  >
                    {formatStatus(
                      result.overall_status
                    )}
                  </span>
                </div>

                <div className="metric-grid">
                  <div className="metric">
                    <div className="metric-label">
                      Recommended Crop
                    </div>

                    <div className="metric-value">
                      {result.recommended_crop ||
                        "Not available"}
                    </div>

                    <div className="metric-small">
                      Model recommendation
                    </div>
                  </div>

                  <div className="metric">
                    <div className="metric-label">
                      Crop Confidence
                    </div>

                    <div className="metric-value">
                      {result.crop_confidence != null
                        ? `${result.crop_confidence}%`
                        : "N/A"}
                    </div>

                    <div className="metric-small">
                      Classification confidence
                    </div>
                  </div>

                  <div className="metric">
                    <div className="metric-label">
                      Detected Disease
                    </div>

                    <div className="metric-value">
                      {formatDiseaseName(
                        result.predicted_disease
                      )}
                    </div>

                    <div className="metric-small">
                      Plant disease result
                    </div>
                  </div>

                  <div className="metric">
                    <div className="metric-label">
                      Predicted Yield
                    </div>

                    <div className="metric-value">
                      {result.predicted_yield != null
                        ? `${result.predicted_yield} t/ha`
                        : "N/A"}
                    </div>

                    <div className="metric-small">
                      Estimated agricultural yield
                    </div>
                  </div>
                </div>

                <div className="result-section">
                  <h3 className="section-title">
                    Alerts
                  </h3>

                  {result.alerts &&
                  result.alerts.length > 0 ? (
                    <ul className="list">
                      {result.alerts.map(
                        (alert, index) => (
                          <li
                            className="list-item"
                            key={`alert-${index}`}
                          >
                            <span className="list-marker">
                              !
                            </span>

                            <span>{alert}</span>
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <div className="no-items">
                      No alerts were generated for the
                      provided inputs.
                    </div>
                  )}
                </div>

                <div className="result-section">
                  <h3 className="section-title">
                    Recommendations
                  </h3>

                  {result.recommendations &&
                  result.recommendations.length > 0 ? (
                    <ul className="list">
                      {result.recommendations.map(
                        (recommendation, index) => (
                          <li
                            className="list-item"
                            key={`recommendation-${index}`}
                          >
                            <span className="list-marker">
                              ✓
                            </span>

                            <span>
                              {recommendation}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <div className="no-items">
                      No recommendations were generated.
                    </div>
                  )}
                </div>

                <p className="disclaimer">
                  This result is generated from the
                  provided model outputs. It should be
                  treated as decision-support information,
                  not as a replacement for professional
                  agricultural advice or field inspection.
                </p>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3v18" />
                    <path d="M5 8h14" />
                    <path d="M5 16h14" />
                    <path d="M7 3h10" />
                    <path d="M7 21h10" />
                  </svg>
                </div>

                <h3 className="empty-title">
                  No Analysis Yet
                </h3>

                <p className="empty-text">
                  Enter the outputs from your AI models
                  and generate a recommendation to view
                  agricultural alerts and guidance here.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}