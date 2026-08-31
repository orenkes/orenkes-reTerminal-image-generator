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
    "luminous scenic anime illustration in the style of Makoto Shinkai, highly detailed background art, dramatic lighting, sunbeams filtering through atmosphere, soft cel shading, power lines silhouette against a vibrant painterly sky, clean linework, nostalgic and polished anime aesthetic",
  ghibli:
    "nostalgic scenic background art in the style of Studio Ghibli, hand-painted gouache illustration, soft warm daylight, lush green foliage, rustic charm, cozy hand-painted aesthetic, dreamlike landscape",
  watercolor:
    "delicate Japanese watercolor and ink wash scenic illustration, soft washes of color, mist and atmospheric depth, elegant minimal outlines, calm and serene mood",
  painterly:
    "refined painterly illustration, soft brushstroke texture, artistic clouds, atmospheric depth, calm and premium look",
  minimal:
    "minimal vector anime illustration, clean pastel gradients, simple shapes with soft lighting, restrained detail, modern retro-poster aesthetic",
  pastel:
    "soft pastel illustration, gentle color transitions, dreamy sky, subtle atmospheric depth, warm and relaxed mood",
  gouache:
    "refined gouache illustration, soft matte colors, slightly textured brushwork, elegant simplified scenery, artistic editorial look",
  paperCut:
    "layered paper-cut illustration, soft rounded shapes, gentle depth, subtle shadows, clean modern composition, premium handcrafted feel",
  soft3d:
    "soft stylized 3D illustration, rounded forms, subtle depth, diffused lighting, calm premium product-illustration aesthetic",
  dreamy:
    "dreamy atmospheric illustration, soft glowing sky, gentle haze, subtle light diffusion, serene and slightly magical mood"
};

export const sceneMap = {
  atmosphericWeather:
    "a stylized atmospheric weather scene focused on sky, luminous light rays, clouds, soft atmospheric depth, and elegant seasonal mood",
  skyHero:
    "a sky-dominant scenic composition with magnificent layered clouds, soft sunbeams, open luminous atmosphere, and subtle cinematic depth",
  minimalHorizon:
    "a calm minimal horizon scene with open sky, restrained detail, soft atmospheric haze, and a clean elegant composition",
  suburbanStreet:
    "a peaceful anime suburban street with a railway crossing, clean residential houses, utility poles with power lines, small green gardens, open sky, and a serene atmosphere",
  cozyCanal:
    "a charming quiet water canal in a peaceful Japanese neighborhood, with walking paths, wooden fences, lush green trees, and clear sky reflections",
  hillsideOverlook:
    "a serene hillside overlook above a quiet town, with green trees, utility poles, soft mist in the distance, and an expansive open sky",
  openRailway:
    "a wide open countryside landscape with train tracks extending towards the horizon under a dramatic, beautiful sky"
};

export const focalElementMap = {
  dragonairSerpent:
    "On the middle-left area (positioned high up between 45% and 75% vertical height), feature an elegant, slender blue serpentine dragon creature with a white horn, small feather-like ears, and a crystal neck orb, floating gracefully near a Japanese wooden bridge over a lotus stream.",
  bulbasaurDino:
    "On the upper-middle left area (positioned high up between 45% and 75% vertical height), feature a cute small green dinosaur-like creature with a blooming plant bulb on its back, resting happily under a blooming Japanese cherry blossom branch.",
  eeveeFox:
    "On the upper-middle left area (positioned high up between 45% and 75% vertical height), feature a cute small brown fox-like creature with a fluffy cream fur collar and bushy tail, sitting on a second-story wooden window balcony.",
  pikachuMascot:
    "On the upper-middle left area (positioned high up between 45% and 75% vertical height), feature a chubby golden-yellow electric rodent creature with red cheek spots and a lightning-bolt tail, perched high on a vintage Japanese lantern post.",
  snorlaxGiant:
    "On the middle-left area (positioned high up between 45% and 75% vertical height), feature a giant chubby dark-teal and cream furred bear creature napping peacefully on an elevated wooden temple porch.",
  vulpixFox:
    "On the upper-middle left area (positioned high up between 45% and 75% vertical height), feature a beautiful small reddish-brown fox creature with six curly tails, sitting near an elevated stone lantern.",
  psyduckKoiPond:
    "On the middle-left area (positioned high up between 45% and 70% vertical height), feature a cute confused yellow duck creature holding its head with both paws, floating happily on an elevated stone garden fountain.",
  totoroSpirit:
    "On the upper-middle left area (positioned high up between 45% and 75% vertical height), feature a large, friendly grey fluffy woodland spirit creature with tall rabbit-like ears and a white patterned belly, resting comfortably on an elevated tree branch.",
  noFaceSpirit:
    "On the upper-middle left area (positioned high up between 45% and 75% vertical height), feature a gentle dark shadow spirit wearing a simple white oval mask, floating softly near lush green leaves.",
  jijiBlackCat:
    "On the upper-middle left area (positioned high up between 45% and 75% vertical height), feature a cute sleek black cat with a red ribbon bow sitting on a second-story wooden window ledge."
};

