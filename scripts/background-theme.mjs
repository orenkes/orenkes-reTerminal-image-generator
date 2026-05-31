/** Shared weather theme + visual style presets for background providers. */

export const WEATHER_THEMES = {
  clear: {
    mood: "clear sunny sky, warm golden light, open horizon",
    visual: "bright clear summer sky, warm sunlight, crisp visibility, cheerful atmosphere",
    unsplashQuery: "watercolor sunrise landscape warm golden hour"
  },
  cloudy: {
    mood: "soft cloudy sky, diffused daylight, calm atmosphere",
    visual: "bright cloudy sky, soft cloud cover, diffused daylight, calm and elegant atmosphere",
    unsplashQuery: "soft watercolor cloudy sky pastoral landscape"
  },
  fog: {
    mood: "misty fog, muted tones, gentle haze",
    visual: "light mist in the air, soft atmospheric haze, muted distance, calm and dreamy feeling",
    unsplashQuery: "misty watercolor hills muted morning"
  },
  rain: {
    mood: "rainy weather, wet surfaces, cool blue-grey tones",
    visual: "rainy atmosphere, dense clouds, soft rain haze, wet surfaces, moody but beautiful lighting",
    unsplashQuery: "watercolor rainy landscape soft blue grey"
  },
  storm: {
    mood: "dramatic storm clouds, deep contrast, brooding sky",
    visual: "dramatic cloud layers, heavy sky energy, deep contrast, vivid but controlled atmosphere",
    unsplashQuery: "dramatic watercolor storm clouds landscape"
  },
  snow: {
    mood: "cold winter scene, soft snow, pale cool palette",
    visual: "soft snowy atmosphere, frosted surfaces, pale light, quiet winter calm",
    unsplashQuery: "watercolor winter landscape soft snow"
  }
};

export const BACKGROUND_STYLES = {
  botanical: {
    label: "צמחי",
    artDirection:
      "lush botanical scenic illustration, detailed leaves and organic textures, nature-focused composition, elegant garden atmosphere"
  },
  urban: {
    label: "עירוני",
    artDirection:
      "modern urban scenic illustration, clean metropolitan atmosphere, elegant city-park environment, polished contemporary look"
  },
  anime: {
    label: "אנימה",
    artDirection:
      "anime-inspired scenic illustration, refined soft cel shading, painterly sky, luminous atmosphere, clean linework, modern Japanese-inspired background art"
  },
  illustrated: {
    label: "מצוייר",
    artDirection:
      "painterly scenic illustration, soft brushstroke texture, artistic clouds, elegant hand-painted look, calm and refined atmosphere"
  },
  graphic: {
    label: "גרפי",
    artDirection:
      "minimal scenic illustration, clean shapes, restrained detail, soft modern atmosphere, elegant and uncluttered"
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

export function weatherConditionHe(weather) {
  return weather?.today?.summary || weather?.current?.summary || "מעונן";
}

export function weatherVisualDescription(weather) {
  const theme = pickThemeFromWeather(weather);
  return WEATHER_THEMES[theme]?.visual || WEATHER_THEMES.cloudy.visual;
}

export function lightingDescription(slot) {
  return slot === "evening"
    ? "soft evening light, calm sunset atmosphere, warm golden-orange glow, long shadows, relaxed and serene mood"
    : "soft morning light, fresh start-of-day atmosphere, subtle golden sunlight filtering through the sky, gentle brightness, calm and pleasant glow";
}

export function colorPaletteForWeather(weather, slot) {
  const theme = pickThemeFromWeather(weather);
  if (slot === "evening") {
    return "warm peach, soft gold, sunset orange, dusty blue, Mediterranean greens";
  }
  if (theme === "rain" || theme === "storm" || theme === "fog") {
    return "cool grays, deep blue-gray sky tones, wet green vegetation, subtle muted highlights";
  }
  if (theme === "cloudy") {
    return "muted sky blues, soft grays, fresh greens, gentle neutral tones, balanced and elegant";
  }
  return "soft sky blues, warm sunlight whites, Mediterranean greens, gentle warm-neutral tones";
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
  const style = styleKey || pickStyleForDate(dateKey);
  const styleMeta = BACKGROUND_STYLES[style];
  const place = locationName || "Holon, Israel";
  const tempFeel = temperatureFeel(weather);
  const weatherCondition = weatherConditionHe(weather);
  const weatherVisual = weatherVisualDescription(weather);
  const lighting = lightingDescription(slot);
  const palette = colorPaletteForWeather(weather, slot);
  const ahead = (weather?.ahead || [])
    .map(day => `${day.dayLabel} ${day.high}/${day.low}`)
    .join(", ");

  return [
    "Create one beautiful full-bleed landscape background image for a weather display, designed for an 800x480 smart screen.",
    "",
    "Style:",
    styleMeta.artDirection,
    "",
    "Overall look:",
    "premium scenic background, elegant, polished, visually rich, calm and inviting, suitable for a home smart display.",
    "",
    "Scene:",
    `a serene urban park scene in ${place}, with Mediterranean vegetation, palm trees, soft greenery, walking paths, a reflective pond or small lake, and a distant skyline of light-colored apartment buildings and city structures.`,
    "The scene should feel like a pleasant Israeli city environment, airy, peaceful, and visually attractive.",
    "",
    "Time of day:",
    slot === "evening" ? "evening" : "morning",
    "",
    "Lighting:",
    lighting,
    "",
    "Weather:",
    `The weather shown in the artwork must match: ${weatherCondition}.`,
    `Visual atmosphere: ${weatherVisual}.`,
    "",
    "Temperature feel:",
    tempFeel,
    "",
    "Composition:",
    "wide cinematic composition with clear depth, including foreground, midground, and background.",
    "Keep the image cohesive and natural, not like a collage.",
    "Place most of the scenic detail on the left and center-left areas.",
    "Leave the upper-right area visually calm and relatively low-detail for future text overlay.",
    "Leave a broad lower area visually calm enough for future forecast cards.",
    "",
    "Color palette:",
    palette,
    "",
    "Important:",
    "do not draw any text, letters, numbers, icons, logos, watermarks, forecast cards, white panels, UI widgets, or interface elements.",
    "No flat empty bands.",
    "No collage.",
    "No split layout.",
    "Single cohesive image only."
  ].join("\n");
}

export function unsplashQueryForWeather(weather, overrideQuery) {
  if (overrideQuery) return overrideQuery;
  const theme = pickThemeFromWeather(weather);
  return WEATHER_THEMES[theme]?.unsplashQuery || WEATHER_THEMES.cloudy.unsplashQuery;
}
