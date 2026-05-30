import { spawn } from "node:child_process";

const weatherCodeMap = new Map([
  [0, ["clear", "שמיים בהירים"]],
  [1, ["clear", "בהיר ברובו"]],
  [2, ["cloudy", "מעונן חלקית"]],
  [3, ["cloudy", "מעונן"]],
  [45, ["fog", "ערפל"]],
  [48, ["fog", "ערפל קפוא"]],
  [51, ["rain", "טפטוף קל"]],
  [53, ["rain", "טפטוף"]],
  [55, ["rain", "טפטוף כבד"]],
  [61, ["rain", "גשם קל"]],
  [63, ["rain", "גשם"]],
  [65, ["rain", "גשם כבד"]],
  [71, ["snow", "שלג קל"]],
  [73, ["snow", "שלג"]],
  [75, ["snow", "שלג כבד"]],
  [80, ["rain", "ממטרים"]],
  [95, ["storm", "סופת רעמים"]]
]);

const PERIOD_NAMES = ["בוקר", "צהריים", "ערב"];
const PERIOD_HOURS = [[6, 7, 8, 9, 10, 11], [12, 13, 14, 15, 16, 17], [18, 19, 20, 21, 22]];

export function getForecastAheadDays() {
  const n = Number(process.env.FORECAST_AHEAD_DAYS || 3);
  return Math.min(4, Math.max(3, Number.isFinite(n) ? n : 3));
}

function iconForTheme(theme) {
  if (theme === "clear") return "sun";
  if (theme === "cloudy" || theme === "fog") return "partly";
  if (theme === "rain" || theme === "storm") return "rain";
  if (theme === "snow") return "snow";
  return "partly";
}

function mapCode(code) {
  const entry = weatherCodeMap.get(code);
  if (entry) return { theme: entry[0], label: entry[1] };
  return { theme: "cloudy", label: "מעונן חלקית" };
}

function stripTempFromSummary(summary) {
  return String(summary || "")
    .replace(/,?\s*\d+\s*°\s*C?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dateKeyInTimeZone(timeZone, date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

/** שם יום בשבוע בעברית (יום ראשון, יום שני, …) */
function forecastDayLabel(dayOffset, isoDate, timeZone) {
  let iso = isoDate;
  if (!iso) {
    const [y, m, d] = dateKeyInTimeZone(timeZone).split("-").map(Number);
    const shifted = new Date(Date.UTC(y, m - 1, d + dayOffset, 12, 0, 0));
    iso = dateKeyInTimeZone(timeZone, shifted);
  }
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    timeZone
  }).format(new Date(`${iso}T12:00:00`));
}

function hourInTimeZone(isoHour, timeZone) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "numeric",
      hour12: false
    }).format(new Date(isoHour))
  );
}

function estimatePeriodTemps(tempRange) {
  const parts = String(tempRange)
    .split("-")
    .map(value => Number(value.trim()))
    .filter(Number.isFinite);
  const low = parts[0] ?? 18;
  const high = parts[1] ?? low + 8;
  const mid = Math.round((low + high) / 2);
  return { בוקר: low, צהריים: high, ערב: mid };
}

function periodsFromHourly(hourly, timeZone, fallbackLabel, tempRange) {
  const estimated = estimatePeriodTemps(tempRange);

  if (!hourly?.time?.length) {
    return PERIOD_NAMES.map(name => ({
      name,
      label: fallbackLabel,
      icon: "partly",
      temp: estimated[name]
    }));
  }

  return PERIOD_NAMES.map((name, index) => {
    const hours = PERIOD_HOURS[index];
    const codes = [];
    const temps = [];
    for (let i = 0; i < hourly.time.length; i++) {
      const h = hourInTimeZone(hourly.time[i], timeZone);
      if (hours.includes(h)) {
        codes.push(hourly.weather_code[i]);
        const t = hourly.temperature_2m?.[i];
        if (Number.isFinite(t)) temps.push(t);
      }
    }
    const code = codes[Math.floor(codes.length / 2)] ?? hourly.weather_code[0] ?? 2;
    const mapped = mapCode(code);
    const temp = temps.length
      ? Math.round(temps.reduce((sum, value) => sum + value, 0) / temps.length)
      : estimated[name];
    return { name, label: mapped.label, icon: iconForTheme(mapped.theme), temp };
  });
}

function parseTempHigh(tempRange) {
  const parts = String(tempRange)
    .split("-")
    .map(value => Number(value.trim()))
    .filter(Number.isFinite);
  if (!parts.length) return 0;
  return Math.max(...parts);
}

