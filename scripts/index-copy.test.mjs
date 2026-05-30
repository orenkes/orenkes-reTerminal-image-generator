import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile("public/index.html", "utf8");
assert.match(html, /current\.png/);
assert.doesNotMatch(html, /iframe/);
