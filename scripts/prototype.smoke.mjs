import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

const indexHtml = await readFile("public/index.html", "utf8");
assert.match(indexHtml, /current\.png/);
assert.doesNotMatch(indexHtml, /iframe/);

assert.ok(existsSync("public/current.html"), "expected current.html to exist");
assert.ok(existsSync("public/current.png"), "expected current.png to exist");