function formatTimeLocal(isoLocal, timeZone) {
  if (!isoLocal) return "—";
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone
  }).format(new Date(isoLocal));
}

function windDescription(speedKmh) {
  const speed = Math.round(Number(speedKmh) || 0);
  const label = speed < 8 ? "רוח קלה" : speed < 20 ? "רוח מתונה" : "רוח חזקה";
  return speed > 0 ? `${label} · ${speed} קמ״ש` : label;
}

function buildTrend(todayHigh, tomorrowHigh) {
  if (!Number.isFinite(todayHigh) || !Number.isFinite(tomorrowHigh)) return "";
  const diff = tomorrowHigh - todayHigh;
  if (diff >= 2) return `מחר חם יותר (+${diff}°)`;
  if (diff <= -2) return `מחר קריר יותר (${diff}°)`;
  return "מחר מזג דומה";
}

function pickHeroIcon(today, heroRaw) {
  if (heroRaw?.icon) return heroRaw.icon;
  const midday = today.periods?.find(period => period.name === "צהריים");
  return midday?.icon || today.periods?.[0]?.icon || "partly";
}

function buildHero(today, ahead, heroRaw, timeZone) {
  const tempHigh = Math.round(Number(heroRaw?.tempHigh) || parseTempHigh(today.tempRange));
  const tomorrow = ahead?.[0];
  return {
    icon: pickHeroIcon(today, heroRaw),
    summary: stripTempFromSummary(heroRaw?.summary || today.summary),
    tempHigh,
    sunrise: heroRaw?.sunrise || "05:42",
    sunset: heroRaw?.sunset || "19:28",
    wind: heroRaw?.wind || "רוח קלה",
    trend: heroRaw?.trend || buildTrend(tempHigh, tomorrow?.high)
  };
}

function normalizePeriods(periods, fallbackLabel, tempRange) {
  const list = Array.isArray(periods) ? periods : [];
  const estimated = estimatePeriodTemps(tempRange);
  return PERIOD_NAMES.map((name, index) => {
    const item = list[index] || list.find(p => p?.name === name) || {};
    const label = item.label || fallbackLabel;
    const tempRaw = Number(item.temp);
    const temp = Number.isFinite(tempRaw) ? Math.round(tempRaw) : estimated[name];
    return {
      name,
      label,
      icon: item.icon || iconForTheme("cloudy"),
      temp
    };
  });
}

export function normalizeWeatherData(raw, timeZone) {
  const aheadDays = getForecastAheadDays();
  const legacyForecast = Array.isArray(raw?.forecast) ? raw.forecast : [];
  const legacyCurrent = raw?.current || {};

  const todayFromRaw = raw?.today || {
    summary: stripTempFromSummary(legacyCurrent.summary || legacyForecast[0]?.label || ""),
    tempRange: legacyCurrent.tempRange || `${legacyForecast[0]?.low ?? 18}-${legacyForecast[0]?.high ?? 26}`,
    humidity: legacyCurrent.humidity ?? 60,
    periods: legacyCurrent.periods
  };

  const aheadFromRaw = Array.isArray(raw?.ahead)
    ? raw.ahead
    : legacyForecast.slice(1, 1 + aheadDays).map((day, index) => ({
        dayLabel: forecastDayLabel(index + 1, day.isoDate, timeZone),
        high: day.high,
        low: day.low,
        icon: day.icon || "partly",
        label: day.label || ""
      }));

  while (aheadFromRaw.length < aheadDays) {
    const i = aheadFromRaw.length;
    aheadFromRaw.push({
      dayLabel: forecastDayLabel(i + 1, null, timeZone),
      high: 26,
      low: 18,
      icon: "partly",
      label: "מעונן חלקית"
    });
  }

  const normalized = {
    source: raw?.source || "unknown",
    locationLine: raw?.locationLine || "",
    dateLine: raw?.dateLine || "",
    today: {
      summary: stripTempFromSummary(todayFromRaw.summary),
      tempRange: String(todayFromRaw.tempRange || ""),
      humidity: todayFromRaw.humidity ?? 60,
      periods: normalizePeriods(
        todayFromRaw.periods,
        todayFromRaw.summary || "מעונן חלקית",
        todayFromRaw.tempRange
      )
    },
    ahead: aheadFromRaw.slice(0, aheadDays).map((day, index) => ({
      dayLabel: forecastDayLabel(index + 1, day.isoDate, timeZone),
      high: Math.round(Number(day.high)),
      low: Math.round(Number(day.low)),
      icon: day.icon || "partly",
      label: day.label || ""
    }))
  };

  normalized.hero = buildHero(normalized.today, normalized.ahead, raw?.hero, timeZone);
  return normalized;
}

