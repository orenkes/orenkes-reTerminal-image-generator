import { existsSync } from "node:fs";
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import { fetchBackground, getBackgroundProvider } from "./background.mjs";
import { BACKGROUND_STYLES, pickStyleForDate } from "./background-theme.mjs";
import { fetchWeather } from "./weather.mjs";
import { buildHtml, buildPrompt } from "./render.mjs";

export const SLOTS = ["morning", "evening"];

export function getConfig() {
  return {
    lat: Number(process.env.LAT || 32.0171),
    lon: Number(process.env.LON || 34.7454),
    locationName: process.env.LOCATION_NAME || "חולון",
    timeZone: process.env.TIME_ZONE || "Asia/Jerusalem",
    morningHour: Number(process.env.MORNING_HOUR || 6),
    eveningHour: Number(process.env.EVENING_HOUR || 18),
    alternateMinutes: Number(process.env.ALTERNATE_DURATION_MINUTES || 60),
    publicDir: process.env.PUBLIC_DIR || path.join(process.cwd(), "public"),
    daysDirName: "days"
  };
}

export function dateKeyForTimeZone(timeZone, date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function hourInTimeZone(timeZone, date = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "numeric",
      hour12: false
    }).format(date)
  );
}

export function preferredWeatherSlot(now, config) {
  const hour = hourInTimeZone(config.timeZone, now);
  if (hour >= config.eveningHour) return "evening";
  if (hour >= config.morningHour) return "morning";
  return "morning";
}

function dayDir(config, dateKey) {
  return path.join(config.publicDir, config.daysDirName, dateKey);
}

function slotDir(config, dateKey, slot) {
  return path.join(dayDir(config, dateKey), slot);
}

function displayStatePath(config) {
  return path.join(config.publicDir, "display-state.json");
}

function manifestPath(config, dateKey) {
  return path.join(dayDir(config, dateKey), "manifest.json");
}

