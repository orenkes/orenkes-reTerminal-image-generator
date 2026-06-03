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

export const styleMap = {
  anime:
    "anime-inspired scenic illustration, refined soft cel shading, painterly sky, luminous atmosphere, clean linework, polished modern Japanese-inspired background art",
  watercolor:
    "soft watercolor scenic illustration, delicate washes of color, airy sky, subtle textures, elegant and calm composition",
  painterly:
    "refined painterly illustration, soft brushstroke texture, artistic clouds, atmospheric depth, calm and premium look",
  urban:
    "modern urban illustration, clean metropolitan skyline, subtle Mediterranean architecture, polished contemporary atmosphere",
  minimal:
    "minimal airy illustration, soft gradients, restrained detail, clean shapes, elegant modern background",
  pastel:
    "soft pastel illustration, gentle color transitions, dreamy sky, subtle atmospheric depth, warm and relaxed mood",
  gouache:
    "refined gouache illustration, soft matte colors, slightly textured brushwork, elegant simplified scenery, artistic editorial look",
  paperCut:
    "layered paper-cut illustration, soft rounded shapes, gentle depth, subtle shadows, clean modern composition, premium handcrafted feel",
  soft3d:
    "soft stylized 3D illustration, rounded forms, subtle depth, diffused lighting, calm premium product-illustration aesthetic",
  dreamy:
    "dreamy atmospheric illustration, soft glowing sky, gentle haze, subtle light diffusion, serene and slightly magical mood",
  cinematic:
    "cinematic scenic illustration, atmospheric lighting, layered depth, refined composition, subtle dramatic sky, calm and elegant mood",
  inkWash:
    "delicate ink-wash illustration, soft atmospheric layers, subtle watercolor textures, calm minimal scenery, elegant artistic mood",
  flatVector:
    "clean flat-vector scenic illustration, simplified shapes, restrained palette, subtle gradients, modern editorial style",
  mediterranean:
    "Mediterranean-inspired illustrated scenery, pale stone buildings, subtle balconies, palm trees, warm sunlight, soft urban greenery, relaxed coastal-city atmosphere",
  retroPoster:
    "refined retro travel-poster illustration, simplified geometry, soft vintage palette, clean composition, elegant modernized mid-century feel"
};

export const sceneMap = {
  atmosphericWeather:
    "a stylized atmospheric weather scene focused on sky, light, clouds, soft depth, and elegant seasonal mood, with only a subtle distant horizon or faint silhouettes if needed",
  skyHero:
    "a sky-dominant scenic composition with beautiful layered clouds, soft light, open atmosphere, and subtle depth, designed to express the feeling of the weather in an elegant way",
  minimalHorizon:
    "a calm minimal horizon scene with open sky, restrained detail, soft atmospheric layers, and a clean elegant composition",
  airyUrban:
    "an airy Mediterranean urban atmosphere inspired by central Israel, with open sky, a subtle city skyline, light-colored apartment buildings, a few palm trees, small areas of urban greenery, and a calm visually pleasing composition",
  urbanEditorial:
    "a refined Mediterranean urban illustration inspired by central Israel, with pale apartment buildings, balconies, rooftop lines, palm trees, subtle urban greenery, elegant city rhythm, open sky, and a calm premium editorial composition",
  parkUrban:
    "a serene urban park scene inspired by central Israel, with walking paths, palm trees, light greenery, a few distant apartment buildings, and a calm open sky"
};

export const dailyStyleKeys = [
  "anime",
  "watercolor",
  "painterly",
  "urban",
  "minimal",
  "pastel",
  "gouache",
  "paperCut",
  "soft3d",
  "dreamy"
];

export const occasionalStyleKeys = [
  "cinematic",
  "inkWash",
  "flatVector",
  "mediterranean",
  "retroPoster"
];

export const preferredStylesByWeather = {
  clear: ["anime", "watercolor", "pastel", "mediterranean", "soft3d", "retroPoster"],
  sunny: ["anime", "watercolor", "pastel", "mediterranean", "soft3d", "retroPoster"],
  partlyCloudy: ["anime", "painterly", "gouache", "dreamy", "urban"],
  cloudy: ["watercolor", "gouache", "minimal", "inkWash", "dreamy"],
  rainy: ["painterly", "urban", "cinematic", "inkWash", "dreamy"],
  stormy: ["cinematic", "painterly", "urban"],
  foggy: ["inkWash", "minimal", "dreamy", "watercolor"],
  snow: ["watercolor", "gouache", "minimal", "dreamy"]
};

export const preferredScenesByWeather = {
  clear: ["skyHero", "atmosphericWeather", "airyUrban", "urbanEditorial"],
  sunny: ["skyHero", "atmosphericWeather", "airyUrban", "urbanEditorial"],
  partlyCloudy: ["atmosphericWeather", "skyHero", "urbanEditorial", "parkUrban"],
  cloudy: ["atmosphericWeather", "skyHero", "urbanEditorial", "parkUrban"],
  rainy: ["atmosphericWeather", "urbanEditorial", "parkUrban", "skyHero"],
  stormy: ["atmosphericWeather", "skyHero", "urbanEditorial"],
  foggy: ["atmosphericWeather", "minimalHorizon", "skyHero"],
  snow: ["atmosphericWeather", "minimalHorizon", "skyHero"]
};