function extractJson(text) {
  const trimmed = String(text || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object in Gemini output");
  return JSON.parse(candidate.slice(start, end + 1));
}

function runGeminiCli(prompt) {
  const args = [
    "--yes",
    "@google/gemini-cli",
    "--skip-trust",
    "-p",
    prompt,
    "-o",
    "json",
    "--accept-raw-output-risk"
  ];

  return new Promise((resolve, reject) => {
    const child = spawn("npx", args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        GEMINI_CLI_TRUST_WORKSPACE: "true"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", chunk => {
      stdout += chunk;
    });
    child.stderr.on("data", chunk => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", code => {
      const combined = stdout.trim() || stderr.trim();
      if (code !== 0) {
        reject(new Error(combined || `gemini exited ${code}`));
        return;
      }
      try {
        const envelope = JSON.parse(stdout);
        if (envelope?.error) {
          reject(new Error(envelope.error.message || "Gemini CLI error"));
          return;
        }
      } catch {
        // ok
      }
      resolve(stdout);
    });
  });
}

function parseGeminiEnvelope(stdout) {
  const envelope = JSON.parse(stdout);
  if (envelope?.error) {
    throw new Error(envelope.error.message || "Gemini CLI error");
  }

  const responseText =
    envelope?.response ??
    envelope?.result ??
    envelope?.text ??
    envelope?.output ??
    (typeof envelope === "string" ? envelope : null);

  if (!responseText) {
    throw new Error("Gemini CLI returned no response text");
  }

  return typeof responseText === "string" ? responseText : JSON.stringify(responseText);
}

export async function fetchWeatherFromGemini({ lat, lon, locationName, timeZone }) {
  const aheadDays = getForecastAheadDays();
  const prompt = [
    "אתה מחולל נתוני מזג אוויר לתצוגה בעברית.",
    `מיקום: ${locationName} (${lat}, ${lon}), אזור זמן: ${timeZone}.`,
    "החזר JSON בלבד (בלי markdown):",
    "{",
    '  "locationLine": "חולון, ישראל",',
    '  "dateLine": "יום שבת, 30 במאי 2026",',
    '  "today": {',
    '    "summary": "בהיר עד מעונן חלקית",',
    '    "tempRange": "19-27",',
    '    "humidity": 65,',
    '    "periods": [',
    '      { "name": "בוקר", "label": "בהיר", "icon": "sun", "temp": 21 },',
    '      { "name": "צהריים", "label": "מעונן חלקית", "icon": "partly", "temp": 27 },',
    '      { "name": "ערב", "label": "נוח", "icon": "partly", "temp": 23 }',
    "    ]",
    "  },",
    '  "hero": {',
    '    "icon": "partly",',
    '    "summary": "בהיר ונוח",',
    '    "tempHigh": 27,',
    '    "sunrise": "05:42",',
    '    "sunset": "19:28",',
    '    "wind": "רוח קלה · 12 קמ״ש",',
    '    "trend": "מחר חם יותר (+2°)"',
    "  },",
    '  "ahead": [',
    '    { "dayLabel": "יום ראשון", "high": 28, "low": 20, "icon": "sun", "label": "בהיר" },',
    '    { "dayLabel": "יום שני", "high": 27, "low": 19, "icon": "partly", "label": "מעונן חלקית" },',
    '    { "dayLabel": "יום שלישי", "high": 26, "low": 18, "icon": "cloud", "label": "מעונן" }',
    "  ]",
    "}",
    `ahead: בדיוק ${aheadDays} ימים, כל אחד עם dayLabel = שם יום בשבוע בעברית (יום ראשון, יום שני…). לא מחר/מחרתיים.`,
    "today.summary: ללא טמפרטורה נוכחית (בלי °C).",
    "today.periods: בדיוק 3 — בוקר, צהריים, ערב; לכל אחד temp (מספר שלם בצלזיוס), label קצר, icon.",
    'icon: "sun", "partly", "cloud", "rain", "storm", "snow".'
  ].join("\n");

  const stdout = await runGeminiCli(prompt);
  const responseText = parseGeminiEnvelope(stdout);
  const parsed = extractJson(responseText);

  if (!parsed?.today || !Array.isArray(parsed.ahead) || parsed.ahead.length < aheadDays) {
    throw new Error("Gemini weather JSON incomplete");
  }

  return normalizeWeatherData({ ...parsed, source: "gemini-cli" }, timeZone);
}

