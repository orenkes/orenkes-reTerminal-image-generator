import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  activateWeatherSlot,
  generateWeatherSlot,
  rebuildCurrentHtml,
  getConfig,
  getStatus,
  preferredWeatherSlot,
  schedulerTick,
  showAlternateContent
} from "./daily.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");

async function loadEnvFile() {
  const envPath = path.join(rootDir, ".env");
  if (!existsSync(envPath)) return;
  const text = await readFile(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

const port = Number(process.env.PORT || 8081);

const NO_CACHE_PATHS = new Set([
  "/current.html",
  "/current.json",
  "/current.prompt.txt",
  "/current-bg.jpg",
  "/display-state.json"
]);

function jsonResponse(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body, null, 2));
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { html: raw };
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  let pathname = url.pathname;
  if (pathname === "/") pathname = "/index.html";
  if (pathname === "/current.svg") pathname = "/current.html";

  const filePath = path.join(publicDir, pathname);
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type =
      ext === ".html" ? "text/html; charset=utf-8" :
      ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
      ext === ".json" ? "application/json; charset=utf-8" :
      ext === ".txt" ? "text/plain; charset=utf-8" :
      "application/octet-stream";

    const noCache = NO_CACHE_PATHS.has(pathname) || pathname.startsWith("/days/");
    res.writeHead(200, {
      "content-type": type,
      "cache-control": noCache ? "no-cache, no-store, must-revalidate" : "public, max-age=0"
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not found");
  }
}

async function handleApi(req, res, url) {
  const config = getConfig();

  if (req.method === "GET" && url.pathname === "/__status") {
    jsonResponse(res, 200, await getStatus(config));
    return true;
  }

  if (req.method === "POST" && url.pathname === "/__rebuild-html") {
    try {
      const result = await rebuildCurrentHtml({ config });
      jsonResponse(res, 200, result);
    } catch (error) {
      jsonResponse(res, 500, { ok: false, error: error?.message || String(error) });
    }
    return true;
  }

  if (req.method === "POST" && url.pathname === "/__refresh") {
    const slot = url.searchParams.get("slot") || preferredWeatherSlot(new Date(), config);
    try {
      const result = await generateWeatherSlot(slot, { config, activate: true });
      jsonResponse(res, 200, { ok: true, slot, ...result });
    } catch (error) {
      jsonResponse(res, 500, { ok: false, error: error?.message || String(error) });
    }
    return true;
  }

  if (req.method === "POST" && url.pathname === "/__tick") {
    try {
      const result = await schedulerTick({ config });
      jsonResponse(res, 200, { ok: true, ...result });
    } catch (error) {
      jsonResponse(res, 500, { ok: false, error: error?.message || String(error) });
    }
    return true;
  }

  const activateMatch = url.pathname.match(/^\/__activate\/(morning|evening)$/);
  if (req.method === "POST" && activateMatch) {
    try {
      const result = await activateWeatherSlot(activateMatch[1], { config });
      jsonResponse(res, 200, { ok: true, ...result });
    } catch (error) {
      jsonResponse(res, 500, { ok: false, error: error?.message || String(error) });
    }
    return true;
  }

  if (req.method === "POST" && url.pathname === "/__alternate") {
    try {
      const body = await readRequestBody(req);
      const file = body.file ? path.resolve(rootDir, body.file) : null;
      const result = await showAlternateContent(
        { html: body.html, file, title: body.title },
        {
          config,
          durationMinutes: body.durationMinutes,
          revertSlot: body.revertSlot
        }
      );
      jsonResponse(res, 200, { ok: true, ...result });
    } catch (error) {
      jsonResponse(res, 500, { ok: false, error: error?.message || String(error) });
    }
    return true;
  }

  return false;
}

async function runServer(mode) {
  const config = getConfig();
  await mkdir(publicDir, { recursive: true });
  await mkdir(path.join(publicDir, "days"), { recursive: true });

  const schedulerOptions =
    mode === "dev" ? { config, skipPreferredActivate: true } : { config };
  const initial = await schedulerTick(schedulerOptions);
  await rebuildCurrentHtml({ config }).catch(() => {});
  console.log(JSON.stringify({ mode, boot: initial }, null, 2));

  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    handleApi(req, res, url)
      .then(handled => {
        if (handled) return;
        return serveStatic(req, res);
      })
      .catch(error => {
        res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
        res.end(error?.message || String(error));
      });
  });

  server.listen(port, () => {
    console.log(`Serving http://127.0.0.1:${port}`);
    console.log(`Display URL: http://127.0.0.1:${port}/current.html`);
    console.log(`Status: http://127.0.0.1:${port}/__status`);
  });

  if (mode === "dev" || mode === "serve") {
    const intervalMs = Number(process.env.SCHEDULER_INTERVAL_MS || 60_000);
    setInterval(() => {
      schedulerTick(schedulerOptions).catch(error => {
        console.error("scheduler tick failed:", error);
      });
    }, intervalMs);
  }
}

async function runCli(command, args) {
  const config = getConfig();
  await mkdir(publicDir, { recursive: true });
  await mkdir(path.join(publicDir, "days"), { recursive: true });

  if (command === "rebuild") {
    const result = await rebuildCurrentHtml({ config });
    console.log(JSON.stringify({ command, ...result }, null, 2));
    return;
  }

  if (command === "generate") {
    const slot = args[0] || preferredWeatherSlot(new Date(), config);
    const result = await generateWeatherSlot(slot, { config, activate: true });
    console.log(JSON.stringify({ command, slot, ...result }, null, 2));
    return;
  }

  if (command === "activate") {
    const slot = args[0] || preferredWeatherSlot(new Date(), config);
    const result = await activateWeatherSlot(slot, { config });
    console.log(JSON.stringify({ command, ...result }, null, 2));
    return;
  }

  if (command === "alternate") {
    const fileFlag = args.indexOf("--file");
    const file = fileFlag >= 0 ? path.resolve(rootDir, args[fileFlag + 1]) : null;
    const result = await showAlternateContent({ file, title: args[0] !== "--file" ? args[0] : "alternate" }, { config });
    console.log(JSON.stringify({ command, ...result }, null, 2));
    return;
  }

  if (command === "status") {
    console.log(JSON.stringify(await getStatus(config), null, 2));
    return;
  }

  if (command === "tick") {
    console.log(JSON.stringify(await schedulerTick({ config }), null, 2));
    return;
  }

  if (command === "build") {
    const tick = await schedulerTick({ config });
    const rebuilt = await rebuildCurrentHtml({ config });
    console.log(JSON.stringify({ command: "build", tick, rebuilt }, null, 2));
    return;
  }

  if (command === "dev" || command === "serve") {
    await runServer(command);
    return;
  }

  throw new Error(`unknown command: ${command || "(empty)"}`);
}

if (!existsSync(publicDir)) {
  await mkdir(publicDir, { recursive: true });
}

await loadEnvFile();

const command = process.argv[2] || "dev";
const args = process.argv.slice(3);

runCli(command, args).catch(error => {
  console.error(error);
  process.exit(1);
});
