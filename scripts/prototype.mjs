import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");

const port = Number(process.env.PORT || 8080);
const lat = Number(process.env.LAT || 31.7683);
const lon = Number(process.env.LON || 35.2137);
const locationName = process.env.LOCATION_NAME || "Jerusalem";
const timeZone = process.env.TIME_ZONE || "Asia/Jerusalem";

const weekdayNames = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone });
const weekdayShortNames = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone });
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone
});
const weekdayLookup = new Map([
  ["Sun", 0],
  ["Mon", 1],
  ["Tue", 2],
  ["Wed", 3],
  ["Thu", 4],
  ["Fri", 5],
  ["Sat", 6]
]);

const dayStyles = [
  { name: "Editorial Dawn", accent: "#f46d43", secondary: "#f9c74f", vibe: "clean editorial composition" },
  { name: "Blueprint Monday", accent: "#2952ff", secondary: "#7aa2ff", vibe: "architectural lines and calm geometry" },
  { name: "Watercolor Tuesday", accent: "#48a9a6", secondary: "#a0e3d8", vibe: "soft washes and layered shapes" },
  { name: "Neo Sketch Wednesday", accent: "#8e5ef0", secondary: "#c4b5fd", vibe: "futuristic sketchbook energy" },
  { name: "Travel Poster Thursday", accent: "#e76f51", secondary: "#f4a261", vibe: "bold poster design" },
  { name: "Cinema Friday", accent: "#f77f00", secondary: "#ffd166", vibe: "cinematic lighting and dramatic contrast" },
  { name: "Playful Saturday", accent: "#2a9d8f", secondary: "#90e0ef", vibe: "playful, slightly surreal" }
];

const weatherPalette = {
  clear: { bg1: "#f7d57a", bg2: "#f6a96b", ink: "#21263d" },
  cloudy: { bg1: "#b8c2cc", bg2: "#8793a6", ink: "#1d2533" },
  fog: { bg1: "#ced4da", bg2: "#aeb8c2", ink: "#1f2732" },
  rain: { bg1: "#6c8ebf", bg2: "#2e4f7b", ink: "#eef4ff" },
  storm: { bg1: "#4f5d75", bg2: "#1f2937", ink: "#f2f5ff" },
  snow: { bg1: "#dce9f6", bg2: "#a7c7e7", ink: "#18304b" }
};

const weatherCodeMap = new Map([
  [0, ["clear", "Clear sky", "Sunlit and open"]],
  [1, ["clear", "Mainly clear", "Bright with a few soft clouds"]],
  [2, ["cloudy", "Partly cloudy", "Part sun, part cloud"]],
  [3, ["cloudy", "Overcast", "Muted sky and softer contrast"]],
  [45, ["fog", "Fog", "Low visibility and diffused edges"]],
  [48, ["fog", "Rime fog", "Frosty haze"]],
  [51, ["rain", "Light drizzle", "Fine rain and reflective surfaces"]],
  [53, ["rain", "Drizzle", "Soft rainy texture"]],
  [55, ["rain", "Dense drizzle", "Persistent wet atmosphere"]],
  [56, ["rain", "Freezing drizzle", "Cold wet sheen"]],
  [57, ["rain", "Dense freezing drizzle", "Heavy cold mist"]],
  [61, ["rain", "Slight rain", "Light rain streaks"]],
  [63, ["rain", "Rain", "Steady rainfall"]],
  [65, ["rain", "Heavy rain", "Broader water motion and darker palette"]],
  [66, ["rain", "Freezing rain", "Glass-like rain surfaces"]],
  [67, ["rain", "Heavy freezing rain", "Sharp wet highlights"]],
  [71, ["snow", "Slight snow", "Gentle snowfall"]],
  [73, ["snow", "Snow", "Soft layered snow"]],
  [75, ["snow", "Heavy snow", "Dense wintry atmosphere"]],
  [77, ["snow", "Snow grains", "Small crystalline texture"]],
  [80, ["rain", "Rain showers", "Passing bursts of rain"]],
  [81, ["rain", "Rain showers", "Frequent showers"]],
  [82, ["rain", "Violent rain showers", "Intense rain bursts"]],
  [85, ["snow", "Snow showers", "Passing snow"]],
  [86, ["snow", "Heavy snow showers", "Thicker snowfall bursts"]],
  [95, ["storm", "Thunderstorm", "Electric sky and contrast"]],
  [96, ["storm", "Thunderstorm with hail", "Charged atmosphere"]],
  [99, ["storm", "Thunderstorm with heavy hail", "High intensity storm scene"]]
]);

