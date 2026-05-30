import { writeFile } from "node:fs/promises";
import path from "node:path";
import {
  pickThemeFromWeather,
  unsplashQueryForWeather
} from "./background-theme.mjs";

export async function fetchUnsplashBackground({
  weather,
  publicDir,
  outputDir,
  backgroundFileName = "bg.jpg"
}) {
  const targetDir = outputDir || publicDir;
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  const theme = pickThemeFromWeather(weather);
  const query = unsplashQueryForWeather(weather, process.env.UNSPLASH_QUERY);

  if (!accessKey) {
    return {
      source: "gradient-fallback",
      provider: "unsplash",
      localPath: null,
      imageUrl: null,
      query,
      theme
    };
  }

  const url = new URL("https://api.unsplash.com/photos/random");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("content_filter", "high");

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "Accept-Version": "v1",
      Authorization: `Client-ID ${accessKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`unsplash HTTP ${response.status}`);
  }

  const photo = await response.json();
  const remoteUrl = photo?.urls?.regular || photo?.urls?.full;
  if (!remoteUrl) throw new Error("unsplash response missing image URL");

  const imageResponse = await fetch(remoteUrl);
  if (!imageResponse.ok) throw new Error(`unsplash image HTTP ${imageResponse.status}`);

  const bytes = Buffer.from(await imageResponse.arrayBuffer());
  const localFile = path.join(targetDir, backgroundFileName);
  await writeFile(localFile, bytes);

  const attribution = {
    name: photo?.user?.name || "Unknown",
    username: photo?.user?.username || "",
    profileUrl: photo?.user?.links?.html || "",
    photoUrl: photo?.links?.html || ""
  };

  const imageUrl = outputDir ? backgroundFileName : "/current-bg.jpg";

  return {
    source: "unsplash",
    provider: "unsplash",
    localPath: localFile,
    imageUrl,
    remoteUrl,
    query,
    theme,
    attribution
  };
}