export async function fetchWeatherOpenMeteo({ lat, lon, locationName, timeZone }) {
  const aheadDays = getForecastAheadDays();
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,wind_speed_10m_max"
  );
  url.searchParams.set("hourly", "weather_code,temperature_2m");
  url.searchParams.set("forecast_days", String(1 + aheadDays));
  url.searchParams.set("timezone", timeZone);

  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`open-meteo HTTP ${response.status}`);
  const data = await response.json();

  const now = new Date();
  const dateLine = new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone
  }).format(now);

  const codeToday = data?.daily?.weather_code?.[0] ?? 2;
  const mappedToday = mapCode(codeToday);
  const tempMax = Math.round(data?.daily?.temperature_2m_max?.[0] ?? 0);
  const tempMin = Math.round(data?.daily?.temperature_2m_min?.[0] ?? 0);

  const ahead = (data?.daily?.time || []).slice(1, 1 + aheadDays).map((isoDate, index) => {
    const i = index + 1;
    const mapped = mapCode(data.daily.weather_code[i]);
    return {
      dayLabel: forecastDayLabel(i, isoDate, timeZone),
      isoDate,
      high: Math.round(data.daily.temperature_2m_max[i]),
      low: Math.round(data.daily.temperature_2m_min[i]),
      icon: iconForTheme(mapped.theme),
      label: mapped.label
    };
  });

  const windSpeed = data?.daily?.wind_speed_10m_max?.[0] ?? 0;

  return normalizeWeatherData(
    {
      source: "open-meteo",
      locationLine: `${locationName}, ישראל`,
      dateLine,
      hero: {
        icon: iconForTheme(mappedToday.theme),
        summary: mappedToday.label,
        tempHigh: tempMax,
        sunrise: formatTimeLocal(data?.daily?.sunrise?.[0], timeZone),
        sunset: formatTimeLocal(data?.daily?.sunset?.[0], timeZone),
        wind: windDescription(windSpeed)
      },
      today: {
        summary: mappedToday.label,
        tempRange: `${tempMin}-${tempMax}`,
        humidity: 60,
        periods: periodsFromHourly(
          data.hourly,
          timeZone,
          mappedToday.label,
          `${tempMin}-${tempMax}`
        )
      },
      ahead
    },
    timeZone
  );
}

function buildStaticFallback(context) {
  const now = new Date();
  const timeZone = context.timeZone;
  const dateLine = new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone
  }).format(now);

  const aheadDays = getForecastAheadDays();
  const ahead = Array.from({ length: aheadDays }, (_, index) => ({
    dayLabel: forecastDayLabel(index + 1, null, timeZone),
    high: 27 - index,
    low: 19 - index,
    icon: index % 2 === 0 ? "sun" : "partly",
    label: index % 2 === 0 ? "בהיר" : "מעונן חלקית"
  }));

  return normalizeWeatherData(
    {
      source: "fallback",
      locationLine: `${context.locationName}, ישראל`,
      dateLine,
      hero: {
        icon: "partly",
        summary: "בהיר ונוח",
        tempHigh: 27,
        sunrise: "05:42",
        sunset: "19:28",
        wind: "רוח קלה · 10 קמ״ש",
        trend: "מחר חם יותר (+1°)"
      },
      today: {
        summary: "בהיר עד מעונן חלקית",
        tempRange: "19-27",
        humidity: 65,
        periods: [
          { name: "בוקר", label: "בהיר", icon: "sun", temp: 21 },
          { name: "צהריים", label: "מעונן חלקית", icon: "partly", temp: 27 },
          { name: "ערב", label: "נוח", icon: "partly", temp: 23 }
        ]
      },
      ahead
    },
    timeZone
  );
}

export async function fetchWeather(context) {
  const useGemini = process.env.WEATHER_PROVIDER !== "open-meteo";
  if (useGemini) {
    try {
      return await fetchWeatherFromGemini(context);
    } catch (error) {
      console.warn("Gemini weather failed, using open-meteo:", error?.message || error);
    }
  }

  try {
    return await fetchWeatherOpenMeteo(context);
  } catch (error) {
    console.warn("open-meteo failed, using static fallback:", error?.message || error);
    return buildStaticFallback(context);
  }
}
