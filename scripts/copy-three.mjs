import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "node_modules", "three", "build", "three.module.js");
const destDir = join(root, "vendor");
const dest = join(destDir, "three.module.js");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log("Copied three.module.js to vendor/");
