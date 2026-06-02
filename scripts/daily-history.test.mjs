import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { cleanupOldDays } from "./daily.mjs";

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "reterminal-history-"));
const publicDir = path.join(tempRoot, "public");
const historyDir = path.join(tempRoot, "history");
const currentDate = "2026-06-02";
const oldDate = "2026-06-01";

const oldSlotDir = path.join(publicDir, "days", oldDate, "morning");
const currentSlotDir = path.join(publicDir, "days", currentDate, "morning");
await mkdir(oldSlotDir, { recursive: true });
await mkdir(currentSlotDir, { recursive: true });
await writeFile(path.join(oldSlotDir, "index.html"), "<html>old</html>", "utf8");
await writeFile(path.join(currentSlotDir, "index.html"), "<html>current</html>", "utf8");

const removed = await cleanupOldDays(
  { publicDir, historyDirName: historyDir, daysDirName: "days" },
  currentDate
);

assert.deepEqual(removed, [oldDate]);
assert.ok(!existsSync(path.join(publicDir, "days", oldDate)), "old day should be removed from public");
assert.ok(
  existsSync(path.join(historyDir, "days", oldDate, "morning", "index.html")),
  "old day should be archived outside public"
);
assert.ok(
  existsSync(path.join(publicDir, "days", currentDate, "morning", "index.html")),
  "current day should remain in public"
);

await rm(tempRoot, { recursive: true, force: true });
