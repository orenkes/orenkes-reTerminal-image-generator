import { mkdir, rm, cp, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = path.resolve(process.cwd());
const publicDir = path.join(rootDir, "public");
const docsDir = path.join(rootDir, "docs");

await rm(docsDir, { recursive: true, force: true });
await mkdir(docsDir, { recursive: true });
await cp(publicDir, docsDir, { recursive: true, force: true });
await writeFile(path.join(docsDir, ".gitkeep"), "", "utf8");

console.log(`Synced ${publicDir} -> ${docsDir}`);
