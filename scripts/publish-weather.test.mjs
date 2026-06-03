import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { existingPublishPaths } from "./publish-weather.mjs";

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "reterminal-publish-"));

try {
  await mkdir(path.join(tempRoot, "public"), { recursive: true });
  await mkdir(path.join(tempRoot, "docs"), { recursive: true });
  await mkdir(path.join(tempRoot, "history"), { recursive: true });

  assert.deepEqual(existingPublishPaths(tempRoot), ["public", "docs", "history"]);

  await mkdir(path.join(tempRoot, "state"), { recursive: true });
  assert.deepEqual(existingPublishPaths(tempRoot), ["public", "docs", "history", "state"]);
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