export const weatherVisualMap = {
  clear: {
    visual: "bright clear summer sky, warm sunlight, crisp visibility, soft airy atmosphere",
    palette: "soft sky blues, warm sunlight whites, Mediterranean greens, gentle golden highlights"
  },
  partlyCloudy: {
    visual: "partly cloudy summer sky, soft layered clouds, gentle sunlight filtering through, bright and pleasant atmosphere",
    palette: "light sky blues, soft whites, warm neutral highlights, Mediterranean greens"
  },
  cloudy: {
    visual: "bright cloudy summer sky, soft layered cloud cover, diffused daylight, calm warm atmosphere, subtle sunlight filtering through the clouds",
    palette: "muted sky blues, soft grays, warm whites, fresh Mediterranean greens"
  },
  rain: {
    visual: "soft rainy atmosphere, layered gray-blue clouds, wet surfaces, gentle rain haze, calm and elegant mood",
    palette: "cool gray-blues, muted greens, soft silver highlights, subtle reflections"
  },
  storm: {
    visual: "dramatic layered storm clouds, deeper blue-gray sky, distant rain haze, atmospheric but not dark or threatening",
    palette: "deep blue-grays, soft muted greens, subtle silver light"
  },
  fog: {
    visual: "light mist in the air, soft atmospheric haze, muted distance, calm and dreamy feeling",
    palette: "soft gray-blues, muted whites, subtle pale greens, delicate neutral tones"
  },
  snow: {
    visual: "soft snowy atmosphere, frosted surfaces, pale light, quiet winter calm",
    palette: "pale cool blues, soft whites, muted gray-greens, delicate frosted highlights"
  }
};

export const lightingMap = {
  morning:
    "fresh morning atmosphere, soft cool-warm light, gentle brightness, subtle sunrise glow",
  evening:
    "calm evening atmosphere, warm golden-hour light, soft sunset glow, relaxed and elegant mood",
  night:
    "quiet night atmosphere, deep blue tones, soft ambient city lights, calm and refined mood"
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
  return weatherVisualMap[theme]?.visual || WEATHER_THEMES[theme]?.visual || WEATHER_THEMES.cloudy.visual;
}

export function lightingDescription(slot) {
  return lightingMap[slot] || lightingMap.morning;
}

export function colorPaletteForWeather(weather, slot) {
  const theme = pickThemeFromWeather(weather);
  if (slot === "evening") {
    return "warm peach, soft gold, sunset orange, dusty blue, Mediterranean greens";
  }
  if (weatherVisualMap[theme]?.palette) {
    return weatherVisualMap[theme].palette;
  }
  return "soft sky blues, warm sunlight whites, Mediterranean greens, gentle warm-neutral tones";
}

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
    artDirection: styleMap.anime
  },
  illustrated: {
    label: "מצוייר",
    artDirection: styleMap.painterly
  },
  graphic: {
    label: "גרפי",
    artDirection: styleMap.minimal
  }
};

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

const SCENE_KEYS_BY_WEATHER = {
  sunny: ["skyHero", "atmosphericWeather", "airyUrban", "urbanEditorial"],
  partlyCloudy: ["atmosphericWeather", "skyHero", "urbanEditorial", "parkUrban"],
  cloudy: ["atmosphericWeather", "skyHero", "urbanEditorial", "parkUrban"],
  rainy: ["atmosphericWeather", "urbanEditorial", "parkUrban", "skyHero"],
  stormy: ["atmosphericWeather", "skyHero", "urbanEditorial"],
  foggy: ["atmosphericWeather", "skyHero"]
};

function getDayIndex(date = new Date()) {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) /
      (1000 * 60 * 60 * 24)
  );
}

function pickFromDayKey(items, date = new Date()) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return null;
  const hash = getDayIndex(date);
  return list[hash % list.length];
}

export function getSceneForDate({
  date = new Date(),
  conditionKey = "partlyCloudy"
} = {}) {
  const sceneKey =
    pickFromDayKey(
      preferredScenesByWeather[conditionKey] ||
        SCENE_KEYS_BY_WEATHER[conditionKey] ||
        SCENE_KEYS_BY_WEATHER.partlyCloudy,
      date
    ) || "atmosphericWeather";

  return {
    key: sceneKey,
    prompt: sceneMap[sceneKey] || sceneMap.atmosphericWeather
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
  const scene = getSceneForDate({ date: dateKey ? new Date(dateKey) : new Date(), conditionKey: pickThemeFromWeather(weather) });

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
    `${scene.prompt}.`,
    `Use ${place} as the location mood when it helps the scene feel specific and believable.`,
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
    "The right side is reserved for Hebrew text overlay.",
    "Place most of the scenic detail on the left and center-left areas.",
    "Leave the upper-right area visually calm and relatively low-detail for future text overlay.",
    "Leave a broad lower area visually calm enough for future forecast cards.",
    "Do not place tall or dominant elements such as trees, palm trees, buildings, poles, animals, characters, or strong vertical focal points on the right side.",
    "The bottom 25% to 35% of the image is a UI-covered area and may be partially hidden by forecast cards or interface elements.",
    "Do not place important subjects, focal points, people, animals, or key scenic details in the lower area.",
    "Add only subtle secondary details in the lower area, such as soft ground texture, distant scenery, or gentle atmosphere.",
    "Add a subtle sense of life with a few small birds in the sky or tiny distant human silhouettes, but keep them secondary and unobtrusive.",
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
