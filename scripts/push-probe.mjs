import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

const STATE_DIR = path.join(process.cwd(), "state");
const PROBE_FILE = path.join(STATE_DIR, "push-probe.json");

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

function gitSha(args) {
  return run("git", ["rev-parse", ...args]).trim();
}

async function readProbeState() {
  if (!existsSync(PROBE_FILE)) {
    return { runCount: 0 };
  }
  return JSON.parse(await readFile(PROBE_FILE, "utf8"));
}

async function main() {
  await mkdir(STATE_DIR, { recursive: true });
  const current = await readProbeState();
  const next = {
    runCount: Number(current.runCount || 0) + 1,
    lastRunAt: new Date().toISOString()
  };

  await writeFile(PROBE_FILE, JSON.stringify(next, null, 2) + "\n", "utf8");

  run("git", ["add", "state/push-probe.json"]);
  const cached = spawnSync("git", ["diff", "--cached", "--quiet"], { stdio: "ignore" });
  if (cached.status === 0) {
    console.log("No staged probe changes.");
    return;
  }

  run("git", ["commit", "-m", `chore: update push probe ${next.lastRunAt}`]);
  run("git", ["push", "origin", "main"]);
  run("git", ["fetch", "origin", "main"]);

  const head = gitSha(["HEAD"]);
  const remote = gitSha(["origin/main"]);
  if (head !== remote) {
    throw new Error(`push verification failed: HEAD ${head} does not match origin/main ${remote}`);
  }

  console.log(JSON.stringify({ ok: true, head, remote, ...next }, null, 2));
}

const isMainModule =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  main().catch(error => {
    console.error(error?.message || String(error));
    process.exit(1);
  });
}
