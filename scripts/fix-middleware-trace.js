const fs = require("node:fs");
const path = require("node:path");

const tracePath = path.join(
  process.cwd(),
  ".next",
  "server",
  "middleware.js.nft.json",
);

if (!fs.existsSync(tracePath)) {
  process.exit(0);
}

const trace = JSON.parse(fs.readFileSync(tracePath, "utf8"));
const requiredFiles = [
  "../../node_modules/@swc/helpers/esm/_interop_require_default.js",
  "../../node_modules/@swc/helpers/esm/_interop_require_wildcard.js",
];

let changed = false;
for (const requiredFile of requiredFiles) {
  if (!trace.files.includes(requiredFile)) {
    trace.files.push(requiredFile);
    changed = true;
  }
}

if (changed) {
  fs.writeFileSync(tracePath, JSON.stringify(trace));
  console.log("Updated middleware trace with missing @swc/helpers ESM files.");
}
