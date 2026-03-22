const fs = require("fs");
const path = require("path");

const packageJson = require("../package.json");

const buildDate = new Date().toISOString();
const buildInfo = {
  buildDate,
  version: packageJson.version,
};

fs.writeFileSync(
  path.join(process.cwd(), "public", "build-info.json"),
  JSON.stringify(buildInfo),
);

console.log(
  `Build info written to public/build-info.json (version: ${buildInfo.version})`,
);
