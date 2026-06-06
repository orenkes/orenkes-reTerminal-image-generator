import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { existingPublishPaths } from "./publish-weather.mjs";

const STATE_DIR = path.join(process.cwd(), "state");
const PUBLISH_STATE_FILE = path.join(STATE_DIR, "publish-state.json");
const LOG_FILE = path.join(STATE_DIR, "weather-publish-log.jsonl");

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

async function sleep(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

export function publishPathsForState(pending, cwd = process.cwd()) {
  if (!pending?.date || !pending?.slot) {
    return existingPublishPaths(cwd);
  }

  return [
    "public/current.html",
    "public/current.json",
    "public/current.png",
    "public/current-bg.jpg",
    "public/current.prompt.txt",
    "public/display-state.json",
    `public/days/${pending.date}`,
    "docs/current.html",
    "docs/current.json",
    "docs/current.png",
    "docs/current-bg.jpg",
    "docs/current.prompt.txt",
    "docs/display-state.json",
    `docs/days/${pending.date}`,
    `history/days/${pending.date}/${pending.slot}`
  ].filter(entry => existsSync(path.join(cwd, entry)));
}

function gitSha(args) {
  return run("git", ["rev-parse", ...args]).trim();
}

async function appendRunLog(entry) {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(LOG_FILE, JSON.stringify(entry) + "\n", {
    encoding: "utf8",
    flag: "a"
  });
}

async function loadPublishState() {
  if (!existsSync(PUBLISH_STATE_FILE)) return null;
  return JSON.parse(await readFile(PUBLISH_STATE_FILE, "utf8"));
}

async function writePublishState(entry) {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(PUBLISH_STATE_FILE, `${JSON.stringify(entry, null, 2)}\n`, "utf8");
}

async function main() {
  const startedAt = new Date().toISOString();
  const pending = await loadPublishState();

  if (!pending || pending.status !== "pending") {
    const result = { ok: true, status: "idle", reason: "no pending publish marker" };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  try {
    await writePublishState({
      ...pending,
      status: "publishing",
      publishStartedAt: startedAt
    });

    run("git", ["add", "-A", ...publishPathsForState(pending)]);

    const cached = spawnSync("git", ["diff", "--cached", "--quiet"], { stdio: "ignore" });
    if (cached.status === 0) {
      run("git", ["fetch", "origin", "main"]);
      const head = gitSha(["HEAD"]);
      const remote = gitSha(["origin/main"]);
      const result = {
        ok: true,
        status: "no_changes",
        slot: pending.slot,
        head,
        remote,
        pushed: head === remote
      };
      await writePublishState({
        ...pending,
        status: "published",
        publishedAt: new Date().toISOString(),
        head,
        remote
      });
      await appendRunLog({
        startedAt,
        finishedAt: new Date().toISOString(),
        slot: pending.slot,
        status: "no_changes",
        ...result
      });
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    const commitMessage = `chore: publish ${pending.slot} weather for ${pending.date}`;
    run("git", ["commit", "-m", commitMessage]);

    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const push = spawnSync("git", ["push", "origin", "main"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
      });

      if (push.status === 0) {
        lastError = null;
        break;
      }

      lastError =
        [push.stdout, push.stderr].filter(Boolean).join("\n").trim() ||
        `git push failed with status ${push.status}`;
      if (attempt < 3) {
        await sleep(2000 * attempt);
      }
    }

    if (lastError) {
      throw new Error(`push failed after 3 attempts:\n${lastError}`);
    }

    run("git", ["fetch", "origin", "main"]);
    const head = gitSha(["HEAD"]);
    const remote = gitSha(["origin/main"]);
    if (head !== remote) {
      throw new Error(`push verification failed: HEAD ${head} does not match origin/main ${remote}`);
    }

    await writePublishState({
      ...pending,
      status: "published",
      publishedAt: new Date().toISOString(),
      head,
      remote
    });

    const result = { ok: true, slot: pending.slot, head, remote, pushed: true };
    await appendRunLog({
      startedAt,
      finishedAt: new Date().toISOString(),
      slot: pending.slot,
      status: "success",
      ...result
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    await writePublishState({
      ...(pending || {}),
      status: "failed",
      failedAt: new Date().toISOString(),
      error: error?.message || String(error)
    });
    await appendRunLog({
      startedAt,
      finishedAt: new Date().toISOString(),
      slot: pending?.slot || null,
      status: "failed",
      error: error?.message || String(error)
    });
    throw error;
  }
}

const isMainModule =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  main().catch(error => {
    console.error(error?.message || String(error));
    process.exit(1);
  });
}