function escapeXml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getWeekdayIndex(date) {
  return weekdayLookup.get(weekdayShortNames.format(date)) ?? date.getDay();
}

function weatherFallback() {
  const today = new Date();
  const code = [0, 1, 2, 3, 61, 63, 80, 95][today.getDate() % 8];
  const tempMax = 18 + today.getDay() * 2;
  const tempMin = tempMax - 6;
  const [theme, label, summary] = weatherCodeMap.get(code) || ["clear", "Clear sky", "Fallback forecast"];
  return { code, theme, label, summary, tempMax, tempMin, source: "fallback" };
}

async function fetchWeather() {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", timeZone);

  try {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`weather HTTP ${response.status}`);
    const data = await response.json();
    const code = data?.daily?.weather_code?.[0] ?? 0;
    const tempMax = data?.daily?.temperature_2m_max?.[0] ?? 0;
    const tempMin = data?.daily?.temperature_2m_min?.[0] ?? 0;
    const [theme, label, summary] = weatherCodeMap.get(code) || ["clear", "Clear sky", "Unknown forecast"];
    return { code, theme, label, summary, tempMax, tempMin, source: "open-meteo" };
  } catch (error) {
    return { ...weatherFallback(), error: error?.message || String(error) };
  }
}

function buildScene(context) {
  const { theme, style, dayLabel, dateLabel, weatherLabel, weatherSummary, tempText, tempMax, tempMin, weatherSource, locationName } = context;
  const palette = weatherPalette[theme] || weatherPalette.clear;
  const clouds = theme === "cloudy" || theme === "fog";
  const rain = theme === "rain" || theme === "storm";
  const snow = theme === "snow";

  const particles = [];
  if (rain) {
    for (let i = 0; i < 22; i++) {
      const x = 80 + i * 66;
      const y = 520 + (i % 4) * 18;
      particles.push(`<line x1="${x}" y1="${y}" x2="${x - 8}" y2="${y + 42}" stroke="rgba(255,255,255,0.48)" stroke-width="6" stroke-linecap="round"/>`);
    }
  }
  if (snow) {
    for (let i = 0; i < 18; i++) {
      const x = 90 + i * 74;
      const y = 470 + (i % 5) * 26;
      particles.push(`<g transform="translate(${x},${y})" opacity="0.85"><circle r="5" fill="white"/><path d="M0 -13V13M-13 0H13M-9 -9L9 9M-9 9L9 -9" stroke="white" stroke-width="2" stroke-linecap="round"/></g>`);
    }
  }
  if (theme === "storm") {
    for (let i = 0; i < 6; i++) {
      const x = 180 + i * 210;
      particles.push(`<path d="M${x} 500 L${x + 46} 500 L${x + 10} 590 L${x + 72} 590 L${x - 10} 730" stroke="#ffd166" stroke-width="12" stroke-linejoin="round" fill="none"/>`);
    }
  }

  const cloudGroup = clouds || rain || snow
    ? `<g opacity="0.95">
        <ellipse cx="330" cy="340" rx="150" ry="68" fill="rgba(255,255,255,0.42)"/>
        <ellipse cx="470" cy="320" rx="170" ry="82" fill="rgba(255,255,255,0.52)"/>
        <ellipse cx="635" cy="350" rx="145" ry="62" fill="rgba(255,255,255,0.36)"/>
      </g>`
    : `<g opacity="0.9">
        <circle cx="560" cy="330" r="130" fill="rgba(255,255,255,0.2)"/>
        <circle cx="770" cy="270" r="80" fill="rgba(255,255,255,0.18)"/>
      </g>`;

  return `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bg1}"/>
        <stop offset="100%" stop-color="${palette.bg2}"/>
      </linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0.06)"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="rgba(0,0,0,0.22)"/>
      </filter>
    </defs>
    <rect width="1600" height="1200" fill="url(#bg)"/>
    <circle cx="1280" cy="180" r="240" fill="rgba(255,255,255,0.12)"/>
    <circle cx="320" cy="1040" r="280" fill="rgba(255,255,255,0.08)"/>
    <path d="M0 860C180 810 340 900 520 880C730 855 900 760 1110 795C1280 823 1430 930 1600 900V1200H0Z" fill="rgba(20,24,32,0.18)"/>
    <path d="M0 910C230 845 390 960 580 940C760 920 915 835 1100 860C1290 886 1440 1010 1600 980V1200H0Z" fill="rgba(255,255,255,0.08)"/>
    ${cloudGroup}
    ${particles.join("\n")}

    <g filter="url(#shadow)">
      <rect x="110" y="110" width="1380" height="980" rx="44" fill="url(#glass)" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>
    </g>

    <g transform="translate(170 190)">
      <text x="0" y="0" fill="rgba(255,255,255,0.88)" font-size="34" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif" letter-spacing="4">${escapeXml(locationName.toUpperCase())}</text>
      <text x="0" y="86" fill="${palette.ink}" font-size="86" font-weight="800" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">${escapeXml(dayLabel)}</text>
      <text x="0" y="160" fill="${palette.ink}" font-size="38" font-weight="600" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">${escapeXml(dateLabel)}</text>

      <g transform="translate(0 230)">
        <rect x="0" y="0" width="660" height="520" rx="34" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.18)"/>
        <text x="46" y="74" fill="${palette.ink}" font-size="34" font-weight="700" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">Weather today</text>
        <text x="46" y="156" fill="${palette.ink}" font-size="70" font-weight="800" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">${escapeXml(weatherSummary)}</text>
        <text x="46" y="228" fill="${palette.ink}" font-size="34" font-weight="500" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">${escapeXml(weatherLabel)}</text>
        <text x="46" y="340" fill="${palette.ink}" font-size="112" font-weight="800" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">${escapeXml(tempText)}°</text>
        <text x="50" y="398" fill="${palette.ink}" font-size="28" font-weight="600" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">High ${escapeXml(String(tempMax))}° / Low ${escapeXml(String(tempMin))}°</text>
        <text x="50" y="452" fill="${palette.ink}" font-size="24" opacity="0.78" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">Source: ${escapeXml(weatherSource)}</text>
      </g>
    </g>

    <g transform="translate(860 210)">
      <rect x="0" y="0" width="620" height="780" rx="40" fill="rgba(0,0,0,0.08)" stroke="rgba(255,255,255,0.16)"/>
      <text x="46" y="70" fill="rgba(255,255,255,0.8)" font-size="28" letter-spacing="3" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">AI PROMPT IDEA</text>
      <rect x="46" y="96" width="126" height="14" rx="7" fill="${style.accent}"/>
      <rect x="180" y="96" width="126" height="14" rx="7" fill="${style.secondary}"/>
      <text x="46" y="136" fill="white" font-size="42" font-weight="800" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">${escapeXml(style.name)}</text>
      <text x="46" y="190" fill="rgba(255,255,255,0.86)" font-size="24" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">${escapeXml(style.vibe)}</text>
      <text x="46" y="260" fill="rgba(255,255,255,0.88)" font-size="28" font-weight="700" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">Day context</text>
      <text x="46" y="308" fill="rgba(255,255,255,0.92)" font-size="24" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">• ${escapeXml(dayLabel)}</text>
      <text x="46" y="348" fill="rgba(255,255,255,0.92)" font-size="24" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">• ${escapeXml(dateLabel)}</text>
      <text x="46" y="388" fill="rgba(255,255,255,0.92)" font-size="24" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">• ${escapeXml(weatherLabel)}</text>
      <text x="46" y="428" fill="rgba(255,255,255,0.92)" font-size="24" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">• ${escapeXml(weatherSummary)}</text>
      <text x="46" y="500" fill="rgba(255,255,255,0.88)" font-size="28" font-weight="700" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">Style</text>
      <text x="46" y="548" fill="rgba(255,255,255,0.92)" font-size="24" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">${escapeXml(style.vibe)}</text>
      <text x="46" y="590" fill="rgba(255,255,255,0.92)" font-size="24" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">${escapeXml(tempMax)}° / ${escapeXml(tempMin)}°</text>
      <rect x="46" y="620" width="528" height="92" rx="24" fill="rgba(255,255,255,0.12)"/>
      <text x="74" y="675" fill="white" font-size="26" font-weight="700" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif">Constant image URL: /current.svg</text>
    </g>
  `;
}

