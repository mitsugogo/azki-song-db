const fs = require("fs");
const path = require("path");

const buildDate = new Date().toISOString();
const buildInfo = { buildDate };

fs.writeFileSync(
  path.join(process.cwd(), "public", "build-info.json"),
  JSON.stringify(buildInfo)
);

console.log("Build info written to public/build-info.json");
