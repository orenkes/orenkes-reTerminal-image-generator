import { mkdir, rm, cp, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function syncDocs(rootDir = path.resolve(process.cwd())) {
  const publicDir = path.join(rootDir, "public");
  const docsDir = path.join(rootDir, "docs");

  await rm(docsDir, { recursive: true, force: true });
  await mkdir(docsDir, { recursive: true });
  await cp(publicDir, docsDir, { recursive: true, force: true });
  await rm(path.join(docsDir, "current.svg"), { force: true });
  await writeFile(path.join(docsDir, ".gitkeep"), "", "utf8");

  console.log(`Synced ${publicDir} -> ${docsDir}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await syncDocs();
}