export const FOCAL_KEYS = Object.keys(focalElementMap);

export function getFocalElementForDate(dateKey) {
  let hash = 0;
  for (const ch of String(dateKey || "")) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  const key = FOCAL_KEYS[hash % FOCAL_KEYS.length];
  return focalElementMap[key];
}

export const dailyStyleKeys = [
  "anime",
  "ghibli",
  "watercolor",
  "painterly",
  "minimal"
];

export const preferredScenesByWeather = {
  clear: ["skyHero", "suburbanStreet", "hillsideOverlook", "openRailway"],
  sunny: ["skyHero", "suburbanStreet", "hillsideOverlook", "openRailway"],
  partlyCloudy: ["atmosphericWeather", "suburbanStreet", "cozyCanal", "hillsideOverlook"],
  cloudy: ["atmosphericWeather", "cozyCanal", "suburbanStreet", "skyHero"],
  rainy: ["cozyCanal", "suburbanStreet", "atmosphericWeather", "minimalHorizon"],
  stormy: ["atmosphericWeather", "skyHero", "openRailway"],
  foggy: ["atmosphericWeather", "minimalHorizon", "hillsideOverlook"],
  snow: ["atmosphericWeather", "minimalHorizon", "suburbanStreet"]
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
  anime: {
    label: "אנימה שינקאי",
    artDirection: styleMap.anime
  },
  ghibli: {
    label: "ג'יבלי כפרי",
    artDirection: styleMap.ghibli
  },
  watercolor: {
    label: "צבעי מים יפניים",
    artDirection: styleMap.watercolor
  },
  illustrated: {
    label: "מצוייר",
    artDirection: styleMap.painterly
  },
  graphic: {
    label: "גרפי מינימליסטי",
    artDirection: styleMap.minimal
  }
};

export const STYLE_KEYS = Object.keys(BACKGROUND_STYLES);

export function resolveBackgroundStyle(styleKey) {
  const key = String(styleKey || "anime").toLowerCase();
  return BACKGROUND_STYLES[key] ? key : "anime";
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
  sunny: ["skyHero", "suburbanStreet", "hillsideOverlook", "openRailway"],
  partlyCloudy: ["atmosphericWeather", "suburbanStreet", "cozyCanal", "hillsideOverlook"],
  cloudy: ["atmosphericWeather", "cozyCanal", "suburbanStreet", "skyHero"],
  rainy: ["cozyCanal", "suburbanStreet", "atmosphericWeather", "minimalHorizon"],
  stormy: ["atmosphericWeather", "skyHero", "openRailway"],
  foggy: ["atmosphericWeather", "minimalHorizon", "hillsideOverlook"]
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
  const focalElement = getFocalElementForDate(dateKey);

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
    "The scene should feel like a peaceful, visually captivating anime scenic environment, airy, peaceful, and aesthetically striking.",
    "",
    "Focal Subject (Left-Center Placement):",
    focalElement,
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
    "CRITICAL ELEVATION RULE: Place the main focal subject HIGH UP in the middle-left area of the frame (strictly between 45% and 75% vertical height from the bottom). Absolutely NO focal subjects, benches, or main objects should rest on the ground level or bottom 35%, as the entire lower third of the screen is covered by UI cards.",
    "Leave the upper-right area visually calm and relatively low-detail for future text overlay.",
    "Leave a broad lower 35% area visually calm and free of main subjects, strictly reserved for forecast UI cards.",
    "Do not place tall or dominant elements such as trees, buildings, poles, animals, characters, or strong vertical focal points on the right side.",
    "The bottom 25% to 35% of the image is a UI-covered area and will be hidden by forecast cards. Do NOT place important subjects, focal points, people, animals, or key scenic details in the lower area.",
    "Add only subtle secondary details in the lower area, such as soft ground texture, gentle grass, or calm atmosphere.",
    "",
    "Ambient life:",
    "Add a subtle sense of life with only minor background accents such as a few birds in the sky or tiny distant human silhouettes.",
    "Keep them secondary and unobtrusive.",
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
