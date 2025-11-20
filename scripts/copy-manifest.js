import fs from "fs";
import path from "path";

const root = path.resolve(process.cwd());
const dist = path.join(root, "dist");

if (!fs.existsSync(dist)) {
  console.error("dist folder not found. Run pnpm build first.");
  process.exit(1);
}

// Read root package.json
const pkgPath = path.join(root, "package.json");
if (!fs.existsSync(pkgPath)) {
  console.error("package.json not found in project root.");
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const minimal = {
  name: pkg.name || "smart-typing",
  version: pkg.version || "0.0.0",
  description: pkg.description || "",
  author: pkg.author || "",
  license: pkg.license || "MIT",
  logseq: Object.assign({}, pkg.logseq || {}, { main: "index.html" }),
};

fs.writeFileSync(
  path.join(dist, "package.json"),
  JSON.stringify(minimal, null, 2)
);
console.log("Copied minimal package.json to dist/");

// Copy runtime assets from public to dist
const publicDir = path.join(root, "public");
const assets = ["english-dict.sqlite", "sql-wasm.wasm"];
for (const a of assets) {
  const src = path.join(publicDir, a);
  const dst = path.join(dist, a);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`Copied ${a} to dist/`);
  } else {
    console.log(`Asset ${a} not found in public/, skipping.`);
  }
}

console.log("copy-manifest complete.");
