import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

function getChromeCandidates(env = process.env) {
  const candidates = [];
  if (env.CHROME_PATH) candidates.push(env.CHROME_PATH);
  candidates.push(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  );
  return [...new Set(candidates)];
}

export function getChromeExecutablePath(env = process.env) {
  for (const candidate of getChromeCandidates(env)) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return null;
}

export async function renderHtmlToPng({
  rootDir,
  htmlFile = "current.html",
  pngFile = "current.png",
  width = 800,
  height = 480,
  env = process.env
}) {
  const executablePath = getChromeExecutablePath(env);
  if (!executablePath) {
    throw new Error(
      "Google Chrome not found. Set CHROME_PATH to a Chrome executable so the app can render HTML to PNG."
    );
  }

  const htmlPath = path.join(rootDir, htmlFile);
  const renderedHtmlPath = path.join(rootDir, `.__render-${htmlFile}`);
  const html = await readFile(htmlPath, "utf8");
  const rewrittenHtml = html.replaceAll("/current-bg.jpg", "current-bg.jpg");
  await writeFile(renderedHtmlPath, rewrittenHtml, "utf8");

  try {
    const pngPath = path.join(rootDir, pngFile);
    const result = spawnSync(executablePath, [
      "--headless",
      "--disable-gpu",
      "--allow-file-access-from-files",
      `--window-size=${width},${height}`,
      `--screenshot=${pngPath}`,
      pathToFileURL(renderedHtmlPath).href
    ], {
      encoding: "utf8"
    });

    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      const message = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
      throw new Error(
        message ||
        `Chrome screenshot failed with status ${result.status}, signal ${result.signal || "none"}`
      );
    }
  } finally {
    await rm(renderedHtmlPath, { force: true });
  }
}
