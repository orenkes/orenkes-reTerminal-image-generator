import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

const STATE_DIR = path.join(process.cwd(), "state");
const PUBLISH_STATE_FILE = path.join(STATE_DIR, "publish-state.json");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    const message = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(message || `${command} ${args.join(" ")} failed with status ${result.status}`);
  }

  return result.stdout.trim();
}

function getSlot(arg) {
  const slot = String(arg || "").toLowerCase().trim();
  if (slot === "morning" || slot === "evening") return slot;
  throw new Error("usage: node scripts/queue-weather-slot.mjs <morning|evening>");
}

async function writePublishState(entry) {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(PUBLISH_STATE_FILE, `${JSON.stringify(entry, null, 2)}\n`, "utf8");
}

async function main() {
  const slot = getSlot(process.argv[2]);
  run("npm", ["run", `generate:${slot}`]);

  const current = JSON.parse(await readFile(path.join(process.cwd(), "public/current.json"), "utf8"));
  const queuedAt = new Date().toISOString();
  const state = {
    status: "pending",
    slot,
    date: current?.date || queuedAt.slice(0, 10),
    queuedAt,
    generatedAt: current?.generatedAt || null
  };

  await writePublishState(state);
  console.log(JSON.stringify({ ok: true, state }, null, 2));
}

const isMainModule =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  main().catch(error => {
    console.error(error?.message || String(error));
    process.exit(1);
  });
}