function buildPrompt(context) {
  return [
    "Create a single high-quality poster-style image for a fixed daily display.",
    "No logos, no watermark, no UI chrome.",
    "Leave room for a clear headline and weather summary.",
    `Location: ${context.locationName}.`,
    `Date: ${context.dateLabel}.`,
    `Weather: ${context.weatherLabel} (${context.weatherSummary}), high ${context.tempMax}C, low ${context.tempMin}C.`,
    `Art direction: ${context.style.name} with ${context.style.vibe}.`,
    "The result should feel calm, intentional, and readable on an e-ink screen."
  ].join(" ");
}

async function generateOnce() {
  await mkdir(publicDir, { recursive: true });

  const now = new Date();
  const weekdayIndex = getWeekdayIndex(now);
  const style = dayStyles[weekdayIndex];
  const dateLabel = dateFormatter.format(now);
  const dayLabel = weekdayNames.format(now);
  const weather = await fetchWeather();
  const tempMax = Math.round(Number(weather.tempMax));
  const tempMin = Math.round(Number(weather.tempMin));
  const tempText = clamp(Math.round((tempMax + tempMin) / 2), -30, 55);
  const weatherLabel = weather.label;
  const weatherSummary = weather.summary;
  const weatherSource = weather.source + (weather.error ? ` (${weather.error})` : "");
  const prompt = buildPrompt({
    locationName,
    dateLabel,
    weatherLabel,
    weatherSummary,
    tempMax,
    tempMin,
    style
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1200" width="1600" height="1200" role="img" aria-labelledby="title desc">
    <title id="title">${escapeXml(`Daily image for ${locationName}`)}</title>
    <desc id="desc">${escapeXml(prompt)}</desc>
    ${buildScene({
      theme: weather.theme,
      style,
      dayLabel,
      dateLabel,
      weatherLabel,
      weatherSummary,
      tempText,
      tempMax,
      tempMin,
      weatherSource,
      locationName
    })}
  </svg>
  `;

  const payload = {
    generatedAt: now.toISOString(),
    locationName,
    lat,
    lon,
    dateLabel,
    dayLabel,
    weekdayIndex,
    weather,
    style,
    imageUrl: "/current.svg",
    prompt
  };

  await writeFile(path.join(publicDir, "current.svg"), svg, "utf8");
  await writeFile(path.join(publicDir, "current.json"), JSON.stringify(payload, null, 2) + "\n", "utf8");
  await writeFile(path.join(publicDir, "current.prompt.txt"), prompt + "\n", "utf8");

  return payload;
}

async function serveStatic(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.join(publicDir, pathname);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type =
      ext === ".html" ? "text/html; charset=utf-8" :
      ext === ".svg" ? "image/svg+xml" :
      ext === ".json" ? "application/json; charset=utf-8" :
      ext === ".txt" ? "text/plain; charset=utf-8" :
      "application/octet-stream";

    const noCache = pathname === "/current.svg" || pathname === "/current.json" || pathname === "/current.prompt.txt";
    res.writeHead(200, {
      "content-type": type,
      "cache-control": noCache ? "no-cache, no-store, must-revalidate" : "public, max-age=0"
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not found");
  }
}

async function main() {
  const mode = process.argv[2] || "dev";
  const payload = await generateOnce();
  console.log(JSON.stringify({
    mode,
    imageUrl: payload.imageUrl,
    location: payload.locationName,
    date: payload.dateLabel,
    weather: payload.weather.label,
    tempMax: payload.weather.tempMax,
    tempMin: payload.weather.tempMin,
    output: {
      svg: path.join(publicDir, "current.svg"),
      json: path.join(publicDir, "current.json"),
      prompt: path.join(publicDir, "current.prompt.txt")
    }
  }, null, 2));

  if (mode === "build") return;

  const server = createServer((req, res) => {
    if (req.url === "/__refresh") {
      generateOnce()
        .then(updated => {
          res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ ok: true, generatedAt: updated.generatedAt || new Date().toISOString() }));
        })
        .catch(error => {
          res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ ok: false, error: error?.message || String(error) }));
        });
      return;
    }

    serveStatic(req, res).catch(error => {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      res.end(error?.message || String(error));
    });
  });

  server.listen(port, () => {
    console.log(`Serving http://127.0.0.1:${port}`);
    console.log(`Fixed image URL: http://127.0.0.1:${port}/current.svg`);
    console.log(`Refresh endpoint: http://127.0.0.1:${port}/__refresh`);
  });

  if (mode === "dev" || mode === "serve") {
    setInterval(() => {
      generateOnce().catch(error => {
        console.error("refresh failed:", error);
      });
    }, 30 * 60 * 1000);
  }
}

if (!existsSync(publicDir)) {
  await mkdir(publicDir, { recursive: true });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
