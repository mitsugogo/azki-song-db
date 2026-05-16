const fs = require("node:fs");
const path = require("node:path");

const nextDir = path.join(process.cwd(), ".next");

if (!fs.existsSync(nextDir)) {
  process.exit(0);
}

const requiredFiles = [
  "node_modules/@swc/helpers/esm/_interop_require_default.js",
  "node_modules/@swc/helpers/esm/_interop_require_wildcard.js",
];

function collectNftFiles(dirPath, result = []) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectNftFiles(entryPath, result);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".nft.json")) {
      result.push(entryPath);
    }
  }
  return result;
}

function normalizePathForTrace(filePath) {
  return filePath.split(path.sep).join("/");
}

let updatedCount = 0;
for (const tracePath of collectNftFiles(nextDir)) {
  const trace = JSON.parse(fs.readFileSync(tracePath, "utf8"));
  if (!Array.isArray(trace.files)) {
    continue;
  }

  const traceDir = path.dirname(tracePath);
  let changed = false;

  for (const requiredFile of requiredFiles) {
    const relativePath = normalizePathForTrace(
      path.relative(traceDir, path.join(process.cwd(), requiredFile)),
    );

    if (!trace.files.includes(relativePath)) {
      trace.files.push(relativePath);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(tracePath, JSON.stringify(trace));
    updatedCount += 1;
  }
}

if (updatedCount > 0) {
  console.log(
    `Updated ${updatedCount} Next trace manifest(s) with missing @swc/helpers ESM files.`,
  );
}
