import { writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildOpenAiBackgroundPrompt,
  pickStyleForDate,
  pickThemeFromWeather
} from "./background-theme.mjs";

const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";
const DEFAULT_MODEL = "gpt-image-1-mini";

const DEPRECATED_DALLE = new Set(["dall-e-2", "dall-e-3"]);

function normalizeModel(model) {
  return String(model || DEFAULT_MODEL)
    .toLowerCase()
    .trim();
}

/** DALL·E retired May 2026 — map to GPT Image. */
export function resolveOpenAiImageModel(model) {
  const normalized = normalizeModel(model);
  if (DEPRECATED_DALLE.has(normalized)) {
    const replacement = process.env.BACKGROUND_OPENAI_MODEL_FALLBACK || DEFAULT_MODEL;
    console.warn(
      `OpenAI: model "${normalized}" is retired; using "${replacement}" instead.`
    );
    return normalizeModel(replacement);
  }
  if (!normalized.startsWith("gpt-image")) {
    console.warn(`OpenAI: unknown image model "${normalized}"; using "${DEFAULT_MODEL}"`);
    return DEFAULT_MODEL;
  }
  return normalized;
}

function imageRequestBody(model, prompt) {
  const quality = process.env.BACKGROUND_OPENAI_QUALITY || "low";
  return {
    model,
    prompt,
    n: 1,
    size: process.env.BACKGROUND_OPENAI_SIZE || "1536x1024",
    quality,
    output_format: process.env.BACKGROUND_OPENAI_OUTPUT_FORMAT || "jpeg"
  };
}

async function decodeImagePayload(data) {
  const item = data?.[0];
  if (item?.b64_json) {
    return Buffer.from(item.b64_json, "base64");
  }
  const url = item?.url;
  if (!url) throw new Error("OpenAI image response missing b64_json and url");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`OpenAI image download HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

export async function fetchOpenAiBackground({
  weather,
  publicDir,
  outputDir,
  backgroundFileName = "bg.jpg",
  locationName,
  slot = "morning",
  dateKey
}) {
  const targetDir = outputDir || publicDir;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = resolveOpenAiImageModel(process.env.BACKGROUND_OPENAI_MODEL);
  const styleKey = pickStyleForDate(dateKey);
  const theme = pickThemeFromWeather(weather);

  if (!apiKey) {
    return {
      source: "gradient-fallback",
      provider: "openai",
      localPath: null,
      imageUrl: null,
      model,
      style: styleKey,
      slot,
      dateKey,
      theme,
      prompt: null,
      reason: "missing OPENAI_API_KEY"
    };
  }

  const prompt = buildOpenAiBackgroundPrompt({
    weather,
    styleKey,
    locationName: locationName || process.env.LOCATION_NAME,
    slot,
    dateKey
  });

  const response = await fetch(OPENAI_IMAGES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(imageRequestBody(model, prompt))
  });

  const raw = await response.text();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error(`OpenAI image API invalid JSON: ${raw.slice(0, 200)}`);
  }

  if (!response.ok) {
    const message = payload?.error?.message || raw.slice(0, 300);
    throw new Error(`OpenAI image API ${response.status}: ${message}`);
  }

  const bytes = await decodeImagePayload(payload?.data);
  const localFile = path.join(targetDir, backgroundFileName);
  await writeFile(localFile, bytes);
  await writeFile(path.join(targetDir, "bg.prompt.txt"), prompt + "\n", "utf8");

  const imageUrl = outputDir ? backgroundFileName : "/current-bg.jpg";

  return {
    source: "openai",
    provider: "openai",
    localPath: localFile,
    imageUrl,
    model,
    style: styleKey,
    slot,
    dateKey,
    theme,
    prompt,
    size: process.env.BACKGROUND_OPENAI_SIZE || "1536x1024",
    quality: process.env.BACKGROUND_OPENAI_QUALITY || "low"
  };
}
