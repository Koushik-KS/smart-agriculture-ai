"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { indiaLocations } from "../../data/indiaLocations";

type WeatherResult = {
  temperature: number | null;
  humidity: number | null;
  current_precipitation: number | null;
  recent_precipitation: number;
  temperature_unit: string;
  humidity_unit: string;
  precipitation_unit: string;
};

type LocationResult = {
  latitude: number;
  longitude: number;
  name: string;
  admin1: string | null;
  admin2: string | null;
  location_confidence: string;
};

export default function WeatherPage() {
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");

  const [location, setLocation] =
    useState<LocationResult | null>(null);

  const [weather, setWeather] =
    useState<WeatherResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedState = useMemo(
    () =>
      indiaLocations.find(
        (item) => item.state === state
      ),
    [state]
  );

  const districts =
    selectedState?.districts ?? [];

  const handleStateChange = (
    value: string
  ) => {
    setState(value);
    setDistrict("");
    setLocation(null);
    setWeather(null);
    setError("");
  };

  const fetchWeather = async () => {
    if (!state || !district) {
      setError(
        "Please select both state and district."
      );
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);
    setLocation(null);

    try {
      const geocodeResponse =
        await fetch(
          `/api/geocode?state=${encodeURIComponent(
            state
          )}&district=${encodeURIComponent(
            district
          )}`,
          {
            cache: "no-store",
          }
        );

      const geocodeData =
        await geocodeResponse.json();

      if (!geocodeResponse.ok) {
        throw new Error(
          geocodeData.message ||
            "Unable to find the selected location."
        );
      }

      setLocation(geocodeData);

      const weatherResponse =
        await fetch(
          `/api/weather?latitude=${encodeURIComponent(
            geocodeData.latitude
          )}&longitude=${encodeURIComponent(
            geocodeData.longitude
          )}`,
          {
            cache: "no-store",
          }
        );

      const weatherData =
        await weatherResponse.json();

      if (!weatherResponse.ok) {
        throw new Error(
          weatherData.message ||
            "Unable to fetch weather information."
        );
      }

      setWeather(weatherData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch weather information."
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setState("");
    setDistrict("");
    setLocation(null);
    setWeather(null);
    setError("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="mb-8 flex flex-col gap-4 rounded-2xl border border-white/70 bg-white/90 px-5 py-4 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">

          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-700 text-white shadow-md">
              <AgricultureIcon />
            </div>

            <div>
              <p className="text-lg font-black text-green-950">
                Smart Agriculture AI
              </p>

              <p className="text-xs font-semibold text-green-700">
                Intelligent farming platform
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap gap-2">

            <NavItem
              href="/"
              label="Crop AI"
              icon={<CropIcon />}
            />

            <NavItem
              href="/plant-disease"
              label="Plant Disease"
              icon={<DiseaseIcon />}
            />

            <NavItem
              href="/yield-prediction"
              label="Yield Prediction"
              icon={<ChartIcon />}
            />

            <NavItem
              href="/recommendation"
              label="Recommendation"
              icon={<RecommendationIcon />}
            />

            <NavItem
              href="/weather"
              label="Weather"
              icon={<WeatherIcon />}
              active
            />

            <NavItem
              href="/ai-analysis"
              label="AI Analysis"
              icon={<AIIcon />}
            />

          </div>
        </nav>

        {/* =================================================
            HERO
        ================================================= */}

        <section className="mb-10 text-center">

          <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-green-700 shadow-sm">

            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />

            Weather Intelligence
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">

            Agricultural

            <span className="block bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 bg-clip-text text-transparent">
              Weather Insights
            </span>

          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            Select an Indian state and district to
            retrieve current weather conditions and
            recent precipitation for agricultural
            analysis.
          </p>

        </section>

        {/* =================================================
            INPUT CARD
        ================================================= */}

        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-green-900/10 backdrop-blur-xl md:p-8">

          <div className="flex items-start gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <LocationWeatherIcon />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                01 • Location
              </p>

              <h2 className="mt-1 text-2xl font-black text-gray-950">
                Select Farm Location
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                The selected location is converted to
                coordinates and used to retrieve
                weather information.
              </p>
            </div>

          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">

            {/* STATE */}

            <div>
              <label
                htmlFor="state"
                className="mb-2 block text-sm font-bold text-gray-700"
              >
                State / Union Territory
              </label>

              <select
                id="state"
                value={state}
                onChange={(event) =>
                  handleStateChange(
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
              >
                <option value="">
                  Select state
                </option>

                {indiaLocations.map(
                  (item) => (
                    <option
                      key={item.state}
                      value={item.state}
                    >
                      {item.state}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* DISTRICT */}

            <div>
              <label
                htmlFor="district"
                className="mb-2 block text-sm font-bold text-gray-700"
              >
                District
              </label>

              <select
                id="district"
                value={district}
                disabled={!state}
                onChange={(event) => {
                  setDistrict(
                    event.target.value
                  );

                  setWeather(null);
                  setLocation(null);
                  setError("");
                }}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {state
                    ? "Select district"
                    : "Select state first"}
                </option>

                {districts.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

              <p className="font-black">
                Weather Request Failed
              </p>

              <p className="mt-1">
                {error}
              </p>

            </div>
          )}

          {/* =================================================
              BUTTONS
          ================================================= */}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">

            <button
              type="button"
              onClick={fetchWeather}
              disabled={
                loading ||
                !state ||
                !district
              }
              className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-green-700 via-emerald-600 to-green-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-green-700/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                  Fetching Weather...
                </>
              ) : (
                <>
                  <WeatherIcon />

                  Get Weather

                  <span className="text-lg">
                    →
                  </span>
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

        </section>

        {/* =================================================
            LOCATION RESULT
        ================================================= */}

        {location && (
          <section className="mt-7 rounded-3xl border border-green-100 bg-white p-6 shadow-xl md:p-8">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <MapPinIcon />
              </div>

              <div>

                <p className="text-xs font-black uppercase tracking-wider text-green-600">
                  Location Resolved
                </p>

                <h2 className="mt-1 text-xl font-black text-gray-950">
                  {location.name}
                </h2>

              </div>

            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">

              <Metric
                label="Latitude"
                value={location.latitude.toFixed(4)}
              />

              <Metric
                label="Longitude"
                value={location.longitude.toFixed(4)}
              />

              <Metric
                label="Match Confidence"
                value={location.location_confidence}
              />

            </div>

          </section>
        )}

        {/* =================================================
            WEATHER RESULT
        ================================================= */}

        {weather && (
          <section className="mt-7">

            <div className="mb-5">

              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-600">
                02 • Current Conditions
              </p>

              <h2 className="mt-2 text-3xl font-black text-gray-950">
                Weather Analysis
              </h2>

            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <WeatherCard
                icon={<ThermometerIcon />}
                label="Temperature"
                value={
                  weather.temperature !== null
                    ? `${weather.temperature} ${weather.temperature_unit}`
                    : "Unavailable"
                }
              />

              <WeatherCard
                icon={<HumidityIcon />}
                label="Humidity"
                value={
                  weather.humidity !== null
                    ? `${weather.humidity}${weather.humidity_unit}`
                    : "Unavailable"
                }
              />

              <WeatherCard
                icon={<RainIcon />}
                label="Current Rain"
                value={
                  weather.current_precipitation !==
                  null
                    ? `${weather.current_precipitation} ${weather.precipitation_unit}`
                    : "Unavailable"
                }
              />

              <WeatherCard
                icon={<ChartIcon />}
                label="Recent Precipitation"
                value={`${weather.recent_precipitation} ${weather.precipitation_unit}`}
              />

            </div>

            {/* AGRICULTURAL CONTEXT */}

            <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-5">

              <div className="flex items-start gap-3">

                <div className="mt-0.5 text-blue-700">
                  <AgricultureContextIcon />
                </div>

                <div>

                  <p className="text-sm font-black text-blue-900">
                    Agricultural Context
                  </p>

                  <p className="mt-2 text-sm leading-6 text-blue-800">
                    These weather values can be used as
                    environmental context for crop
                    planning and the integrated AI
                    analysis workflow. Weather data is
                    retrieved dynamically rather than
                    stored as a static value.
                  </p>

                </div>

              </div>

            </div>

            <p className="mt-5 text-center text-xs leading-5 text-gray-400">
              Weather data is retrieved through the
              Open-Meteo API using the resolved
              geographic coordinates.
            </p>

          </section>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="mt-10 pb-8 text-center">

          <p className="text-xs font-semibold text-gray-400">
            Smart Agriculture AI • Weather Integration
          </p>

          <p className="mt-1 text-[11px] text-gray-400">
            Dynamic weather context for agricultural
            decision support
          </p>

        </footer>

      </div>
    </main>
  );
}

/* =========================================================
   NAV ITEM
========================================================= */

function NavItem({
  href,
  label,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-bold text-white shadow-md"
          : "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-green-50 hover:text-green-700"
      }
    >
      <span className="flex h-4 w-4 items-center justify-center">
        {icon}
      </span>

      {label}
    </Link>
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
    <div className="rounded-2xl bg-gray-50 p-4">

      <p className="text-xs font-black uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-lg font-black capitalize text-gray-800">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   WEATHER CARD
========================================================= */

function WeatherCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white p-6 shadow-xl shadow-green-900/5">

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
        {icon}
      </div>

      <p className="mt-5 text-xs font-black uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-green-700">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   PROFESSIONAL SVG ICONS
========================================================= */

function IconWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function AgricultureIcon() {
  return (
    <IconWrapper>
      <path d="M12 20V10" />
      <path d="M12 14C8 14 6 12 6 8c4 0 6 2 6 6Z" />
      <path d="M12 11c0-4 2-6 6-6 0 4-2 6-6 6Z" />
      <path d="M8 20h8" />
    </IconWrapper>
  );
}

function CropIcon() {
  return (
    <IconWrapper>
      <path d="M12 21V9" />
      <path d="M12 13C8 13 6 11 6 7c4 0 6 2 6 6Z" />
      <path d="M12 11c0-4 2-6 6-6 0 4-2 6-6 6Z" />
    </IconWrapper>
  );
}

function DiseaseIcon() {
  return (
    <IconWrapper>
      <path d="M12 21c4.5-2 7-5.7 7-10.5V5l-7-2-7 2v5.5C5 15.3 7.5 19 12 21Z" />
      <path d="M9 12h6" />
      <path d="M12 9v6" />
    </IconWrapper>
  );
}

function ChartIcon() {
  return (
    <IconWrapper>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 3-4 3 2 4-6" />
      <path d="M17 7h2v2" />
    </IconWrapper>
  );
}

function RecommendationIcon() {
  return (
    <IconWrapper>
      <circle cx="12" cy="12" r="8" />
      <path d="m9 12 2 2 4-4" />
    </IconWrapper>
  );
}

function WeatherIcon() {
  return (
    <IconWrapper>
      <path d="M7 18h9a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 6 11.5 3.5 3.5 0 0 0 7 18Z" />
      <path d="M8 21h.01" />
      <path d="M12 21h.01" />
      <path d="M16 21h.01" />
    </IconWrapper>
  );
}

function AIIcon() {
  return (
    <IconWrapper>
      <rect x="5" y="5" width="14" height="14" rx="3" />
      <path d="M9 9h6v6H9z" />
      <path d="M9 2v3" />
      <path d="M15 2v3" />
      <path d="M9 19v3" />
      <path d="M15 19v3" />
      <path d="M2 9h3" />
      <path d="M2 15h3" />
      <path d="M19 9h3" />
      <path d="M19 15h3" />
    </IconWrapper>
  );
}

function LocationWeatherIcon() {
  return (
    <IconWrapper>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </IconWrapper>
  );
}

function MapPinIcon() {
  return (
    <IconWrapper>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </IconWrapper>
  );
}

function ThermometerIcon() {
  return (
    <IconWrapper>
      <path d="M14 14.5V5a2 2 0 0 0-4 0v9.5a4 4 0 1 0 4 0Z" />
      <path d="M12 17v-5" />
    </IconWrapper>
  );
}

function HumidityIcon() {
  return (
    <IconWrapper>
      <path d="M12 3s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11Z" />
      <path d="M9 15a3 3 0 0 0 3 3" />
    </IconWrapper>
  );
}

function RainIcon() {
  return (
    <IconWrapper>
      <path d="M7 17h9a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 6 10.5 3.5 3.5 0 0 0 7 17Z" />
      <path d="M9 20v1" />
      <path d="M13 20v1" />
      <path d="M17 20v1" />
    </IconWrapper>
  );
}

function AgricultureContextIcon() {
  return (
    <IconWrapper>
      <path d="M12 20V9" />
      <path d="M12 13C8 13 6 11 6 7c4 0 6 2 6 6Z" />
      <path d="M12 11c0-4 2-6 6-6 0 4-2 6-6 6Z" />
      <path d="M5 20h14" />
    </IconWrapper>
  );
}