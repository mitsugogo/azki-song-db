const fs = require("fs");
const { execSync } = require("child_process");

const lastCommitDate = execSync("git log -1 --format=%cd --date=iso-strict")
  .toString()
  .trim();
const envContent = `LAST_UPDATED="${lastCommitDate}"`;

fs.writeFileSync(".env.production", envContent);
