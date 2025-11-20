import fs from "fs";
import path from "path";

const root = path.resolve(process.cwd());
const src = path.join(root, "node_modules", "sql.js", "dist", "sql-wasm.wasm");
const dstDir = path.join(root, "public");
const dst = path.join(dstDir, "sql-wasm.wasm");

if (!fs.existsSync(src)) {
  console.log(
    "sql-wasm.wasm not found in node_modules/sql.js/dist. Please install dependencies or provide the wasm manually."
  );
  process.exit(0);
}

if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
fs.copyFileSync(src, dst);
console.log("Copied sql-wasm.wasm to public/sql-wasm.wasm");
