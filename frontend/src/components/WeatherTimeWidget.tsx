import React, { useEffect, useState } from "react";

const IFRANE_COORDS = {
  lat: 33.5333,
  lon: -5.1167,
};

type WeatherData = {
  temp: number;
  feelsLike?: number;
  wind?: number;
  description: string;
};

type TimeData = {
  iso: string;
  baseMs: number;
  fetchedAt: number;
};

const weatherLabel = (code: number) => {
  // Simplified mapping for open-meteo weather codes
  if ([0].includes(code)) return { text: "Clear sky", icon: "☀️" };
  if ([1, 2, 3].includes(code)) return { text: "Partly cloudy", icon: "⛅" };
  if ([45, 48].includes(code)) return { text: "Foggy", icon: "🌫️" };
  if ([51, 53, 55, 56, 57].includes(code)) return { text: "Drizzle", icon: "🌦️" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { text: "Rain", icon: "🌧️" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { text: "Snow", icon: "❄️" };
  if ([95, 96, 99].includes(code)) return { text: "Stormy", icon: "⛈️" };
  return { text: "N/A", icon: "ℹ️" };
};

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Casablanca",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(iso));

export default function WeatherTimeWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [time, setTime] = useState<TimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ weather?: string; time?: string }>({});
  const [tick, setTick] = useState(Date.now()); // drives live clock updates

  useEffect(() => {
    let isMounted = true;

    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${IFRANE_COORDS.lat}&longitude=${IFRANE_COORDS.lon}&current_weather=true&timezone=Africa%2FCasablanca&forecast_days=1`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("weather");
        const json = await res.json();
        const cw = json.current_weather;
        const label = weatherLabel(cw?.weathercode ?? 0);
        if (isMounted) {
          setWeather({
            temp: cw?.temperature ?? 0,
            feelsLike: cw?.temperature ?? undefined,
            wind: cw?.windspeed ?? undefined,
            description: `${label.icon} ${label.text}`,
          });
          setError((e) => ({ ...e, weather: undefined }));
        }
      } catch (err) {
        console.error("Weather fetch failed", err);
        if (isMounted) setError((e) => ({ ...e, weather: "Unavailable" }));
      }
    };

    const fetchTime = async () => {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const fallbacks = [
        "https://worldtimeapi.org/api/timezone/Africa/Casablanca",
        `${apiBase}/time/morocco`,
      ];
      for (const url of fallbacks) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const json = await res.json();
          const iso = json.datetime || json.iso;
          if (!iso) continue;
          if (isMounted) {
            setTime({ iso, baseMs: new Date(iso).getTime(), fetchedAt: Date.now() });
            setError((e) => ({ ...e, time: undefined }));
          }
          return;
        } catch (err) {
          console.error("Time fetch failed", url, err);
          // try next
        }
      }
      if (isMounted) setError((e) => ({ ...e, time: "Unavailable" }));
    };

    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchWeather(), fetchTime()]);
      if (isMounted) setLoading(false);
    };

    fetchAll();
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // advance clock every second without re-fetching
  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const derivedTime = (() => {
    if (!time) return null;
    const delta = tick - time.fetchedAt;
    const ms = time.baseMs + delta;
    return new Date(ms);
  })();

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-2xl p-4 shadow-md bg-gradient-to-br from-[#063830] to-[#0b5a4e] text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Ifrane Weather</h3>
          <span className="text-sm opacity-80">Live</span>
        </div>
        {loading ? (
          <p className="text-sm opacity-80">Loading weather…</p>
        ) : weather ? (
          <div className="space-y-2">
            <p className="text-3xl font-bold leading-tight">
              {Math.round(weather.temp)}°C{" "}
              <span className="text-sm font-medium opacity-80">
                {weather.feelsLike !== undefined
                  ? `feels like ${Math.round(weather.feelsLike)}°C`
                  : ""}
              </span>
            </p>
            <p className="text-lg">{weather.description}</p>
            {weather.wind !== undefined && (
              <p className="text-sm opacity-80">Wind: {Math.round(weather.wind)} km/h</p>
            )}
          </div>
        ) : (
          <p className="text-sm opacity-80">
            {error.weather ? error.weather : "Weather unavailable."}
          </p>
        )}
      </div>

      <div className="rounded-2xl p-4 shadow-md bg-white border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-[#063830]">Ifrane Time</h3>
          <span className="text-xs text-gray-500">Africa/Casablanca</span>
        </div>
        {loading ? (
          <p className="text-sm text-gray-600">Loading time…</p>
        ) : time?.iso ? (
          <div className="space-y-1">
            <p className="text-3xl font-bold text-[#063830]">
              {(derivedTime ?? new Date(time.iso)).toLocaleTimeString("en-GB", {
                timeZone: "Africa/Casablanca",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-sm text-gray-600">{formatTime(time.iso)}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            {error.time ? error.time : "Time unavailable."}
          </p>
        )}
      </div>
    </div>
  );
}
