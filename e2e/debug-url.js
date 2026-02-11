const host = "127.0.0.1";
const port = "3001";
const defaultBase = `http://${host}:${port}`;
const baseApiRaw = "/api/songs";
try {
  new URL(baseApiRaw);
  console.log("absolute:", baseApiRaw);
} catch (e) {
  console.log("resolved:", new URL(baseApiRaw, defaultBase).toString());
}
