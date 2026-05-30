/** Shared weather theme + visual style presets for background providers. */

export const WEATHER_THEMES = {
  clear: {
    mood: "clear sunny sky, warm golden light, open horizon",
    unsplashQuery: "watercolor sunrise landscape warm golden hour"
  },
  cloudy: {
    mood: "soft cloudy sky, diffused daylight, calm atmosphere",
    unsplashQuery: "soft watercolor cloudy sky pastoral landscape"
  },
  fog: {
    mood: "misty fog, muted tones, gentle haze",
    unsplashQuery: "misty watercolor hills muted morning"
  },
  rain: {
    mood: "rainy weather, wet surfaces, cool blue-grey tones",
    unsplashQuery: "watercolor rainy landscape soft blue grey"
  },
  storm: {
    mood: "dramatic storm clouds, deep contrast, brooding sky",
    unsplashQuery: "dramatic watercolor storm clouds landscape"
  },
  snow: {
    mood: "cold winter scene, soft snow, pale cool palette",
    unsplashQuery: "watercolor winter landscape soft snow"
  }
};

export const BACKGROUND_STYLES = {
  botanical: {
    label: "צמחי",
    artDirection:
      "lush botanical scene, plants leaves and organic textures, nature-focused composition"
  },
  urban: {
    label: "עירוני",
    artDirection:
      "urban cityscape, architecture rooftops streets, metropolitan atmosphere"
  },
  anime: {
    label: "אנימה",
    artDirection:
      "anime illustration background, soft cel shading, painterly sky, studio-inspired landscape"
  },
  illustrated: {
    label: "מצוייר",
    artDirection:
      "hand-painted watercolor illustration, artistic brush strokes, paper texture feel"
  },
  graphic: {
    label: "גרפי",
    artDirection:
      "minimal graphic design background, flat shapes, bold color blocks, clean poster aesthetic"
  }
};

export function pickThemeFromWeather(weather) {
  const summary = `${weather?.today?.summary || weather?.current?.summary || ""} ${weather?.ahead?.[0]?.label || weather?.forecast?.[0]?.label || ""}`;
  if (/שלג|snow/i.test(summary)) return "snow";
  if (/סופה|רעמים|storm/i.test(summary)) return "storm";
  if (/גשם|rain/i.test(summary)) return "rain";
  if (/ערפל|fog/i.test(summary)) return "fog";
  if (/בהיר|clear|שמש/i.test(summary)) return "clear";
  return "cloudy";
}

function parseTempHigh(tempRange) {
  const parts = String(tempRange || "")
    .split("-")
    .map(value => Number(value.trim()))
    .filter(Number.isFinite);
  if (!parts.length) return null;
  return Math.max(...parts);
}

export function temperatureFeel(weather) {
  const high = parseTempHigh(weather?.today?.tempRange);
  if (high == null) return "comfortable mild daylight";
  if (high >= 32) return "hot summer heat, intense warm sunlight";
  if (high >= 26) return "warm pleasant summer day";
  if (high >= 20) return "mild comfortable temperatures";
  if (high >= 14) return "cool crisp air, soft cool tones";
  return "cold chilly atmosphere, cool blue undertones";
}

export const STYLE_KEYS = Object.keys(BACKGROUND_STYLES);

export function resolveBackgroundStyle(styleKey) {
  const key = String(styleKey || "illustrated").toLowerCase();
  return BACKGROUND_STYLES[key] ? key : "illustrated";
}

/** Same style all day; rotates by calendar date unless BACKGROUND_STYLE is set. */
export function pickStyleForDate(dateKey) {
  if (process.env.BACKGROUND_STYLE?.trim()) {
    return resolveBackgroundStyle(process.env.BACKGROUND_STYLE);
  }
  let hash = 0;
  for (const ch of String(dateKey || "")) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return STYLE_KEYS[hash % STYLE_KEYS.length];
}

export function slotDaypartAppearance(slot) {
  if (slot === "evening") {
    return {
      label: "evening",
      lighting:
        "evening atmosphere: golden hour or dusk, warm low light, long soft shadows, sky with sunset oranges and purples, end-of-day calm"
    };
  }
  return {
    label: "morning",
    lighting:
      "morning atmosphere: fresh sunrise light, soft cool-warm glow, clear start-of-day sky, gentle brightness"
  };
}

/** Full-bleed background only — UI panels are HTML/CSS overlays. */
export function buildOpenAiBackgroundPrompt({
  weather,
  styleKey,
  locationName,
  slot = "morning",
  dateKey
}) {
  const theme = pickThemeFromWeather(weather);
  const themeMeta = WEATHER_THEMES[theme];
  const style = styleKey || pickStyleForDate(dateKey);
  const styleMeta = BACKGROUND_STYLES[style];
  const summary = weather?.today?.summary || weather?.current?.summary || "";
  const tempFeel = temperatureFeel(weather);
  const place = locationName || "Israel coastal city";
  const daypart = slotDaypartAppearance(slot);
  const slotLabel = slot === "evening" ? "evening" : "morning";

  return [
    "Create ONE full-bleed 800x480 landscape background image for a weather screen.",
    "Single continuous scene filling the entire frame — no empty areas, no flat white bands, no UI panels.",
    `Art style for this calendar day (same style for morning and evening): ${styleMeta.artDirection}.`,
    `Time of day for this image: ${slotLabel}. Lighting: ${daypart.lighting}.`,
    `Weather in the artwork must match: ${themeMeta.mood}.`,
    `Temperature feel in the scene: ${tempFeel}.`,
    summary ? `Conditions: ${summary}.` : "",
    `Place: ${place}, Mediterranean coast.`,
    "Do not draw any text, letters, numbers, icons, logos, watermarks, or UI widgets.",
    "Single cohesive image, no collage."
  ]
    .filter(Boolean)
    .join(" ");
}

export function unsplashQueryForWeather(weather, overrideQuery) {
  if (overrideQuery) return overrideQuery;
  const theme = pickThemeFromWeather(weather);
  return WEATHER_THEMES[theme]?.unsplashQuery || WEATHER_THEMES.cloudy.unsplashQuery;
}