async function readJson(filePath, fallback = null) {
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export async function readDisplayState(config = getConfig()) {
  return (
    (await readJson(displayStatePath(config))) || {
      date: null,
      mode: "weather",
      slot: null,
      archiveUrl: null,
      revertAt: null,
      revertSlot: null,
      updatedAt: null
    }
  );
}

export async function writeDisplayState(config, state) {
  const next = { ...state, updatedAt: new Date().toISOString() };
  await writeJson(displayStatePath(config), next);
  return next;
}

export async function readManifest(config, dateKey) {
  const base = {
    date: dateKey,
    slots: {},
    alternates: []
  };
  const existing = await readJson(manifestPath(config, dateKey));
  return existing ? { ...base, ...existing, slots: { ...base.slots, ...existing.slots } } : base;
}

export async function writeManifest(config, dateKey, manifest) {
  await writeJson(manifestPath(config, dateKey), manifest);
}

export async function cleanupOldDays(config, keepDateKey) {
  const daysRoot = path.join(config.publicDir, config.daysDirName);
  if (!existsSync(daysRoot)) return [];
  const removed = [];
  for (const entry of await readdir(daysRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === keepDateKey) continue;
    const target = path.join(daysRoot, entry.name);
    await rm(target, { recursive: true, force: true });
    removed.push(entry.name);
  }
  return removed;
}

/** Re-render public/current.html from current.json (CSS/layout only, no API calls). */
export async function rebuildCurrentHtml(options = {}) {
  const config = options.config || getConfig();
  const dataPath = path.join(config.publicDir, "current.json");
  const data = JSON.parse(await readFile(dataPath, "utf8"));
  const html = htmlForCurrentDisplay(data);
  await writeFile(path.join(config.publicDir, "current.html"), html, "utf8");
  return { ok: true, slot: data.slot };
}

function htmlForCurrentDisplay(data) {
  return buildHtml({
    weather: data.weather,
    background: { ...data.background, imageUrl: "/current-bg.jpg" },
    generatedAt: data.generatedAt,
    slot: data.slot
  });
}

async function mirrorSlotToCurrent(config, slotPath, slot) {
  const bgPath = path.join(slotPath, "bg.jpg");
  const dataPath = path.join(slotPath, "data.json");

  if (!existsSync(dataPath)) {
    throw new Error(`missing data.json in ${slotPath}`);
  }

  const data = JSON.parse(await readFile(dataPath, "utf8"));
  const html = htmlForCurrentDisplay(data);

  await writeFile(path.join(config.publicDir, "current.html"), html, "utf8");
  if (existsSync(bgPath)) {
    await copyFile(bgPath, path.join(config.publicDir, "current-bg.jpg"));
  }
  await copyFile(dataPath, path.join(config.publicDir, "current.json"));

  const archiveUrl = `/days/${path.basename(path.dirname(slotPath))}/${slot}/index.html`;
  return archiveUrl;
}

export async function generateWeatherSlot(slot, options = {}) {
  const config = options.config || getConfig();
  const now = options.now || new Date();
  const dateKey = dateKeyForTimeZone(config.timeZone, now);
  const activate = options.activate !== false;

  await cleanupOldDays(config, dateKey);

  const outDir = slotDir(config, dateKey, slot);
  await mkdir(outDir, { recursive: true });

  const weather = await fetchWeather({
    lat: config.lat,
    lon: config.lon,
    locationName: config.locationName,
    timeZone: config.timeZone
  });

  const background = await fetchBackground({
    weather,
    outputDir: outDir,
    backgroundFileName: "bg.jpg",
    locationName: config.locationName,
    slot,
    dateKey
  });

  const prompt = buildPrompt({ weather, background });
  const html = buildHtml({
    weather,
    background: { ...background, imageUrl: "bg.jpg" },
    generatedAt: now.toISOString(),
    slot
  });

  const payload = {
    generatedAt: now.toISOString(),
    date: dateKey,
    slot,
    locationName: config.locationName,
    lat: config.lat,
    lon: config.lon,
    timeZone: config.timeZone,
    weather,
    background,
    prompt
  };

  await writeFile(path.join(outDir, "index.html"), html, "utf8");
  await writeFile(path.join(outDir, "data.json"), JSON.stringify(payload, null, 2) + "\n", "utf8");
  await writeFile(path.join(outDir, "prompt.txt"), prompt + "\n", "utf8");

  const manifest = await readManifest(config, dateKey);
  manifest.slots[slot] = {
    generatedAt: now.toISOString(),
    path: slot,
    summary: weather?.today?.summary || weather?.current?.summary
  };
  await writeManifest(config, dateKey, manifest);

  let display = null;
  if (activate) {
    display = await activateWeatherSlot(slot, { config, dateKey, now });
  }

  return { payload, outDir, display, dateKey };
}

export async function activateWeatherSlot(slot, options = {}) {
  const config = options.config || getConfig();
  const dateKey = options.dateKey || dateKeyForTimeZone(config.timeZone, options.now || new Date());
  const target = slotDir(config, dateKey, slot);

  if (!existsSync(path.join(target, "index.html"))) {
    throw new Error(`slot not found for ${dateKey}/${slot}`);
  }

  const archiveUrl = await mirrorSlotToCurrent(config, target, slot);
  const state = await writeDisplayState(config, {
    date: dateKey,
    mode: "weather",
    slot,
    archiveUrl,
    revertAt: null,
    revertSlot: null,
    alternateId: null
  });

  return { state, archiveUrl, slot, dateKey };
}

export async function showAlternateContent(input, options = {}) {
  const config = options.config || getConfig();
  const now = options.now || new Date();
  const dateKey = dateKeyForTimeZone(config.timeZone, now);
  const durationMs = (options.durationMinutes ?? config.alternateMinutes) * 60 * 1000;

  const stateBefore = await readDisplayState(config);
  const revertSlot =
    options.revertSlot ||
    stateBefore.revertSlot ||
    stateBefore.slot ||
    preferredWeatherSlot(now, config);

  const stamp = new Intl.DateTimeFormat("en-GB", {
    timeZone: config.timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })
    .format(now)
    .replace(":", "");

  const altId = `${stamp}-${Math.random().toString(36).slice(2, 6)}`;
  const altDir = path.join(dayDir(config, dateKey), "alternate", altId);
  await mkdir(altDir, { recursive: true });

  const html = input.html || (input.file ? await readFile(input.file, "utf8") : null);
  if (!html) throw new Error("alternate content requires html or file");

  await writeFile(path.join(altDir, "index.html"), html, "utf8");
  await writeJson(path.join(altDir, "meta.json"), {
    createdAt: now.toISOString(),
    title: input.title || "alternate",
    durationMinutes: durationMs / 60000,
    revertSlot
  });

  const manifest = await readManifest(config, dateKey);
  manifest.alternates.push({
    id: altId,
    createdAt: now.toISOString(),
    revertSlot,
    title: input.title || "alternate"
  });
  await writeManifest(config, dateKey, manifest);

  await writeFile(path.join(config.publicDir, "current.html"), html, "utf8");

  const revertAt = new Date(now.getTime() + durationMs).toISOString();
  const state = await writeDisplayState(config, {
    date: dateKey,
    mode: "alternate",
    slot: stateBefore.slot,
    archiveUrl: `/days/${dateKey}/alternate/${altId}/index.html`,
    revertAt,
    revertSlot,
    alternateId: altId
  });

  return { state, altId, revertAt, revertSlot };
}

export async function processRevertIfDue(options = {}) {
  const config = options.config || getConfig();
  const now = options.now || new Date();
  const state = await readDisplayState(config);

  if (state.mode !== "alternate" || !state.revertAt) return null;
  if (new Date(state.revertAt).getTime() > now.getTime()) return null;

  const slot = state.revertSlot || preferredWeatherSlot(now, config);
  const dateKey = state.date || dateKeyForTimeZone(config.timeZone, now);
  return activateWeatherSlot(slot, { config, dateKey, now });
}

export async function runScheduledGeneration(options = {}) {
  const config = options.config || getConfig();
  const now = options.now || new Date();
  const dateKey = dateKeyForTimeZone(config.timeZone, now);
  const hour = hourInTimeZone(config.timeZone, now);
  const manifest = await readManifest(config, dateKey);
  const actions = [];

  await cleanupOldDays(config, dateKey);

  const state = await readDisplayState(config);
  if (state.mode === "alternate") {
    const reverted = await processRevertIfDue({ config, now });
    if (reverted) actions.push({ type: "revert", ...reverted });
  }

  for (const slot of SLOTS) {
    const threshold = slot === "morning" ? config.morningHour : config.eveningHour;
    if (hour < threshold) continue;
    if (manifest.slots?.[slot]?.generatedAt) continue;

    const result = await generateWeatherSlot(slot, {
      config,
      now,
      activate: state.mode !== "alternate"
    });
    actions.push({ type: "generate", slot, ...result });

    if (state.mode !== "alternate") {
      const preferred = preferredWeatherSlot(now, config);
      if (slot === preferred) {
        await activateWeatherSlot(slot, { config, dateKey, now });
        actions.push({ type: "activate", slot });
      }
    }
  }

  const refreshedManifest = await readManifest(config, dateKey);
  if (state.mode === "weather" && !options.skipPreferredActivate) {
    const preferred = preferredWeatherSlot(now, config);
    if (refreshedManifest.slots?.[preferred] && state.slot !== preferred) {
      await activateWeatherSlot(preferred, { config, dateKey, now });
      actions.push({ type: "activate-preferred", slot: preferred });
    }
  }

  return { dateKey, hour, actions };
}

export async function schedulerTick(options = {}) {
  const revert = await processRevertIfDue(options);
  const scheduled = await runScheduledGeneration(options);
  return { revert, scheduled };
}

export async function getStatus(config = getConfig()) {
  const now = new Date();
  const dateKey = dateKeyForTimeZone(config.timeZone, now);
  const state = await readDisplayState(config);
  const manifest = await readManifest(config, dateKey);
  return {
    now: now.toISOString(),
    dateKey,
    hour: hourInTimeZone(config.timeZone, now),
    preferredSlot: preferredWeatherSlot(now, config),
    display: state,
    manifest,
    schedule: {
      morningHour: config.morningHour,
      eveningHour: config.eveningHour,
      alternateMinutes: config.alternateMinutes
    },
    background: {
      provider: getBackgroundProvider(),
      styleToday: pickStyleForDate(dateKey),
      styleOverride: process.env.BACKGROUND_STYLE || null,
      openaiModel:
        process.env.BACKGROUND_OPENAI_MODEL || "gpt-image-1-mini",
      styles: Object.keys(BACKGROUND_STYLES),
      hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
      hasUnsplashKey: Boolean(process.env.UNSPLASH_ACCESS_KEY)
    }
  };
}
