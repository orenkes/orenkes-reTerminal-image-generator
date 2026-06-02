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

  async function gradientFallback(reason, sourceProvider) {
    const { pickThemeFromWeather } = await import("./background-theme.mjs");
    return {
      source: "gradient-fallback",
      provider: sourceProvider,
      localPath: null,
      imageUrl: null,
      theme: pickThemeFromWeather(args.weather),
      reason
    };
  }

  if (provider === "gradient") {
    return gradientFallback("gradient provider selected", "gradient");
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
      try {
        console.warn("Falling back to Unsplash");
        return await fetchUnsplashBackground(args);
      } catch (error) {
        console.warn("Unsplash fallback failed, using gradient:", error?.message || error);
      }
    }

    return gradientFallback("openai failed or skipped", "openai");
  }

  try {
    return await fetchUnsplashBackground(args);
  } catch (error) {
    console.warn("Unsplash background failed, using gradient:", error?.message || error);
    return gradientFallback("unsplash failed", "unsplash");
  }
}
