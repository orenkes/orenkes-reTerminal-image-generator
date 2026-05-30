import { fetchOpenAiBackground } from "./openai-background.mjs";
import { fetchUnsplashBackground } from "./unsplash.mjs";

/**
 * Background provider router.
 * BACKGROUND_PROVIDER=unsplash | openai | gradient
 * Default: unsplash (existing behavior).
 */
export function getBackgroundProvider() {
  return String(process.env.BACKGROUND_PROVIDER || "unsplash").toLowerCase();
}

export async function fetchBackground(args) {
  const provider = getBackgroundProvider();

  if (provider === "gradient") {
    const { pickThemeFromWeather } = await import("./background-theme.mjs");
    return {
      source: "gradient-fallback",
      provider: "gradient",
      localPath: null,
      imageUrl: null,
      theme: pickThemeFromWeather(args.weather)
    };
  }

  if (provider === "openai") {
    try {
      const result = await fetchOpenAiBackground({
        ...args,
        locationName: args.locationName || process.env.LOCATION_NAME
      });
      if (result.localPath) return result;
      console.warn("OpenAI background: no image file, trying fallback");
    } catch (error) {
      console.warn("OpenAI background failed:", error?.message || error);
    }

    const fallback = process.env.BACKGROUND_FALLBACK || "unsplash";
    if (fallback === "unsplash" && process.env.UNSPLASH_ACCESS_KEY) {
      console.warn("Falling back to Unsplash");
      return fetchUnsplashBackground(args);
    }

    const { pickThemeFromWeather } = await import("./background-theme.mjs");
    return {
      source: "gradient-fallback",
      provider: "openai",
      localPath: null,
      imageUrl: null,
      theme: pickThemeFromWeather(args.weather),
      reason: "openai failed or skipped"
    };
  }

  return fetchUnsplashBackground(args);
}
