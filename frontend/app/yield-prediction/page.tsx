"use client";

import { useState } from "react";

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

  const [result, setResult] = useState<{
    predicted_yield: number;
    yield_unit: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            year_start: Number(formData.year_start),
            state_name: formData.state_name,
            district_name: formData.district_name,
            crop_name: formData.crop_name,
            crop_type: formData.crop_type,
            season: formData.season,
            area: Number(formData.area),
            previous_yield: Number(formData.previous_yield),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Prediction failed");
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <div className="background-glow glow-one"></div>
      <div className="background-glow glow-two"></div>

      <section className="container">

        {/* Header */}
        <div className="header">
          <div className="icon-box">🌾</div>

          <div>
            <p className="eyebrow">SMART AGRICULTURE AI</p>

            <h1>Crop Yield Prediction</h1>

            <p className="subtitle">
              Estimate crop yield using historical agricultural
              data and previous-year yield information.
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="card">

          <div className="section-title">
            <div className="section-number">01</div>

            <div>
              <h2>Farm Information</h2>
              <p>
                Enter the agricultural details for prediction.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-grid">

              {/* Year */}
              <div className="field">
                <label htmlFor="year_start">
                  Year
                </label>

                <input
                  id="year_start"
                  name="year_start"
                  type="number"
                  value={formData.year_start}
                  onChange={handleChange}
                  required
                />

                <span className="hint">
                  Agricultural year
                </span>
              </div>

              {/* State */}
              <div className="field">
                <label htmlFor="state_name">
                  State
                </label>

                <input
                  id="state_name"
                  name="state_name"
                  value={formData.state_name}
                  onChange={handleChange}
                  placeholder="e.g. Karnataka"
                  required
                />

                <span className="hint">
                  State where the farm is located
                </span>
              </div>

              {/* District */}
              <div className="field">
                <label htmlFor="district_name">
                  District
                </label>

                <input
                  id="district_name"
                  name="district_name"
                  value={formData.district_name}
                  onChange={handleChange}
                  placeholder="e.g. Haveri"
                  required
                />

                <span className="hint">
                  District where the farm is located
                </span>
              </div>

              {/* Crop */}
              <div className="field">
                <label htmlFor="crop_name">
                  Crop
                </label>

                <input
                  id="crop_name"
                  name="crop_name"
                  value={formData.crop_name}
                  onChange={handleChange}
                  placeholder="e.g. Rice"
                  required
                />

                <span className="hint">
                  Name of the crop
                </span>
              </div>

              {/* Crop Type */}
              <div className="field">
                <label htmlFor="crop_type">
                  Crop Type
                </label>

                <select
                  id="crop_type"
                  name="crop_type"
                  value={formData.crop_type}
                  onChange={handleChange}
                >
                  <option value="Pulses">Pulses</option>
                  <option value="Cereals">Cereals</option>
                  <option value="Oilseeds">Oilseeds</option>
                  <option value="Commercial Crops">
                    Commercial Crops
                  </option>
                  <option value="Fruits">Fruits</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Spices">Spices</option>
                  <option value="Fibers">Fibers</option>
                </select>

                <span className="hint">
                  Category of the crop
                </span>
              </div>

              {/* Season */}
              <div className="field">
                <label htmlFor="season">
                  Season
                </label>

                <select
                  id="season"
                  name="season"
                  value={formData.season}
                  onChange={handleChange}
                >
                  <option value="Kharif">Kharif</option>
                  <option value="Rabi">Rabi</option>
                  <option value="Summer">Summer</option>
                  <option value="Winter">Winter</option>
                  <option value="Autumn">Autumn</option>
                  <option value="Whole Year">
                    Whole Year
                  </option>
                  <option value="Total">Total</option>
                </select>

                <span className="hint">
                  Growing season
                </span>
              </div>

              {/* Area */}
              <div className="field">
                <label htmlFor="area">
                  Cultivated Area
                </label>

                <div className="input-with-unit">
                  <input
                    id="area"
                    name="area"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.area}
                    onChange={handleChange}
                    required
                  />

                  <span>ha</span>
                </div>

                <span className="hint">
                  Total cultivated area
                </span>
              </div>

              {/* Previous Yield */}
              <div className="field">
                <label htmlFor="previous_yield">
                  Previous-Year Yield
                </label>

                <div className="input-with-unit">
                  <input
                    id="previous_yield"
                    name="previous_yield"
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.previous_yield}
                    onChange={handleChange}
                    required
                  />

                  <span>t/ha</span>
                </div>

                <span className="hint">
                  Yield from the previous year
                </span>
              </div>

            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="predict-button"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Predicting...
                </>
              ) : (
                <>
                  <span>✦</span>
                  Predict Crop Yield
                  <span className="arrow">→</span>
                </>
              )}
            </button>

          </form>

          {/* Error */}
          {error && (
            <div className="error-box">
              <span>⚠️</span>

              <div>
                <strong>Prediction failed</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="result-box">

              <div className="result-header">
                <div>
                  <p className="result-label">
                    AI PREDICTION
                  </p>

                  <h2>Estimated Crop Yield</h2>
                </div>

                <div className="success-icon">
                  ✓
                </div>
              </div>

              <div className="result-value">
                {result.predicted_yield}
              </div>

              <div className="result-unit">
                {result.yield_unit}
              </div>

              <div className="result-info">
                <span>🌱</span>
                Prediction generated from the trained
                Random Forest model.
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="footer">
          <span>🤖</span>
          Powered by Smart Agriculture AI
        </div>

      </section>

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          padding: 60px 20px;
          background:
            linear-gradient(
              135deg,
              #f0fdf4 0%,
              #f8fafc 45%,
              #ecfdf5 100%
            );
          color: #17221b;
        }

        .background-glow {
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.35;
          pointer-events: none;
        }

        .glow-one {
          top: -150px;
          left: -150px;
          background: #86efac;
        }

        .glow-two {
          bottom: -180px;
          right: -120px;
          background: #bbf7d0;
        }

        .container {
          width: 100%;
          max-width: 950px;
          margin: auto;
          position: relative;
          z-index: 1;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
        }

        .icon-box {
          width: 68px;
          height: 68px;
          border-radius: 18px;
          background: #166534;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
          box-shadow:
            0 10px 30px rgba(22, 101, 52, 0.2);
        }

        .eyebrow {
          margin: 0 0 5px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #15803d;
        }

        h1 {
          margin: 0;
          font-size: 38px;
          line-height: 1.15;
          letter-spacing: -1px;
          color: #14532d;
        }

        .subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 15px;
          line-height: 1.6;
        }

        .card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(255,255,255,0.8);
          border-radius: 24px;
          padding: 35px;
          box-shadow:
            0 20px 60px rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(15px);
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 30px;
        }

        .section-number {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #dcfce7;
          color: #166534;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
        }

        .section-title h2 {
          margin: 0;
          font-size: 20px;
          color: #1e293b;
        }

        .section-title p {
          margin: 4px 0 0;
          color: #94a3b8;
          font-size: 13px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .field {
          display: flex;
          flex-direction: column;
        }

        label {
          font-size: 14px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 8px;
        }

        input,
        select {
          width: 100%;
          height: 48px;
          border: 1px solid #dbe3df;
          border-radius: 10px;
          background: #ffffff;
          padding: 0 14px;
          font-size: 14px;
          color: #1e293b;
          outline: none;
          transition: all 0.2s ease;
        }

        input:focus,
        select:focus {
          border-color: #22c55e;
          box-shadow:
            0 0 0 3px rgba(34, 197, 94, 0.12);
        }

        input:hover,
        select:hover {
          border-color: #94a3b8;
        }

        .hint {
          margin-top: 7px;
          font-size: 11px;
          color: #94a3b8;
        }

        .input-with-unit {
          position: relative;
        }

        .input-with-unit input {
          padding-right: 60px;
        }

        .input-with-unit span {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
        }

        .predict-button {
          width: 100%;
          height: 54px;
          margin-top: 32px;
          border: none;
          border-radius: 12px;
          background: #166534;
          color: white;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s ease;
          box-shadow:
            0 8px 20px rgba(22, 101, 52, 0.18);
        }

        .predict-button:hover:not(:disabled) {
          background: #14532d;
          transform: translateY(-1px);
          box-shadow:
            0 12px 25px rgba(22, 101, 52, 0.25);
        }

        .predict-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .arrow {
          font-size: 20px;
          margin-left: 4px;
        }

        .spinner {
          width: 17px;
          height: 17px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .error-box {
          margin-top: 25px;
          padding: 16px;
          border-radius: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          display: flex;
          gap: 12px;
          color: #991b1b;
        }

        .error-box strong {
          font-size: 14px;
        }

        .error-box p {
          margin: 4px 0 0;
          font-size: 13px;
        }

        .result-box {
          margin-top: 30px;
          padding: 28px;
          border-radius: 18px;
          background:
            linear-gradient(
              135deg,
              #f0fdf4,
              #dcfce7
            );
          border: 1px solid #bbf7d0;
          text-align: center;
        }

        .result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: left;
        }

        .result-label {
          margin: 0 0 5px;
          font-size: 11px;
          letter-spacing: 1.5px;
          font-weight: 800;
          color: #15803d;
        }

        .result-header h2 {
          margin: 0;
          font-size: 20px;
          color: #14532d;
        }

        .success-icon {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #16a34a;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: bold;
        }

        .result-value {
          margin-top: 20px;
          font-size: 52px;
          font-weight: 800;
          line-height: 1;
          color: #166534;
          letter-spacing: -2px;
        }

        .result-unit {
          margin-top: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
        }

        .result-info {
          margin-top: 22px;
          padding: 12px;
          border-radius: 10px;
          background: rgba(255,255,255,0.65);
          color: #64748b;
          font-size: 12px;
        }

        .result-info span {
          margin-right: 6px;
        }

        .footer {
          text-align: center;
          margin-top: 25px;
          color: #94a3b8;
          font-size: 12px;
        }

        @media (max-width: 700px) {

          .page {
            padding: 30px 15px;
          }

          .header {
            align-items: flex-start;
          }

          .icon-box {
            width: 55px;
            height: 55px;
            font-size: 27px;
          }

          h1 {
            font-size: 28px;
          }

          .card {
            padding: 22px;
            border-radius: 18px;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .result-value {
            font-size: 42px;
          }
        }

      `}</style>
    </main>
  );
}