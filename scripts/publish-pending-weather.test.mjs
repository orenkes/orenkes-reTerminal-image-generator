import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { publishPathsForState } from "./publish-pending-weather.mjs";

function run(cwd, command, args) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.status !== 0) {
    throw new Error(
      [`${command} ${args.join(" ")}`, result.stdout, result.stderr].filter(Boolean).join("\n")
    );
  }

  return result.stdout.trim();
}

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "reterminal-pending-publish-"));

try {
  run(tempRoot, "git", ["init"]);
  run(tempRoot, "git", ["config", "user.name", "Codex"]);
  run(tempRoot, "git", ["config", "user.email", "codex@example.com"]);

  await mkdir(path.join(tempRoot, "public", "days", "2026-06-06", "morning"), { recursive: true });
  await mkdir(path.join(tempRoot, "public", "days", "2026-06-05"), { recursive: true });
  await mkdir(path.join(tempRoot, "docs", "days", "2026-06-06", "morning"), { recursive: true });
  await mkdir(path.join(tempRoot, "history", "days", "2026-06-06", "morning"), { recursive: true });

  await writeFile(path.join(tempRoot, "public", "current.html"), "old\n", "utf8");
  await writeFile(path.join(tempRoot, "public", "current.json"), "{}\n", "utf8");
  await writeFile(path.join(tempRoot, "public", "display-state.json"), "{}\n", "utf8");
  await writeFile(path.join(tempRoot, "public", "days", "2026-06-06", "manifest.json"), "{}\n", "utf8");
  await writeFile(path.join(tempRoot, "public", "days", "2026-06-06", "morning", "index.html"), "slot\n", "utf8");
  await writeFile(path.join(tempRoot, "public", "days", "2026-06-05", "stale.txt"), "stale\n", "utf8");
  await writeFile(path.join(tempRoot, "docs", "current.html"), "old\n", "utf8");
  await writeFile(path.join(tempRoot, "docs", "display-state.json"), "{}\n", "utf8");
  await writeFile(path.join(tempRoot, "docs", "days", "2026-06-06", "manifest.json"), "{}\n", "utf8");
  await writeFile(path.join(tempRoot, "docs", "days", "2026-06-06", "morning", "index.html"), "slot\n", "utf8");
  await writeFile(path.join(tempRoot, "history", "days", "2026-06-06", "morning", "index.html"), "history\n", "utf8");

  run(tempRoot, "git", ["add", "."]);
  run(tempRoot, "git", ["commit", "-m", "initial"]);

  await writeFile(path.join(tempRoot, "public", "current.html"), "new\n", "utf8");
  await writeFile(path.join(tempRoot, "public", "days", "2026-06-06", "morning", "index.html"), "updated\n", "utf8");
  await rm(path.join(tempRoot, "public", "days", "2026-06-05", "stale.txt"));
  await writeFile(path.join(tempRoot, "public", "unrelated.txt"), "do not stage\n", "utf8");

  run(tempRoot, "git", [
    "add",
    "-A",
    ...publishPathsForState({ date: "2026-06-06", slot: "morning" }, tempRoot)
  ]);

  const staged = run(tempRoot, "git", ["diff", "--cached", "--name-only"])
    .split("\n")
    .filter(Boolean)
    .sort();

  assert.deepEqual(staged, [
    "public/current.html",
    "public/days/2026-06-06/morning/index.html"
  ]);

  const unrelated = await readFile(path.join(tempRoot, "public", "unrelated.txt"), "utf8");
  assert.equal(unrelated, "do not stage\n");
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
