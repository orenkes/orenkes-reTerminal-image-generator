import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

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

function getSlot(arg) {
  const slot = String(arg || "").toLowerCase().trim();
  if (slot === "morning" || slot === "evening") return slot;
  throw new Error(`usage: node scripts/publish-weather.mjs <morning|evening>`);
}

function gitSha(args) {
  return run("git", ["rev-parse", ...args]).trim();
}

async function main() {
  const slot = getSlot(process.argv[2]);

  run("npm", ["run", `generate:${slot}`]);

  const current = JSON.parse(await readFile("public/current.json", "utf8"));
  const date = current?.date || new Date().toISOString().slice(0, 10);
  const commitMessage = `chore: publish ${slot} weather for ${date}`;

  run("git", ["add", "-A", "public", "docs"]);

  const cached = spawnSync("git", ["diff", "--cached", "--quiet"], { stdio: "ignore" });
  if (cached.status === 0) {
    console.log("No staged changes to commit.");
    const head = gitSha(["HEAD"]);
    run("git", ["fetch", "origin", "main"]);
    const remote = gitSha(["origin/main"]);
    console.log(JSON.stringify({ ok: true, slot, head, remote, pushed: head === remote }, null, 2));
    return;
  }

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

    lastError = [push.stdout, push.stderr].filter(Boolean).join("\n").trim() || `git push failed with status ${push.status}`;
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

  console.log(JSON.stringify({ ok: true, slot, head, remote, pushed: true }, null, 2));
}

main().catch(error => {
  console.error(error?.message || String(error));
  process.exit(1);
});
