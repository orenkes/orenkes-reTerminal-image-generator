import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getChromeExecutablePath, renderHtmlToPng } from "./html-to-png.mjs";

const chromePath = getChromeExecutablePath();
assert.ok(chromePath, "Expected a local Chrome executable to be available");

const tempDir = await mkdtemp(path.join(os.tmpdir(), "reterminal-html-to-png-"));

await writeFile(
  path.join(tempDir, "current.html"),
  `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        html, body { margin: 0; width: 800px; height: 480px; }
        body { display: grid; place-items: center; background: linear-gradient(135deg, #88c7ff, #ffe7a3); font: 700 48px system-ui, sans-serif; }
      </style>
    </head>
    <body>PNG</body>
  </html>`,
  "utf8"
);

await renderHtmlToPng({ rootDir: tempDir, env: {} });
assert.ok(existsSync(path.join(tempDir, "current.png")), "Expected screenshot PNG to exist");

await rm(tempDir, { recursive: true, force: true });
